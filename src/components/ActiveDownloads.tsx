import React, { useState } from 'react';
import {
  Pause,
  Play,
  X,
  ShieldCheck,
  Zap,
  Activity,
  Download,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  HardDrive,
  Radio,
  SlidersHorizontal,
  Search,
  ArrowUpDown,
  Filter,
  Repeat,
  Gauge,
  Key,
  Terminal,
} from 'lucide-react';
import { DownloadItem, PlatformType } from '../types';
import { triggerBrowserFileDownload } from '../services/downloadEngine';
import { executeUniversalDownload } from '../services/mobileDownloadService';

interface ActiveDownloadsProps {
  items: DownloadItem[];
  onTogglePause: (id: string) => void;
  onCancel: (id: string) => void;
  onSimulateDrop: (id: string) => void;
  onRetry: (id: string) => void;
  onPauseAll: () => void;
  onResumeAll: () => void;
  onClearCompleted: () => void;
  onOpenInVault?: (downloadId: string) => void;
  onConvertToConverter?: (item: DownloadItem) => void;
  onOpenSettings?: () => void;
  onOpenStreamDebugger?: (downloadId: string) => void;
  speedLimitMbps?: number;
  onSetSpeedLimit?: (limit: number) => void;
  darkMode: boolean;
}

export const ActiveDownloads: React.FC<ActiveDownloadsProps> = ({
  items,
  onTogglePause,
  onCancel,
  onSimulateDrop,
  onRetry,
  onPauseAll,
  onResumeAll,
  onClearCompleted,
  onOpenInVault,
  onConvertToConverter,
  onOpenSettings,
  onOpenStreamDebugger,
  speedLimitMbps = 0,
  onSetSpeedLimit,
  darkMode,
}) => {
  const [expandedChunks, setExpandedChunks] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'downloading' | 'paused' | 'completed'>('all');
  const [platformFilter, setPlatformFilter] = useState<'all' | PlatformType>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'progress-desc' | 'speed-desc' | 'size-desc' | 'name-asc'>('date-desc');

  const toggleChunkDetails = (id: string) => {
    setExpandedChunks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const activeCount = items.filter((i) => i.status === 'downloading' || i.status === 'resuming').length;
  const pausedCount = items.filter((i) => i.status === 'paused').length;
  const completedCount = items.filter((i) => i.status === 'completed').length;

  const formatBytes = (bytes: number): string => {
    if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return bytes + ' B';
  };

  const formatEta = (seconds: number): string => {
    if (seconds <= 0) return 'Finished';
    if (seconds >= 3600) {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      return `${h}h ${m}m remaining`;
    }
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}m ${s}s remaining`;
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'downloading' && (item.status === 'downloading' || item.status === 'resuming')) ||
      (statusFilter === 'paused' && item.status === 'paused') ||
      (statusFilter === 'completed' && item.status === 'completed');
    const matchesPlatform = platformFilter === 'all' || item.platform === platformFilter;
    return matchesSearch && matchesStatus && matchesPlatform;
  });

  // Sort filtered items
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'date-desc') return b.createdAt - a.createdAt;
    if (sortBy === 'progress-desc') {
      const progA = a.downloadedBytes / (a.totalBytes || 1);
      const progB = b.downloadedBytes / (b.totalBytes || 1);
      return progB - progA;
    }
    if (sortBy === 'speed-desc') return b.speedBytesPerSec - a.speedBytesPerSec;
    if (sortBy === 'size-desc') return b.totalBytes - a.totalBytes;
    if (sortBy === 'name-asc') return a.title.localeCompare(b.title);
    return 0;
  });

  if (items.length === 0) {
    return (
      <div
        id="active-downloads-empty"
        className={`p-10 rounded-2xl border text-center transition-all ${
          darkMode ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center mx-auto mb-3">
          <Download className="w-7 h-7" />
        </div>
        <h3 className="font-bold text-base sm:text-lg mb-1">Download Queue is Idle</h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-md mx-auto">
          Paste a link from YouTube, TikTok, Facebook, or any website above, or browse the Social Feed tab to launch high-speed transfers.
        </p>
      </div>
    );
  }

  return (
    <div id="active-transfers-section" className="space-y-4">
      {/* Control Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-500" />
            <span>Active Transfers & Engine Status</span>
          </h3>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
            {items.length} {items.length === 1 ? 'task' : 'tasks'}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activeCount > 0 && (
            <button
              type="button"
              id="pause-all-transfers-btn"
              onClick={onPauseAll}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                darkMode
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Pause className="w-3.5 h-3.5 text-amber-500" />
              <span>Pause All ({activeCount})</span>
            </button>
          )}

          {pausedCount > 0 && (
            <button
              type="button"
              id="resume-all-transfers-btn"
              onClick={onResumeAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-all shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Resume All ({pausedCount})</span>
            </button>
          )}

          {completedCount > 0 && (
            <button
              type="button"
              id="clear-completed-transfers-btn"
              onClick={onClearCompleted}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                darkMode
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              Clear Finished
            </button>
          )}
        </div>
      </div>

      {/* Speed Throttle & Filter / Sort Toolbar */}
      <div
        className={`p-3.5 rounded-2xl border transition-all space-y-3 ${
          darkMode ? 'bg-zinc-900/70 border-zinc-800' : 'bg-white border-slate-200'
        }`}
      >
        {/* Speed Limit Quick Presets */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-zinc-800/80">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-cyan-500" />
            <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
              Download Speed Limit:
            </span>
            <span
              className={`text-xs font-mono font-bold px-1.5 py-0.2 rounded ${
                speedLimitMbps > 0
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  : 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400'
              }`}
            >
              {speedLimitMbps > 0 ? `${speedLimitMbps} MB/s Throttle` : 'Unlimited Bandwidth'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { label: 'Unlimited', val: 0 },
              { label: '50 MB/s', val: 50 },
              { label: '25 MB/s', val: 25 },
              { label: '10 MB/s', val: 10 },
              { label: '5 MB/s', val: 5 },
              { label: '2 MB/s', val: 2 },
            ].map((preset) => (
              <button
                key={preset.val}
                type="button"
                id={`speed-preset-btn-${preset.val}`}
                onClick={() => onSetSpeedLimit && onSetSpeedLimit(preset.val)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  speedLimitMbps === preset.val
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : darkMode
                      ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search, Filter & Sort Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              id="active-downloads-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search active transfers by title or file name..."
              className={`w-full pl-8 pr-8 py-1.5 rounded-xl border text-xs outline-none transition-all ${
                darkMode
                  ? 'bg-zinc-950 border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:border-cyan-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-cyan-500'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Status Filter */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-zinc-800 rounded-lg">
              {(['all', 'downloading', 'paused', 'completed'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  id={`status-filter-${st}`}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold capitalize transition-all ${
                    statusFilter === st
                      ? 'bg-white dark:bg-zinc-700 text-cyan-600 dark:text-cyan-400 shadow-sm'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                  }`}
                >
                  {st === 'all' ? 'All' : st}
                </button>
              ))}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
              <select
                id="active-downloads-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort active transfers by"
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold outline-none ${
                  darkMode ? 'bg-zinc-950 border-zinc-700 text-zinc-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <option value="date-desc">Newest First</option>
                <option value="progress-desc">Highest Progress</option>
                <option value="speed-desc">Fastest Speed</option>
                <option value="size-desc">Largest Size</option>
                <option value="name-asc">Name (A-Z)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Item Cards */}
      <div className="space-y-3">
        {sortedItems.length === 0 ? (
          <div
            className={`p-8 rounded-2xl border text-center ${
              darkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-slate-200'
            }`}
          >
            <p className="text-xs text-slate-400">No transfers match the current filter or search criteria.</p>
          </div>
        ) : (
          sortedItems.map((item) => {
          const progressPercent = Math.min(
            100,
            Math.max(0, Math.round((item.downloadedBytes / (item.totalBytes || 1)) * 100))
          );
          const isCompleted = item.status === 'completed';
          const isDownloading = item.status === 'downloading' || item.status === 'resuming';
          const isPaused = item.status === 'paused';
          const speedMb = (item.speedBytesPerSec / (1024 * 1024)).toFixed(1);

          return (
            <div
              key={item.id}
              id={`transfer-item-${item.id}`}
              className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-sm ${
                darkMode
                  ? 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Top Row: Thumbnail, Title, Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-start gap-3 min-w-0">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-16 h-12 sm:w-20 sm:h-14 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                        {item.platform}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                        {item.quality.label}
                      </span>
                      {item.isEncrypted && (
                        <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <ShieldCheck className="w-3 h-3" />
                          AES-256 Vault
                        </span>
                      )}
                      {item.autoResumeCount > 0 && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                          Resumed x{item.autoResumeCount}
                        </span>
                      )}
                    </div>
                    <h4 className="font-semibold text-sm truncate" title={item.title}>
                      {item.title}
                    </h4>
                  </div>
                </div>

                {/* Actions per item */}
                <div className="flex items-center gap-1.5 self-end sm:self-center flex-shrink-0">
                  {/* Simulate Network Drop (Demonstrating Deathless Auto-Resume) */}
                  {isDownloading && (
                    <button
                      type="button"
                      id={`simulate-drop-btn-${item.id}`}
                      onClick={() => onSimulateDrop(item.id)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        darkMode
                          ? 'bg-amber-950/30 border-amber-800 text-amber-300 hover:bg-amber-900/40'
                          : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                      }`}
                      title="Test Deathless Auto-Resume by simulating internet cutoff"
                    >
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      <span className="hidden md:inline">Simulate Drop</span>
                    </button>
                  )}

                  {/* Pause / Resume Button */}
                  {!isCompleted && (
                    <button
                      type="button"
                      id={`toggle-pause-btn-${item.id}`}
                      onClick={() => onTogglePause(item.id)}
                      className={`p-2 rounded-lg border transition-colors ${
                        isPaused
                          ? 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-500'
                          : darkMode
                            ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                            : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                      }`}
                      title={isPaused ? 'Resume Transfer' : 'Pause Transfer'}
                    >
                      {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
                    </button>
                  )}

                  {/* If completed: Save to Disk or Open in Vault */}
                  {isCompleted && (
                    <>
                      <button
                        type="button"
                        id={`save-disk-btn-${item.id}`}
                        onClick={() => {
                          if (item.botChallengeTriggered || item.isFallbackStream) {
                            const proceed = window.confirm(
                              `Notice: This file is only ${formatBytes(item.downloadedBytes)} because YouTube blocked the cloud IP with a bot challenge ("Sign in to confirm you're not a bot").\n\nTo download the full ${formatBytes(item.totalBytes)} video, configure YouTube Cookies in Settings.\n\nClick OK to save this 127 KB preview clip anyway, or Cancel to open Settings.`
                            );
                            if (!proceed) {
                              if (onOpenSettings) onOpenSettings();
                              return;
                            }
                          }
                          executeUniversalDownload(item);
                        }}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all text-white ${
                          item.botChallengeTriggered || item.isFallbackStream
                            ? 'bg-amber-600 hover:bg-amber-500'
                            : 'bg-cyan-600 hover:bg-cyan-500'
                        }`}
                        title={
                          item.botChallengeTriggered
                            ? 'Save 127 KB fallback clip (configure cookies for full size)'
                            : 'Save file to local computer or device storage'
                        }
                      >
                        <HardDrive className="w-3.5 h-3.5" />
                        <span>
                          {item.botChallengeTriggered ? 'Save Clip (127 KB)' : 'Save to PC'}
                        </span>
                      </button>

                      {onOpenInVault && (
                        <button
                          type="button"
                          id={`open-vault-btn-${item.id}`}
                          onClick={() => onOpenInVault(item.id)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                            darkMode
                              ? 'bg-zinc-800 border-zinc-700 text-emerald-400 hover:bg-zinc-700'
                              : 'bg-slate-100 border-slate-200 text-emerald-600 hover:bg-slate-200'
                          }`}
                          title="Open in offline media player"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Play Offline</span>
                        </button>
                      )}

                      {onConvertToConverter && (
                        <button
                          type="button"
                          id={`convert-item-btn-${item.id}`}
                          onClick={() => onConvertToConverter(item)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                            darkMode
                              ? 'bg-zinc-800 border-zinc-700 text-cyan-400 hover:bg-zinc-700'
                              : 'bg-slate-100 border-slate-200 text-cyan-600 hover:bg-slate-200'
                          }`}
                          title="Transcode or convert this file in File Converter"
                        >
                          <Repeat className="w-3.5 h-3.5" />
                          <span>Convert</span>
                        </button>
                      )}
                    </>
                  )}

                  {/* Cancel / Remove */}
                  <button
                    type="button"
                    id={`cancel-item-btn-${item.id}`}
                    onClick={() => onCancel(item.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Remove task"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress Bar & Real-time Metrics */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm font-mono text-cyan-600 dark:text-cyan-400">
                      {progressPercent}%
                    </span>
                    <span className="text-slate-400 dark:text-zinc-500">•</span>
                    <span className="text-slate-600 dark:text-zinc-300 font-mono">
                      {formatBytes(item.downloadedBytes)} / {formatBytes(item.totalBytes)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {isDownloading && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5 animate-pulse" />
                        {speedMb} MB/s
                      </span>
                    )}
                    {isPaused && (
                      <span className="text-amber-500 font-medium flex items-center gap-1">
                        <Pause className="w-3 h-3" /> Paused (Resumable)
                      </span>
                    )}
                    {isCompleted && (
                      item.botChallengeTriggered || item.isFallbackStream ? (
                        <span className="text-amber-500 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> YouTube Bot Block (127 KB Fallback)
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Transfer Complete
                        </span>
                      )
                    )}
                    <span className="text-slate-400 dark:text-zinc-500 hidden sm:inline">
                      {isCompleted ? 'Saved' : formatEta(item.etaSeconds)}
                    </span>
                  </div>
                </div>

                {/* Outer Progress Track */}
                <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden relative">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      item.botChallengeTriggered || item.isFallbackStream
                        ? 'bg-amber-500'
                        : isCompleted
                          ? 'bg-emerald-500'
                          : isPaused
                            ? 'bg-amber-500'
                            : 'bg-gradient-to-r from-cyan-500 to-indigo-600 animate-pulse'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Bot Challenge Notice & One-click Cookie Fix */}
                {(item.botChallengeTriggered || item.isFallbackStream) && (
                  <div
                    className={`mt-2.5 p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                      darkMode
                        ? 'bg-amber-950/30 border-amber-800/70 text-amber-200'
                        : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <div className="font-bold text-xs">
                          YouTube Bot Protection Encountered ({formatBytes(item.downloadedBytes)} received of {formatBytes(item.totalBytes)})
                        </div>
                        <div className="text-[11px] opacity-90 leading-relaxed">
                          YouTube cloud IP challenge (<em>&quot;Sign in to confirm you&apos;re not a bot&quot;</em>) blocked the full {formatBytes(item.totalBytes)} video stream. To download full videos without 127 KB fallback clips, configure your YouTube cookies in Settings.
                        </div>
                      </div>
                    </div>
                    {onOpenSettings && (
                      <button
                        type="button"
                        onClick={onOpenSettings}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1.5 flex-shrink-0 shadow-sm transition-colors"
                      >
                        <Key className="w-3.5 h-3.5" />
                        <span>Fix in Settings ({formatBytes(item.totalBytes)})</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Multi-thread Chunks Inspection & Stream Headers Toggle */}
                <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-zinc-400">
                  <div className="flex items-center gap-2 min-w-0 max-w-full">
                    <Radio className="w-3 h-3 text-cyan-500 flex-shrink-0" />
                    <span className="truncate">
                      Server: {item.cdnInfo.cdnProvider.split('(')[0]} ({item.cdnInfo.nodeLocation.split(',')[0]})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    {onOpenStreamDebugger && (
                      <button
                        type="button"
                        id={`inspect-headers-btn-${item.id}`}
                        onClick={() => onOpenStreamDebugger(item.id)}
                        className="text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-medium whitespace-nowrap"
                        title="Inspect HTTP Response Headers, Content-Length & Stream Debugger"
                      >
                        <Terminal className="w-3 h-3 flex-shrink-0" />
                        <span>Inspect Headers & Stream</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleChunkDetails(item.id)}
                      className="text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-medium whitespace-nowrap"
                    >
                      <SlidersHorizontal className="w-3 h-3 flex-shrink-0" />
                      <span>
                        {expandedChunks[item.id] ? 'Hide 8-Stream Chunks' : 'Inspect 8-Stream Threads'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Expanded Parallel Chunks Visualizer (Proving Massive Multi-part transfers) */}
                {expandedChunks[item.id] && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800 animate-fadeIn">
                    <div className="flex items-center justify-between text-xs font-semibold mb-2 text-slate-700 dark:text-zinc-300">
                      <span>Parallel Thread Streams (8 Active HTTP/3 Range Channels)</span>
                      <span className="text-[10px] font-mono text-cyan-500">Auto-Resume Point Intact</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {item.chunks.map((chunk) => {
                        const chunkPercent = Math.min(
                          100,
                          Math.round((chunk.downloadedBytes / (chunk.totalBytes || 1)) * 100)
                        );
                        return (
                          <div
                            key={chunk.id}
                            className="p-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[10px]"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-slate-600 dark:text-zinc-300">
                                Chunk #{chunk.id + 1}
                              </span>
                              <span
                                className={`font-bold font-mono ${
                                  chunk.status === 'completed'
                                    ? 'text-emerald-500'
                                    : chunk.status === 'downloading'
                                      ? 'text-cyan-500'
                                      : 'text-amber-500'
                                }`}
                              >
                                {chunkPercent}%
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-1">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  chunk.status === 'completed' ? 'bg-emerald-500' : 'bg-cyan-500'
                                }`}
                                style={{ width: `${chunkPercent}%` }}
                              />
                            </div>
                            <div className="text-slate-400 dark:text-zinc-500 font-mono truncate">
                              {(chunk.downloadedBytes / (1024 * 1024)).toFixed(1)}MB /{' '}
                              {(chunk.totalBytes / (1024 * 1024)).toFixed(1)}MB
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        }))}
      </div>
    </div>
  );
};
