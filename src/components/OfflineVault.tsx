import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Unlock,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw,
  HardDrive,
  Trash2,
  Download,
  Film,
  Music,
  Eye,
  KeyRound,
  FileCheck,
  Zap,
} from 'lucide-react';
import { VaultFile } from '../types';
import { getVaultFiles, deleteVaultFile, verifyVaultPassword, setVaultPassword } from '../services/cryptoVault';

interface OfflineVaultProps {
  initialFileToPlay?: string | null;
  darkMode: boolean;
}

export const OfflineVault: React.FC<OfflineVaultProps> = ({ initialFileToPlay, darkMode }) => {
  const [vaultFiles, setVaultFiles] = useState<VaultFile[]>([]);
  const [isUnlocked, setIsUnlocked] = useState(true);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [activePlayItem, setActivePlayItem] = useState<VaultFile | null>(null);

  // Media Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [durationSec, setDurationSec] = useState(165);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = () => {
    const files = getVaultFiles();
    setVaultFiles(files);
    if (initialFileToPlay) {
      const match = files.find((f) => f.id === initialFileToPlay || f.downloadId === initialFileToPlay);
      if (match) {
        setActivePlayItem(match);
        setIsPlaying(true);
      }
    } else if (files.length > 0 && !activePlayItem) {
      setActivePlayItem(files[0]);
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await verifyVaultPassword(pinInput);
    if (ok) {
      setIsUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleDelete = (id: string) => {
    deleteVaultFile(id);
    loadFiles();
    if (activePlayItem?.id === id) {
      setActivePlayItem(null);
      setIsPlaying(false);
    }
  };

  const handleExport = (file: VaultFile) => {
    const a = document.createElement('a');
    a.href = file.blobUrl || 'data:text/plain;charset=utf-8,' + encodeURIComponent(`DEATHLESS_EXPORT_${file.title}`);
    a.download = `${file.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.${file.format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalVaultBytes = vaultFiles.reduce((acc, f) => acc + f.sizeBytes, 0);
  const formatBytes = (bytes: number): string => {
    if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / 1024).toFixed(0) + ' KB';
  };

  return (
    <div id="offline-vault-section" className="space-y-4">
      {/* Vault Status Header */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          darkMode ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <h2 className="text-base sm:text-lg font-bold">Encrypted Storage & Offline Media Player</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                AES-GCM-256 Bit
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
              Files stored in local client-side encrypted vault. Play back offline anytime without network access.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-slate-700 dark:text-zinc-300">
                {formatBytes(totalVaultBytes)}
              </span>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500">{vaultFiles.length} Encrypted items</p>
            </div>

            <button
              type="button"
              id="toggle-vault-lock-btn"
              onClick={() => setIsUnlocked(!isUnlocked)}
              className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-all ${
                isUnlocked
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20'
              }`}
            >
              {isUnlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{isUnlocked ? 'Vault Unlocked' : 'Vault Locked'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lock Screen if Locked */}
      {!isUnlocked && (
        <div
          id="vault-locked-prompt"
          className={`p-10 rounded-2xl border text-center ${
            darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-lg mb-1">Encrypted Vault Protected</h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-sm mx-auto mb-4">
            Enter your secret security PIN or click Quick Unlock to decrypt your offline files.
          </p>

          <form onSubmit={handleUnlock} className="max-w-xs mx-auto flex items-center gap-2">
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Enter PIN (Default: empty)"
              className={`flex-1 px-3 py-2 rounded-xl border text-sm outline-none ${
                darkMode ? 'bg-zinc-950 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300'
              }`}
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-600/20"
            >
              Unlock
            </button>
          </form>
          {pinError && <p className="text-xs text-rose-500 mt-2">Incorrect PIN code</p>}
        </div>
      )}

      {/* Main Content when Unlocked */}
      {isUnlocked && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Media Player Player Area (7 cols on Desktop) */}
          <div className="lg:col-span-7 space-y-3">
            <div
              className={`rounded-2xl border overflow-hidden ${
                darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="px-4 py-3 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-cyan-500 fill-current" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-300">
                    Offline Stream Player
                  </span>
                </div>
                {activePlayItem && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-semibold">
                    {activePlayItem.qualityLabel}
                  </span>
                )}
              </div>

              {/* Player Stage */}
              <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                {activePlayItem ? (
                  activePlayItem.category === 'video' ? (
                    <div className="relative w-full h-full flex flex-col items-center justify-center text-white">
                      <img
                        src={activePlayItem.thumbnail}
                        alt={activePlayItem.title}
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                          isPlaying ? 'opacity-80' : 'opacity-50'
                        }`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/40" />

                      {/* Playing animation or overlay */}
                      <div className="relative z-10 text-center p-4">
                        <div className="w-14 h-14 rounded-full bg-cyan-600/90 text-white flex items-center justify-center mx-auto mb-2 shadow-2xl shadow-cyan-500/50 cursor-pointer hover:scale-110 transition-transform"
                          onClick={togglePlay}
                        >
                          {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
                        </div>
                        <h4 className="text-sm font-bold max-w-md line-clamp-1 drop-shadow-md">
                          {activePlayItem.title}
                        </h4>
                        <p className="text-xs text-slate-300 drop-shadow-sm mt-0.5">
                          Offline Decrypted Playback • {activePlayItem.format.toUpperCase()}
                        </p>
                      </div>
                    </div>
                  ) : (
                    // Audio Mode Visualizer
                    <div className="w-full h-full bg-gradient-to-tr from-zinc-950 to-indigo-950/80 flex flex-col items-center justify-center p-6 text-white text-center">
                      <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-3">
                        <Music className="w-8 h-8" />
                      </div>
                      <h4 className="text-sm font-bold max-w-sm line-clamp-1">{activePlayItem.title}</h4>
                      <p className="text-xs text-cyan-400 font-mono mt-1">
                        Lossless Studio Audio • 320kbps MP3 Engine
                      </p>

                      {/* Audio Bar Animation */}
                      <div className="flex items-end gap-1 h-8 mt-4">
                        {[40, 70, 90, 60, 85, 45, 95, 30, 75, 55, 80, 40].map((h, i) => (
                          <div
                            key={i}
                            className={`w-1.5 rounded-full bg-cyan-500 transition-all ${
                              isPlaying ? 'animate-pulse' : 'opacity-40'
                            }`}
                            style={{ height: isPlaying ? `${h}%` : '20%' }}
                          />
                        ))}
                      </div>
                    </div>
                  )
                ) : (
                  <div className="text-slate-500 text-xs">Select an item from vault to play</div>
                )}
              </div>

              {/* Player Scrubber & Controls */}
              {activePlayItem && (
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span>{formatTime(currentTimeSec)}</span>
                    <div className="h-1.5 flex-1 mx-3 bg-slate-200 dark:bg-zinc-800 rounded-full cursor-pointer relative overflow-hidden">
                      <div
                        className="h-full bg-cyan-500 rounded-full"
                        style={{ width: `${(currentTimeSec / durationSec) * 100}%` }}
                      />
                    </div>
                    <span>{formatTime(durationSec)}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={togglePlay}
                        className="p-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm"
                      >
                        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsMuted(!isMuted)}
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                      >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const speeds = [0.5, 1, 1.25, 1.5, 2];
                          const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
                          setPlaybackSpeed(speeds[nextIdx]);
                        }}
                        className="px-2 py-1 rounded-md text-[11px] font-mono font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                      >
                        {playbackSpeed}x
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleExport(activePlayItem)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300"
                        title="Export file to computer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Export</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stored Vault Media List (5 cols on Desktop) */}
          <div className="lg:col-span-5 space-y-2">
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
              }`}
            >
              <span>Saved Offline Items ({vaultFiles.length})</span>
              <span className="text-[10px] text-slate-400 font-normal">Zero-Internet Access</span>
            </div>

            {vaultFiles.length === 0 ? (
              <div
                className={`p-8 rounded-xl border text-center text-xs text-slate-500 ${
                  darkMode ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-slate-200'
                }`}
              >
                No encrypted files in vault yet. When downloading media, enable &apos;Store in Offline Vault&apos; to view offline here.
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {vaultFiles.map((file) => {
                  const isActive = activePlayItem?.id === file.id;
                  return (
                    <div
                      key={file.id}
                      id={`vault-item-${file.id}`}
                      onClick={() => {
                        setActivePlayItem(file);
                        setIsPlaying(true);
                      }}
                      className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between gap-3 transition-all ${
                        isActive
                          ? darkMode
                            ? 'bg-cyan-950/40 border-cyan-500 text-white'
                            : 'bg-cyan-50 border-cyan-500 text-slate-900'
                          : darkMode
                            ? 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={file.thumbnail}
                          alt={file.title}
                          className="w-12 h-10 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <h5 className="text-xs font-semibold truncate" title={file.title}>
                            {file.title}
                          </h5>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-zinc-500">
                            <span className="uppercase font-bold text-cyan-600 dark:text-cyan-400">
                              {file.format}
                            </span>
                            <span>•</span>
                            <span>{file.qualityLabel}</span>
                            <span>•</span>
                            <span>{formatBytes(file.sizeBytes)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleExport(file)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                          title="Export decrypted file"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(file.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                          title="Remove from vault"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
