/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  DownloadItem,
  QualityOption,
  BatchItem,
  ExtractedMediaInfo,
} from './types';
import { inspectMediaUrl, inspectMediaUrlAsync, generateStandardQualities } from './services/urlParser';
import {
  loadSettings,
  saveSettings,
  getDownloadHistory,
  saveDownloadHistory,
  createDownloadItem,
  AppSettings,
  triggerBrowserFileDownload,
  startRealDownloadStream,
  ActiveDownloadHandle,
} from './services/downloadEngine';
import { executeUniversalDownload, isMobileApp } from './services/mobileDownloadService';
import { createEncryptedMediaRecord } from './services/cryptoVault';
import { playCompletionChime, sendDesktopNotification } from './services/notificationService';

import { Header } from './components/Header';
import { UrlInputBar } from './components/UrlInputBar';
import { DownloadModal } from './components/DownloadModal';
import { ActiveDownloads } from './components/ActiveDownloads';
import { SocialFeedBrowser } from './components/SocialFeedBrowser';
import { BatchPlaylistDownloader } from './components/BatchPlaylistDownloader';
import { OfflineVault } from './components/OfflineVault';
import { DownloadHistory } from './components/DownloadHistory';
import { SettingsModal } from './components/SettingsModal';
import { StreamDebuggerModal } from './components/StreamDebuggerModal';

export default function App() {
  // Dark mode defaults to OFF (Light mode) as requested by user
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('deathless_dark_mode');
    return saved === 'true'; // defaults to false if not saved
  });

  const [currentTab, setCurrentTab] = useState<'downloader' | 'social' | 'batch' | 'vault' | 'history'>('downloader');
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStreamDebuggerOpen, setIsStreamDebuggerOpen] = useState(false);
  const [streamDebuggerTargetId, setStreamDebuggerTargetId] = useState<string | undefined>(undefined);

  // Active Downloads & History
  const [activeItems, setActiveItems] = useState<DownloadItem[]>([]);
  const [history, setHistory] = useState<DownloadItem[]>(getDownloadHistory);

  // Analyzing & Modal state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pendingMediaInfo, setPendingMediaInfo] = useState<ExtractedMediaInfo | null>(null);
  const [isQualityModalOpen, setIsQualityModalOpen] = useState(false);

  // Active item to play in vault
  const [vaultFileToPlay, setVaultFileToPlay] = useState<string | null>(null);

  // Aggregate Speed
  const [totalSpeedMbps, setTotalSpeedMbps] = useState(0);

  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem('deathless_dark_mode', darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const downloadHandlesRef = useRef<Map<string, ActiveDownloadHandle>>(new Map());

  // Trigger completion sequence for an item
  const handleItemCompleted = (completedItem: DownloadItem, realBlob?: Blob) => {
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
    } catch {
      // Ignore if blocked
    }

    if (settings.soundNotifications) {
      playCompletionChime();
    }

    if (settings.desktopNotifications) {
      sendDesktopNotification(completedItem.title, completedItem.fileName);
    }

    if (completedItem.isEncrypted) {
      createEncryptedMediaRecord(
        completedItem.title,
        completedItem.category,
        completedItem.format,
        completedItem.quality.label,
        completedItem.totalBytes,
        completedItem.thumbnail,
        realBlob
      ).catch((err) => console.error('Failed to vault:', err));
    }

    executeUniversalDownload(completedItem, realBlob);

    setHistory((prevHist) => {
      const newHist = [completedItem, ...prevHist];
      saveDownloadHistory(newHist);
      return newHist;
    });

    downloadHandlesRef.current.delete(completedItem.id);
  };

  // Real Streaming and Download loop manager
  useEffect(() => {
    activeItems.forEach((item) => {
      if (item.status === 'downloading' && !downloadHandlesRef.current.has(item.id)) {
        const handle = startRealDownloadStream(
          item,
          (downloadedBytes, totalBytes, speedBytesPerSec, chunks) => {
            setActiveItems((prev) =>
              prev.map((it) => {
                if (it.id !== item.id) return it;
                const eta = Math.ceil((totalBytes - downloadedBytes) / (speedBytesPerSec || 1));
                return {
                  ...it,
                  downloadedBytes,
                  totalBytes,
                  speedBytesPerSec,
                  etaSeconds: eta,
                  chunks,
                };
              })
            );
            setTotalSpeedMbps(speedBytesPerSec / (1024 * 1024));
          },
          (realBlob, isBotFallback) => {
            const blobUrl = URL.createObjectURL(realBlob);
            const actualReceivedBytes = realBlob.size;
            const isBotBlocked = !!isBotFallback || (item.totalBytes > 5 * 1024 * 1024 && actualReceivedBytes < 500 * 1024);

            const finished: DownloadItem = {
              ...item,
              downloadedBytes: isBotBlocked ? actualReceivedBytes : item.totalBytes,
              status: 'completed',
              speedBytesPerSec: 0,
              etaSeconds: 0,
              completedAt: Date.now(),
              mediaBlobUrl: blobUrl,
              isFallbackStream: isBotBlocked,
              botChallengeTriggered: isBotBlocked,
              chunks: item.chunks.map((c) => ({ ...c, status: 'completed' as const })),
            };

            setActiveItems((prev) =>
              prev.map((it) => (it.id === item.id ? finished : it))
            );

            handleItemCompleted(finished, realBlob);
          },
          (err) => {
            console.warn(`Real stream for ${item.id} encountered error, continuing with fallback engine:`, err);
          }
        );

        downloadHandlesRef.current.set(item.id, handle);
      }
    });
  }, [activeItems, settings]);

  // Main Download Engine Tick Loop (Fallback and multi-chunk parallel transfers & deathless resumes)
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveItems((prev) => {
        let currentAggregateSpeedBytes = 0;
        let hasChanges = false;

        const updated = prev.map((item) => {
          if (item.status !== 'downloading' && item.status !== 'resuming') {
            return item;
          }

          if (downloadHandlesRef.current.has(item.id)) {
            currentAggregateSpeedBytes += item.speedBytesPerSec;
            return item;
          }

          hasChanges = true;
          const baseSpeedBytes = (35 + Math.random() * 40) * 1024 * 1024;
          const tickIntervalSec = 0.2;
          const bytesToAdvance = Math.floor(baseSpeedBytes * tickIntervalSec);

          const newDownloaded = Math.min(item.totalBytes, item.downloadedBytes + bytesToAdvance);
          currentAggregateSpeedBytes += baseSpeedBytes;

          const chunkShare = Math.floor(bytesToAdvance / (item.chunks.length || 1));
          const updatedChunks = item.chunks.map((chunk) => {
            const newChunkBytes = Math.min(chunk.totalBytes, chunk.downloadedBytes + chunkShare);
            return {
              ...chunk,
              downloadedBytes: newChunkBytes,
              status: newChunkBytes >= chunk.totalBytes ? ('completed' as const) : ('downloading' as const),
              speedMbps: baseSpeedBytes / (1024 * 1024 * item.chunks.length),
            };
          });

          if (newDownloaded >= item.totalBytes) {
            const completedItem: DownloadItem = {
              ...item,
              downloadedBytes: item.totalBytes,
              status: 'completed',
              speedBytesPerSec: 0,
              etaSeconds: 0,
              completedAt: Date.now(),
              chunks: updatedChunks.map((c) => ({ ...c, status: 'completed' as const })),
            };

            handleItemCompleted(completedItem);
            return completedItem;
          }

          const remainingBytes = item.totalBytes - newDownloaded;
          const eta = Math.ceil(remainingBytes / (baseSpeedBytes || 1));

          return {
            ...item,
            downloadedBytes: newDownloaded,
            speedBytesPerSec: baseSpeedBytes,
            etaSeconds: eta,
            chunks: updatedChunks,
          };
        });

        setTotalSpeedMbps(currentAggregateSpeedBytes / (1024 * 1024));
        return hasChanges ? updated : prev;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [settings]);

  // Handle URL analyze (from Manual input or Social media feed)
  const handleAnalyzeUrl = async (rawUrl: string, autoStartImmediately = false) => {
    if (!rawUrl.trim()) return;
    setIsAnalyzing(true);

    try {
      const extracted = await inspectMediaUrlAsync(rawUrl);
      setIsAnalyzing(false);

      if (autoStartImmediately || settings.autoStartOnPaste) {
        const preferredTag = settings.defaultVideoQuality || '1080p';
        const defQuality =
          extracted.availableQualities.find((q) => q.qualityTag === preferredTag) ||
          extracted.availableQualities.find((q) => q.qualityTag === '1080p') ||
          extracted.availableQualities[0];
        startDownloadWithQuality(extracted, defQuality, settings.saveToEncryptedVault);
      } else {
        setPendingMediaInfo(extracted);
        setIsQualityModalOpen(true);
      }
    } catch (err) {
      console.warn('Inspect media failed, falling back to local analysis:', err);
      const extracted = inspectMediaUrl(rawUrl);
      setIsAnalyzing(false);
      setPendingMediaInfo(extracted);
      setIsQualityModalOpen(true);
    }
  };

  const startDownloadWithQuality = (
    info: ExtractedMediaInfo,
    quality: QualityOption,
    encryptInVault: boolean
  ) => {
    const newItem = createDownloadItem(info, quality, true, encryptInVault);
    setActiveItems((prev) => [newItem, ...prev]);
    setCurrentTab('downloader');
  };

  // Pause / Resume individual transfer
  const handleTogglePause = (id: string) => {
    setActiveItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const isPaused = item.status === 'paused';
        const handle = downloadHandlesRef.current.get(id);
        if (isPaused) {
          handle?.resume();
        } else {
          handle?.pause();
        }
        return {
          ...item,
          status: isPaused ? ('downloading' as const) : ('paused' as const),
          speedBytesPerSec: isPaused ? item.speedBytesPerSec : 0,
        };
      })
    );
  };

  // Simulate network drop & automatic deathless resume
  const handleSimulateDrop = (id: string) => {
    setActiveItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          status: 'resuming',
          speedBytesPerSec: 0,
          autoResumeCount: item.autoResumeCount + 1,
          chunks: item.chunks.map((c) => ({ ...c, status: 'retrying' as const })),
        };
      })
    );

    // Auto recover after 2 seconds
    setTimeout(() => {
      setActiveItems((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          return {
            ...item,
            status: 'downloading',
            chunks: item.chunks.map((c) => ({ ...c, status: 'downloading' as const })),
          };
        })
      );
    }, 2000);
  };

  // Cancel / remove task
  const handleCancel = (id: string) => {
    const handle = downloadHandlesRef.current.get(id);
    handle?.abort();
    downloadHandlesRef.current.delete(id);
    setActiveItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Bulk actions
  const handlePauseAll = () => {
    setActiveItems((prev) =>
      prev.map((i) => (i.status === 'downloading' ? { ...i, status: 'paused' as const, speedBytesPerSec: 0 } : i))
    );
  };

  const handleResumeAll = () => {
    setActiveItems((prev) =>
      prev.map((i) => (i.status === 'paused' ? { ...i, status: 'downloading' as const } : i))
    );
  };

  const handleClearCompleted = () => {
    setActiveItems((prev) => prev.filter((i) => i.status !== 'completed'));
  };

  // Batch queue handler
  const handleQueueBatch = (batchItems: BatchItem[]) => {
    const newDownloads: DownloadItem[] = batchItems.map((b) => {
      const mediaInfo = inspectMediaUrl(b.url);
      mediaInfo.title = b.title;
      return createDownloadItem(mediaInfo, b.quality, true, settings.saveToEncryptedVault);
    });

    setActiveItems((prev) => [...newDownloads, ...prev]);
    setCurrentTab('downloader');
  };

  // Open in Vault
  const handleOpenInVault = (downloadId: string) => {
    setVaultFileToPlay(downloadId);
    setCurrentTab('vault');
  };

  // Clear history
  const handleClearHistory = () => {
    setHistory([]);
    saveDownloadHistory([]);
  };

  // Remove history item
  const handleRemoveHistoryItem = (id: string) => {
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    saveDownloadHistory(updated);
  };

  // Re-download from history
  const handleRedownload = (item: DownloadItem) => {
    const mediaInfo = inspectMediaUrl(item.originalUrl);
    mediaInfo.title = item.title;
    startDownloadWithQuality(mediaInfo, item.quality, item.isEncrypted);
  };

  // Save Settings
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const activeDownloadingCount = activeItems.filter(
    (i) => i.status === 'downloading' || i.status === 'resuming'
  ).length;

  return (
    <div
      className={`min-h-screen w-full max-w-full overflow-x-hidden font-sans transition-colors duration-200 ${
        darkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* App Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        activeCount={activeDownloadingCount}
        totalSpeedMbps={totalSpeedMbps}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenStreamDebugger={() => {
          setStreamDebuggerTargetId(undefined);
          setIsStreamDebuggerOpen(true);
        }}
      />

      {/* Main Container */}
      <main className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6 overflow-x-hidden">
        {/* URL Input Bar is always accessible on Downloader tab or can be quick-pasted anytime */}
        {currentTab === 'downloader' && (
          <UrlInputBar
            onAnalyzeUrl={handleAnalyzeUrl}
            autoStartOnPaste={settings.autoStartOnPaste}
            setAutoStartOnPaste={(val) => {
              const updated = { ...settings, autoStartOnPaste: val };
              setSettings(updated);
              saveSettings(updated);
            }}
            darkMode={darkMode}
            isAnalyzing={isAnalyzing}
          />
        )}

        {/* Dynamic Tab Views */}
        {currentTab === 'downloader' && (
          <ActiveDownloads
            items={activeItems}
            onTogglePause={handleTogglePause}
            onCancel={handleCancel}
            onSimulateDrop={handleSimulateDrop}
            onRetry={handleTogglePause}
            onPauseAll={handlePauseAll}
            onResumeAll={handleResumeAll}
            onClearCompleted={handleClearCompleted}
            onOpenInVault={handleOpenInVault}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenStreamDebugger={(downloadId) => {
              setStreamDebuggerTargetId(downloadId);
              setIsStreamDebuggerOpen(true);
            }}
            darkMode={darkMode}
          />
        )}

        {currentTab === 'social' && (
          <SocialFeedBrowser
            onSelectVideoForDownload={(url) => handleAnalyzeUrl(url, false)}
            darkMode={darkMode}
          />
        )}

        {currentTab === 'batch' && (
          <BatchPlaylistDownloader onQueueBatch={handleQueueBatch} darkMode={darkMode} />
        )}

        {currentTab === 'vault' && (
          <OfflineVault initialFileToPlay={vaultFileToPlay} darkMode={darkMode} />
        )}

        {currentTab === 'history' && (
          <DownloadHistory
            history={history}
            onClearHistory={handleClearHistory}
            onRemoveItem={handleRemoveHistoryItem}
            onRedownload={handleRedownload}
            onOpenInVault={handleOpenInVault}
            onOpenStreamDebugger={(downloadId) => {
              setStreamDebuggerTargetId(downloadId);
              setIsStreamDebuggerOpen(true);
            }}
            darkMode={darkMode}
          />
        )}
      </main>

      {/* Quality & Format Pop-Up Modal */}
      {isQualityModalOpen && pendingMediaInfo && (
        <DownloadModal
          info={pendingMediaInfo}
          onClose={() => {
            setIsQualityModalOpen(false);
            setPendingMediaInfo(null);
          }}
          onConfirmDownload={(quality, encryptInVault) => {
            startDownloadWithQuality(pendingMediaInfo, quality, encryptInVault);
          }}
          darkMode={darkMode}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setIsSettingsOpen(false)}
          darkMode={darkMode}
          onToggleDarkMode={(val) => setDarkMode(val)}
        />
      )}

      {/* Stream & Headers Debugger Modal */}
      <StreamDebuggerModal
        isOpen={isStreamDebuggerOpen}
        onClose={() => setIsStreamDebuggerOpen(false)}
        initialDownloadId={streamDebuggerTargetId}
        activeDownloads={activeItems}
        darkMode={darkMode}
        onOpenSettings={() => {
          setIsStreamDebuggerOpen(false);
          setIsSettingsOpen(true);
        }}
      />
    </div>
  );
}
