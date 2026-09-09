import React, { useState } from 'react';
import {
  Layers,
  ListPlus,
  PlaySquare,
  CheckSquare,
  Square,
  Download,
  CheckCircle2,
  Film,
  Music,
  Sparkles,
  Zap,
  FolderDown,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { BatchItem, QualityOption } from '../types';
import { generateStandardQualities, detectPlatform } from '../services/urlParser';

interface BatchPlaylistDownloaderProps {
  onQueueBatch: (items: BatchItem[]) => void;
  darkMode: boolean;
}

const samplePlaylistsData = {
  nature: [
    {
      title: 'Costa Rica Rainforest Canopy & Rare Avian Species (60FPS HDR)',
      url: 'https://youtube.com/watch?v=LXb3EKWsInQ&list=PL1',
      platform: 'youtube' as const,
      thumb: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&auto=format&fit=crop&q=60',
      approxMb: 480,
    },
    {
      title: 'Alpine Glacial Peaks & Sunrise Horizons (4K Ultra HD)',
      url: 'https://youtube.com/watch?v=J98019385&list=PL1',
      platform: 'youtube' as const,
      thumb: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=60',
      approxMb: 850,
    },
    {
      title: 'Nordic Deep Fjords & Aurora Borealis Light Trails',
      url: 'https://youtube.com/watch?v=N83748291&list=PL1',
      platform: 'youtube' as const,
      thumb: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&auto=format&fit=crop&q=60',
      approxMb: 610,
    },
    {
      title: 'Mariana Trench Bioluminescent Deep Sea Explorations',
      url: 'https://youtube.com/watch?v=M28472910&list=PL1',
      platform: 'youtube' as const,
      thumb: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop&q=60',
      approxMb: 720,
    },
  ],
  synthwave: [
    {
      title: 'Midnight Drive in Neo-Tokyo (Full 320kbps MP3 Studio Mix)',
      url: 'https://tiktok.com/@beats/video/9834710',
      platform: 'tiktok' as const,
      thumb: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=60',
      approxMb: 18,
    },
    {
      title: 'Cyberpunk Odyssey Heavy Synth Arp (320kbps Studio Master)',
      url: 'https://tiktok.com/@beats/video/9834711',
      platform: 'tiktok' as const,
      thumb: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=60',
      approxMb: 21,
    },
    {
      title: 'Retro Wave Sunset Boulevard (320kbps High Fidelity)',
      url: 'https://tiktok.com/@beats/video/9834712',
      platform: 'tiktok' as const,
      thumb: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=60',
      approxMb: 19,
    },
  ],
};

export const BatchPlaylistDownloader: React.FC<BatchPlaylistDownloaderProps> = ({
  onQueueBatch,
  darkMode,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'playlist' | 'batch'>('playlist');
  const [playlistUrlInput, setPlaylistUrlInput] = useState('https://youtube.com/playlist?list=PL_Deathless_Nature_4K');
  const [isExtractingPlaylist, setIsExtractingPlaylist] = useState(false);
  const [multiLineUrls, setMultiLineUrls] = useState('');

  // Initial list seeded with nature playlist items
  const [batchItems, setBatchItems] = useState<BatchItem[]>(() => {
    const qualities = generateStandardQualities(450);
    return samplePlaylistsData.nature.map((item, idx) => ({
      id: `playlist_item_${idx}`,
      url: item.url,
      title: item.title,
      thumbnail: item.thumb,
      platform: item.platform,
      selected: true,
      quality: qualities[2], // 1080p
      status: 'idle',
    }));
  });

  const [selectedGlobalPreset, setSelectedGlobalPreset] = useState<'4K' | '1080p' | '720p' | '360p' | '320k' | 'mkv1080'>('1080p');

  const selectedCount = batchItems.filter((i) => i.selected).length;
  const totalSelectedMb = batchItems
    .filter((i) => i.selected)
    .reduce((acc, i) => acc + (i.quality.approxSizeMb || 200), 0);

  const handleSelectAll = (select: boolean) => {
    setBatchItems((prev) => prev.map((item) => ({ ...item, selected: select })));
  };

  const toggleItemSelect = (id: string) => {
    setBatchItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleApplyPresetToAll = (preset: '4K' | '1080p' | '720p' | '360p' | '320k' | 'mkv1080') => {
    setSelectedGlobalPreset(preset);
    const standard = generateStandardQualities(400);

    let chosenQuality = standard[2]; // default 1080p MP4
    if (preset === '4K') chosenQuality = standard[0];
    if (preset === '720p') chosenQuality = standard[3];
    if (preset === '360p') chosenQuality = standard[5];
    if (preset === '320k') chosenQuality = standard[6]; // 320k MP3
    if (preset === 'mkv1080') {
      chosenQuality = {
        ...standard[2],
        id: 'q-1080p-mkv',
        label: '1080p Full HD [MKV Container]',
        format: 'mkv',
      };
    }

    setBatchItems((prev) =>
      prev.map((item) => ({
        ...item,
        quality: chosenQuality,
      }))
    );
  };

  const handleLoadSamplePlaylist = (key: 'nature' | 'synthwave') => {
    const data = samplePlaylistsData[key];
    const qualities = generateStandardQualities(key === 'synthwave' ? 20 : 450);
    const newItems: BatchItem[] = data.map((item, idx) => ({
      id: `sample_${key}_${Date.now()}_${idx}`,
      url: item.url,
      title: item.title,
      thumbnail: item.thumb,
      platform: item.platform,
      selected: true,
      quality: key === 'synthwave' ? qualities[6] : qualities[2],
      status: 'idle' as const,
    }));
    setBatchItems(newItems);
  };

  const handleExtractPlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistUrlInput.trim()) return;
    setIsExtractingPlaylist(true);

    setTimeout(() => {
      setIsExtractingPlaylist(false);
      handleLoadSamplePlaylist('nature');
    }, 600);
  };

  const handleParseMultiline = () => {
    const lines = multiLineUrls
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 5);

    if (lines.length === 0) return;

    const standard = generateStandardQualities(350);
    const newItems: BatchItem[] = lines.map((url, idx) => {
      const platform = detectPlatform(url);
      return {
        id: 'batch_custom_' + Date.now() + '_' + idx,
        url,
        title: `Parsed Stream Item #${idx + 1} (${platform.toUpperCase()})`,
        thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60',
        platform,
        selected: true,
        quality: standard[2], // 1080p
        status: 'idle' as const,
      };
    });

    setBatchItems((prev) => [...newItems, ...prev]);
    setMultiLineUrls('');
  };

  const handleQueueSelected = () => {
    const toDownload = batchItems.filter((i) => i.selected);
    if (toDownload.length === 0) return;
    onQueueBatch(toDownload);
    setBatchItems((prev) =>
      prev.map((i) => (i.selected ? { ...i, status: 'queued' } : i))
    );
  };

  return (
    <div id="batch-downloader-container" className="space-y-4">
      {/* Container Header & Mode Toggle */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          darkMode ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-500" />
              <span>Playlist Downloader & Batch Queue Manager</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
              Download entire YouTube playlists, TikTok sound albums, Facebook video lists, or multiple URLs simultaneously
            </p>
          </div>

          {/* Mode Switcher: Playlist vs Batch URL */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-zinc-800 rounded-xl self-start sm:self-auto">
            <button
              type="button"
              id="subtab-playlist-btn"
              onClick={() => setActiveSubTab('playlist')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'playlist'
                  ? 'bg-white dark:bg-zinc-700 text-cyan-600 dark:text-cyan-400 shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
              }`}
            >
              <PlaySquare className="w-3.5 h-3.5" />
              <span>Playlist Downloader</span>
            </button>
            <button
              type="button"
              id="subtab-batch-btn"
              onClick={() => setActiveSubTab('batch')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'batch'
                  ? 'bg-white dark:bg-zinc-700 text-cyan-600 dark:text-cyan-400 shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
              }`}
            >
              <ListPlus className="w-3.5 h-3.5" />
              <span>Batch URLs Importer</span>
            </button>
          </div>
        </div>

        {/* ================= Playlist Downloader View ================= */}
        {activeSubTab === 'playlist' && (
          <div className="space-y-3">
            <form onSubmit={handleExtractPlaylist} className="flex flex-col sm:flex-row gap-2">
              <input
                id="playlist-url-input"
                type="url"
                value={playlistUrlInput}
                onChange={(e) => setPlaylistUrlInput(e.target.value)}
                placeholder="Paste YouTube playlist URL, TikTok collection, or album link..."
                className={`flex-1 px-4 py-2.5 rounded-xl text-xs sm:text-sm border outline-none font-mono transition-all ${
                  darkMode
                    ? 'bg-zinc-950 border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:border-cyan-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-500'
                }`}
              />
              <button
                type="submit"
                id="extract-playlist-btn"
                disabled={isExtractingPlaylist || !playlistUrlInput.trim()}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/20 disabled:opacity-50 transition-all flex-shrink-0"
              >
                {isExtractingPlaylist ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Extracting Tracks...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Extract Playlist</span>
                  </>
                )}
              </button>
            </form>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-slate-400 dark:text-zinc-500 font-medium">Quick Demo Playlists:</span>
              <button
                type="button"
                id="load-sample-nature-playlist"
                onClick={() => handleLoadSamplePlaylist('nature')}
                className={`px-2.5 py-1 rounded-lg border font-medium text-xs transition-colors ${
                  darkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
              >
                YouTube 4K Nature Series (4 Videos)
              </button>
              <button
                type="button"
                id="load-sample-synthwave-playlist"
                onClick={() => handleLoadSamplePlaylist('synthwave')}
                className={`px-2.5 py-1 rounded-lg border font-medium text-xs transition-colors ${
                  darkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
              >
                TikTok Synthwave Album (320kbps MP3s)
              </button>
            </div>
          </div>
        )}

        {/* ================= Batch URLs View ================= */}
        {activeSubTab === 'batch' && (
          <div className="space-y-3">
            <textarea
              id="batch-multiline-input"
              value={multiLineUrls}
              onChange={(e) => setMultiLineUrls(e.target.value)}
              rows={3}
              placeholder="Paste multiple URLs here (one link per line) to batch download all at once..."
              className={`w-full p-3 rounded-xl text-xs sm:text-sm border outline-none font-mono transition-all ${
                darkMode
                  ? 'bg-zinc-950 border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:border-cyan-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-500'
              }`}
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                Paste unlimited direct or social media links to process simultaneously.
              </span>
              <button
                type="button"
                id="parse-batch-urls-btn"
                onClick={handleParseMultiline}
                disabled={!multiLineUrls.trim()}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-cyan-600/20 transition-all"
              >
                <ListPlus className="w-4 h-4" />
                <span>Parse & Add to Batch List</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Batch Control Toolbar & Preset Applicator */}
      <div
        className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
          darkMode ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            id="select-all-batch-btn"
            onClick={() => handleSelectAll(selectedCount !== batchItems.length)}
            className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-cyan-500"
          >
            {selectedCount === batchItems.length ? (
              <CheckSquare className="w-4 h-4 text-cyan-500" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>
              {selectedCount === batchItems.length ? 'Deselect All' : `Select All (${batchItems.length})`}
            </span>
          </button>
          <span className="text-slate-300 dark:text-zinc-700">|</span>
          <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
            Selected: <strong className="text-cyan-600 dark:text-cyan-400">{selectedCount}</strong> items (~{totalSelectedMb >= 1000 ? `${(totalSelectedMb / 1024).toFixed(1)} GB` : `${totalSelectedMb} MB`})
          </span>
        </div>

        {/* Global Preset Quality & Format Applicator */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-medium text-slate-400 dark:text-zinc-500 flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Preset:
          </span>

          <button
            type="button"
            id="preset-4k-btn"
            onClick={() => handleApplyPresetToAll('4K')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              selectedGlobalPreset === '4K'
                ? 'bg-cyan-600 text-white border-cyan-600'
                : darkMode
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-300'
                  : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            4K Ultra MP4
          </button>

          <button
            type="button"
            id="preset-1080p-btn"
            onClick={() => handleApplyPresetToAll('1080p')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              selectedGlobalPreset === '1080p'
                ? 'bg-cyan-600 text-white border-cyan-600'
                : darkMode
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-300'
                  : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            1080p FHD MP4
          </button>

          <button
            type="button"
            id="preset-mkv-btn"
            onClick={() => handleApplyPresetToAll('mkv1080')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              selectedGlobalPreset === 'mkv1080'
                ? 'bg-cyan-600 text-white border-cyan-600'
                : darkMode
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-300'
                  : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            1080p MKV
          </button>

          <button
            type="button"
            id="preset-360p-btn"
            onClick={() => handleApplyPresetToAll('360p')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              selectedGlobalPreset === '360p'
                ? 'bg-cyan-600 text-white border-cyan-600'
                : darkMode
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-300'
                  : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            360p Data Saver
          </button>

          <button
            type="button"
            id="preset-320k-btn"
            onClick={() => handleApplyPresetToAll('320k')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              selectedGlobalPreset === '320k'
                ? 'bg-cyan-600 text-white border-cyan-600'
                : darkMode
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-300'
                  : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            320kbps MP3
          </button>

          {/* Queue Selected Action */}
          <button
            type="button"
            id="start-batch-download-btn"
            onClick={handleQueueSelected}
            disabled={selectedCount === 0}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-cyan-600/20 transition-all ml-auto md:ml-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download {selectedCount} Selected</span>
          </button>
        </div>
      </div>

      {/* Playlist / Batch Items List */}
      <div className="space-y-2">
        {batchItems.map((item) => {
          return (
            <div
              key={item.id}
              id={`batch-item-row-${item.id}`}
              className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                item.selected
                  ? darkMode
                    ? 'bg-zinc-900/90 border-cyan-500/40'
                    : 'bg-white border-cyan-500/50 shadow-sm'
                  : darkMode
                    ? 'bg-zinc-950/40 border-zinc-800 opacity-60'
                    : 'bg-slate-50 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => toggleItemSelect(item.id)}
                  className="text-cyan-600 dark:text-cyan-400 flex-shrink-0"
                >
                  {item.selected ? (
                    <CheckSquare className="w-4 h-4 fill-current" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-16 h-11 object-cover rounded-lg flex-shrink-0"
                />

                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                      {item.platform}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 text-cyan-600 dark:text-cyan-400">
                      .{item.quality.format?.toUpperCase() || 'MP4'} • {item.quality.label}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold truncate" title={item.title}>
                    {item.title}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-mono font-medium text-slate-500 dark:text-zinc-400 hidden sm:inline">
                  ~{item.quality.approxSizeMb} MB
                </span>

                {item.status === 'queued' && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500">
                    Queued
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
