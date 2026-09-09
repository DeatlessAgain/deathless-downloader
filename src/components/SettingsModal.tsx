import React, { useState, useEffect } from 'react';
import {
  X,
  Settings as SettingsIcon,
  ShieldCheck,
  Zap,
  Sliders,
  Check,
  Moon,
  Sun,
  FolderDown,
  Film,
  Music,
  Gauge,
  Bell,
  Volume2,
  Key,
  Upload,
  Trash2,
  AlertCircle,
  Smartphone,
} from 'lucide-react';
import { AppSettings } from '../services/downloadEngine';
import {
  playCompletionChime,
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendDesktopNotification,
} from '../services/notificationService';

interface SettingsModalProps {
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
  onClose: () => void;
  darkMode: boolean;
  onToggleDarkMode?: (value: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSave,
  onClose,
  darkMode,
  onToggleDarkMode,
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [localDarkMode, setLocalDarkMode] = useState<boolean>(darkMode);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>(
    getNotificationPermission()
  );
  const [testedSound, setTestedSound] = useState(false);

  // YouTube Cookies State
  const [hasCookies, setHasCookies] = useState<boolean>(false);
  const [cookieLineCount, setCookieLineCount] = useState<number>(0);
  const [cookieInputText, setCookieInputText] = useState<string>('');
  const [showCookieBox, setShowCookieBox] = useState<boolean>(false);
  const [cookieMsg, setCookieMsg] = useState<string>('');

  useEffect(() => {
    fetch('/api/cookies')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.hasCookies) {
          setHasCookies(true);
          setCookieLineCount(data.lineCount || 0);
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveCookies = async () => {
    if (!cookieInputText.trim()) return;
    try {
      const res = await fetch('/api/cookies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cookiesText: cookieInputText }),
      });
      const data = await res.json();
      if (res.ok) {
        setHasCookies(true);
        setCookieLineCount(data.lineCount || 0);
        setCookieMsg('Cookies saved and active for YouTube streams!');
        setCookieInputText('');
        setTimeout(() => setCookieMsg(''), 4000);
      } else {
        setCookieMsg('Failed: ' + (data.error || 'unknown'));
      }
    } catch (err: any) {
      setCookieMsg('Error: ' + err.message);
    }
  };

  const handleClearCookies = async () => {
    try {
      await fetch('/api/cookies', { method: 'DELETE' });
      setHasCookies(false);
      setCookieLineCount(0);
      setCookieMsg('Cookies cleared.');
      setTimeout(() => setCookieMsg(''), 3000);
    } catch (err: any) {
      setCookieMsg('Error: ' + err.message);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setCookieInputText(text);
      }
    };
    reader.readAsText(file);
  };

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setNotifPermission(getNotificationPermission());
    if (granted) {
      sendDesktopNotification(
        'Deathless Downloader',
        'Desktop notifications are enabled! You will be alerted when downloads finish.'
      );
    }
  };

  const handleTestSound = () => {
    playCompletionChime();
    setTestedSound(true);
    setTimeout(() => setTestedSound(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSettings = { ...localSettings, darkMode: localDarkMode };
    onSave(updatedSettings);
    if (onToggleDarkMode && localDarkMode !== darkMode) {
      onToggleDarkMode(localDarkMode);
    }
    onClose();
  };

  const handleDarkModeSwitch = (enabled: boolean) => {
    setLocalDarkMode(enabled);
    if (onToggleDarkMode) {
      onToggleDarkMode(enabled);
    }
  };

  return (
    <div
      id="settings-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="settings-modal-dialog"
        className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden my-auto transition-all ${
          darkMode ? 'bg-zinc-900 border-zinc-700 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base">Application & Engine Settings</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Configure theme, auto-start, storage directories & format defaults
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs sm:text-sm max-h-[75vh] overflow-y-auto">
          {/* Setting 1: Dark Mode Toggle (Explicitly requested by user: turned off by default) */}
          <div className="p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-500/5 flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 mt-0.5">
                {localDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </div>
              <div>
                <div className="font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <span>Dark Mode Theme</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                    {localDarkMode ? 'Dark Active' : 'Off by Default'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Toggle between high-contrast daylight theme and sleek midnight dark aesthetic.
                </p>
              </div>
            </div>

            {/* Switch button */}
            <button
              type="button"
              id="settings-dark-mode-toggle"
              onClick={() => handleDarkModeSwitch(!localDarkMode)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                localDarkMode ? 'bg-cyan-600' : 'bg-slate-300 dark:bg-zinc-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  localDarkMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Setting 2: Auto-Start on Paste Option */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40">
            <div>
              <div className="font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-cyan-500" />
                <span>Automatically Start Downloading When Link is Pasted</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Instant queue execution using your preferred defaults without waiting for the format modal
              </p>
            </div>
            <input
              type="checkbox"
              id="settings-auto-start-input"
              checked={localSettings.autoStartOnPaste}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, autoStartOnPaste: e.target.checked })
              }
              className="w-4 h-4 rounded text-cyan-600 accent-cyan-600 cursor-pointer ml-3 flex-shrink-0"
            />
          </div>

          {/* Setting 3: Default Download Location / Folder */}
          <div className="p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 space-y-1.5">
            <label className="font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
              <FolderDown className="w-3.5 h-3.5 text-cyan-500" />
              <span>Default Download Directory Path</span>
            </label>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Files are tracked and saved to this path in your Download History
            </p>
            <input
              type="text"
              id="settings-download-folder-input"
              value={localSettings.defaultDownloadFolder || '~/Downloads/Deathless'}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, defaultDownloadFolder: e.target.value })
              }
              placeholder="e.g. ~/Downloads/Deathless"
              className={`w-full px-3 py-2 rounded-xl text-xs font-mono border outline-none ${
                darkMode
                  ? 'bg-zinc-950 border-zinc-700 text-zinc-100 focus:border-cyan-500'
                  : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'
              }`}
            />
          </div>

          {/* Setting 4: Default Video Format & Quality */}
          <div className="p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-cyan-500" />
                <span>Preferred Video Format & Quality</span>
              </span>
              <span className="font-mono text-xs text-cyan-600 dark:text-cyan-400 font-bold uppercase">
                .{localSettings.defaultVideoFormat} • {localSettings.defaultVideoQuality}
              </span>
            </div>

            {/* Video Format Buttons */}
            <div className="grid grid-cols-3 gap-2">
              {(['mp4', 'mkv', 'webm'] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setLocalSettings({ ...localSettings, defaultVideoFormat: fmt })}
                  className={`py-1.5 rounded-lg border text-xs font-bold uppercase transition-all ${
                    localSettings.defaultVideoFormat === fmt
                      ? 'bg-cyan-600 text-white border-cyan-600'
                      : darkMode
                        ? 'bg-zinc-900 border-zinc-700 text-zinc-300'
                        : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  .{fmt}
                </button>
              ))}
            </div>

            {/* Video Quality Buttons */}
            <div className="grid grid-cols-4 gap-1.5">
              {(['4K', '1080p', '720p', '360p'] as const).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setLocalSettings({ ...localSettings, defaultVideoQuality: q })}
                  className={`py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                    localSettings.defaultVideoQuality === q
                      ? 'bg-cyan-600 text-white border-cyan-600'
                      : darkMode
                        ? 'bg-zinc-900 border-zinc-700 text-zinc-300'
                        : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Setting 5: Default Audio Bitrate & Format */}
          <div className="p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-cyan-500" />
                <span>Preferred Audio Bitrate & Encoding</span>
              </span>
              <span className="font-mono text-xs text-cyan-600 dark:text-cyan-400 font-bold uppercase">
                .{localSettings.defaultAudioFormat || 'mp3'} • {localSettings.defaultAudioQuality}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {['320k', '256k', '192k', '128k'].map((bitrate) => (
                <button
                  key={bitrate}
                  type="button"
                  onClick={() => setLocalSettings({ ...localSettings, defaultAudioQuality: bitrate as any })}
                  className={`py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                    localSettings.defaultAudioQuality === bitrate
                      ? 'bg-cyan-600 text-white border-cyan-600'
                      : darkMode
                        ? 'bg-zinc-900 border-zinc-700 text-zinc-300'
                        : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  {bitrate === '320k' ? '320k (Max)' : bitrate}
                </button>
              ))}
            </div>
          </div>

          {/* Setting 6: Encrypted Vault Checkbox */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40">
            <div>
              <div className="font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Store Encrypted In-App Offline Copies</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Store AES-GCM encrypted media chunks for instant playback in the offline player
              </p>
            </div>
            <input
              type="checkbox"
              id="settings-save-vault-input"
              checked={localSettings.saveToEncryptedVault}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, saveToEncryptedVault: e.target.checked })
              }
              className="w-4 h-4 rounded text-cyan-600 accent-cyan-600 cursor-pointer ml-3 flex-shrink-0"
            />
          </div>

          {/* Setting 7: Parallel Chunk Streams */}
          <div className="p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 dark:text-zinc-200">
                Parallel Multi-Thread Range Streams
              </span>
              <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                {localSettings.chunkCount} HTTP/3 Channels
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[4, 8, 16].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setLocalSettings({ ...localSettings, chunkCount: num })}
                  className={`py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                    localSettings.chunkCount === num
                      ? 'bg-cyan-600 text-white border-cyan-600'
                      : darkMode
                        ? 'bg-zinc-900 border-zinc-700 text-zinc-300'
                        : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  {num} Channels
                </button>
              ))}
            </div>
          </div>

          {/* Setting 8: Download Speed Limit (Bandwidth Cap) */}
          <div className="p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-cyan-500" />
                <span>Download Speed Limit</span>
              </span>
              <span className="font-mono font-bold text-xs text-cyan-600 dark:text-cyan-400">
                {localSettings.downloadSpeedLimitMbps === 0
                  ? 'Unlimited (Max Network)'
                  : `${localSettings.downloadSpeedLimitMbps} MB/s Cap`}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Throttle aggregate bandwidth to prevent network congestion or let streams consume full gigabit line.
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {[
                { val: 0, label: 'Unlimited' },
                { val: 50, label: '50 MB/s' },
                { val: 25, label: '25 MB/s' },
                { val: 10, label: '10 MB/s' },
                { val: 5, label: '5 MB/s' },
                { val: 2, label: '2 MB/s' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() =>
                    setLocalSettings({ ...localSettings, downloadSpeedLimitMbps: opt.val })
                  }
                  className={`py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                    (localSettings.downloadSpeedLimitMbps ?? 0) === opt.val
                      ? 'bg-cyan-600 text-white border-cyan-600'
                      : darkMode
                        ? 'bg-zinc-900 border-zinc-700 text-zinc-300'
                        : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Setting 9: Auto Notify Downloads */}
          <div className="p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-cyan-500" />
                <span>Auto Notify Downloads</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                Audio & Desktop Alerts
              </span>
            </div>

            {/* Desktop Notification Toggle */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <div className="font-medium text-xs text-slate-800 dark:text-zinc-200">
                  Desktop System Notifications
                </div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Show OS alert popup with file name and size when download finishes
                </div>
              </div>
              <div className="flex items-center gap-2">
                {notifPermission !== 'granted' && isNotificationSupported() && (
                  <button
                    type="button"
                    onClick={handleRequestPermission}
                    className="px-2 py-1 rounded text-[10px] font-semibold bg-cyan-600/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-600/20 transition-colors"
                  >
                    Enable Browser Perms
                  </button>
                )}
                <input
                  type="checkbox"
                  id="settings-desktop-notif-input"
                  checked={localSettings.desktopNotifications ?? true}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, desktopNotifications: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-cyan-600 accent-cyan-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Sound Notification Toggle */}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-zinc-800/80 pt-2">
              <div>
                <div className="font-medium text-xs text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Completion Audio Chime</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Play melodic two-tone chime when a download completes successfully
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestSound}
                  className={`px-2 py-1 rounded text-[10px] font-semibold border transition-colors ${
                    testedSound
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                      : darkMode
                        ? 'bg-zinc-800 border-zinc-700 text-zinc-300'
                        : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  {testedSound ? 'Chimed!' : 'Test Sound'}
                </button>
                <input
                  type="checkbox"
                  id="settings-sound-notif-input"
                  checked={localSettings.soundNotifications ?? true}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, soundNotifications: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-cyan-600 accent-cyan-600 cursor-pointer"
                />
              </div>
            </div>

            {/* In-App Toast Toggle */}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-zinc-800/80 pt-2">
              <div>
                <div className="font-medium text-xs text-slate-800 dark:text-zinc-200">
                  In-App Toast Banner Alerts
                </div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Show floating status alert in top-right corner with direct actions
                </div>
              </div>
              <input
                type="checkbox"
                id="settings-toast-notif-input"
                checked={localSettings.inAppToastNotifications ?? true}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, inAppToastNotifications: e.target.checked })
                }
                className="w-4 h-4 rounded text-cyan-600 accent-cyan-600 cursor-pointer"
              />
            </div>
          </div>

          {/* YouTube Cloud Authentication & Cookies */}
          <div
            id="settings-youtube-cookies-section"
            className={`p-4 rounded-xl border space-y-3 ${
              darkMode ? 'bg-zinc-800/40 border-zinc-800' : 'bg-slate-50 border-slate-200/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center">
                  <Key className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold text-xs flex items-center gap-2">
                    <span>YouTube Cloud Authentication</span>
                    {hasCookies ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        {cookieLineCount} Cookies Active
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        Optional
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Bypass YouTube cloud IP challenges with browser Netscape cookies
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCookieBox(!showCookieBox)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-colors ${
                  showCookieBox
                    ? 'bg-zinc-700 text-white border-zinc-600'
                    : darkMode
                      ? 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {showCookieBox ? 'Close' : hasCookies ? 'Manage' : 'Configure'}
              </button>
            </div>

            {showCookieBox && (
              <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-700/60 space-y-2.5 animate-fadeIn">
                <p className="text-[11px] text-slate-600 dark:text-zinc-300 leading-relaxed">
                  YouTube protects its streams on datacenter IPs with bot checks. Export your cookies using any browser extension (e.g. <i>Get cookies.txt LOCALLY</i>) and paste below:
                </p>
                <textarea
                  value={cookieInputText}
                  onChange={(e) => setCookieInputText(e.target.value)}
                  placeholder="# Netscape HTTP Cookie File&#10;.youtube.com&#9;TRUE&#9;/&#9;TRUE&#9;1788888888&#9;SID&#9;...&#10;or paste full cookies.txt contents here"
                  rows={4}
                  className={`w-full text-xs font-mono p-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none ${
                    darkMode ? 'bg-zinc-900 border-zinc-700 text-zinc-200' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                />
                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-1.5 text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload cookies.txt</span>
                    <input type="file" accept=".txt" onChange={handleFileUpload} className="hidden" />
                  </label>
                  <div className="flex items-center gap-2">
                    {hasCookies && (
                      <button
                        type="button"
                        onClick={handleClearCookies}
                        className="px-2.5 py-1 text-xs text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Clear</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleSaveCookies}
                      disabled={!cookieInputText.trim()}
                      className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                    >
                      Save Cookies
                    </button>
                  </div>
                </div>
                {cookieMsg && (
                  <div className="text-[11px] font-medium text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{cookieMsg}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Capacitor Mobile & Android APK Platform Status */}
          <div
            id="settings-android-capacitor-section"
            className={`p-4 rounded-xl border space-y-2.5 ${
              darkMode ? 'bg-zinc-800/40 border-zinc-800' : 'bg-slate-50 border-slate-200/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Smartphone className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold text-xs flex items-center gap-2">
                    <span>Android APK Platform (Capacitor)</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      Configured
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                    App ID: <code className="font-mono text-[10px] text-cyan-600 dark:text-cyan-400">com.deathless.downloader</code> • Native Filesystem Plugin Active
                  </div>
                </div>
              </div>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed bg-black/5 dark:bg-black/20 p-2.5 rounded-lg font-mono text-[10px] space-y-1">
              <div># Build APK commands:</div>
              <div className="text-cyan-600 dark:text-cyan-400">npm run cap:sync</div>
              <div className="text-slate-600 dark:text-zinc-400">cd android &amp;&amp; ./gradlew assembleDebug</div>
              <div className="text-slate-500 text-[9px] font-sans pt-0.5">Outputs to: android/app/build/outputs/apk/debug/app-debug.apk</div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border ${
                darkMode ? 'border-zinc-700 hover:bg-zinc-800 text-zinc-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/20"
            >
              Save Preferences
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
