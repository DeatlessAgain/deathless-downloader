import React, { useState } from 'react';
import {
  Compass,
  Download,
  Share2,
  Heart,
  Eye,
  Search,
  ExternalLink,
  Film,
  Sparkles,
  Zap,
  Check,
  Play,
  SlidersHorizontal,
  ArrowUpDown,
  X,
} from 'lucide-react';
import { PlatformType, SocialPost } from '../types';

interface SocialFeedBrowserProps {
  onSelectVideoForDownload: (url: string, title?: string) => void;
  darkMode: boolean;
}

const sampleSocialPosts: SocialPost[] = [
  {
    id: 'post_yt_1',
    platform: 'youtube',
    authorName: 'National Geographic Odyssey',
    authorHandle: '@natgeo_odyssey',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60',
    caption: 'Deep Ocean Bioluminescence in 4K 60FPS HDR - Incredible Unexplored Creatures of the Mariana Trench',
    thumbnail: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop&q=60',
    videoPreviewUrl: '',
    views: '4.2M views',
    likes: '342K',
    shares: '51K',
    duration: '14:15',
    mediaUrl: 'https://youtube.com/watch?v=LXb3EKWsInQ',
    date: '2 hours ago',
  },
  {
    id: 'post_tt_1',
    platform: 'tiktok',
    authorName: 'BeatLab Audio Studio',
    authorHandle: '@beatlab_original',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60',
    caption: 'Viral Cinematic Cyberpunk Synthwave Beat Remaster (Full 320kbps Audio Drop) #trending #producer #fyp',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=60',
    videoPreviewUrl: '',
    views: '8.9M views',
    likes: '1.2M',
    shares: '210K',
    duration: '00:58',
    mediaUrl: 'https://tiktok.com/@beatlab_original/video/78923411',
    date: '4 hours ago',
  },
  {
    id: 'post_fb_1',
    platform: 'facebook',
    authorName: 'Architectural Digest World',
    authorHandle: 'Architectural Digest Watch',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=60',
    caption: 'Modern Organic Glass Villa in the Swiss Alps: Full 1080p Architectural Tour & Interior Blueprint',
    thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=60',
    videoPreviewUrl: '',
    views: '1.7M views',
    likes: '98K',
    shares: '18K',
    duration: '08:42',
    mediaUrl: 'https://facebook.com/watch/?v=492019385721',
    date: 'Yesterday',
  },
  {
    id: 'post_ig_1',
    platform: 'instagram',
    authorName: 'Atelier Runway Paris',
    authorHandle: '@atelier_runway',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60',
    caption: 'Haute Couture Spring Collection Motion Reel with Orchestral 320kbps Soundtrack #PFW #HighFashion',
    thumbnail: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&auto=format&fit=crop&q=60',
    videoPreviewUrl: '',
    views: '940K views',
    likes: '124K',
    shares: '33K',
    duration: '01:12',
    mediaUrl: 'https://instagram.com/reel/C892837482',
    date: '1 day ago',
  },
  {
    id: 'post_tw_1',
    platform: 'twitter',
    authorName: 'AeroTech Live News',
    authorHandle: '@aerotech_live',
    authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60',
    caption: 'Unbelievable 4K Slow-Motion Rocket Exhaust Ignition & Orbital Separation Maneuver',
    thumbnail: 'https://images.unsplash.com/photo-1517976487588-46904618e47f?w=800&auto=format&fit=crop&q=60',
    videoPreviewUrl: '',
    views: '3.1M views',
    likes: '190K',
    shares: '44K',
    duration: '02:18',
    mediaUrl: 'https://twitter.com/aerotech_live/status/17923847291',
    date: '3 days ago',
  },
  {
    id: 'post_vm_1',
    platform: 'vimeo',
    authorName: 'CineLense Studio Masters',
    authorHandle: 'CineLense Film Labs',
    authorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=60',
    caption: 'Nomad in Iceland: Shot on RED Monstro 8K Anamorphic Glass with Ambisonic Binaural Sound',
    thumbnail: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&auto=format&fit=crop&q=60',
    videoPreviewUrl: '',
    views: '580K views',
    likes: '62K',
    shares: '12K',
    duration: '11:04',
    mediaUrl: 'https://vimeo.com/782910384',
    date: '5 days ago',
  },
];

export const SocialFeedBrowser: React.FC<SocialFeedBrowserProps> = ({
  onSelectVideoForDownload,
  darkMode,
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | PlatformType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'trending' | 'views' | 'likes' | 'shares' | 'duration'>('trending');
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);

  const platforms: Array<{ id: 'all' | PlatformType; label: string; color: string }> = [
    { id: 'all', label: 'All Feeds', color: 'bg-slate-800 text-white' },
    { id: 'youtube', label: 'YouTube', color: 'text-red-500' },
    { id: 'tiktok', label: 'TikTok', color: 'text-cyan-400' },
    { id: 'facebook', label: 'Facebook', color: 'text-blue-500' },
    { id: 'instagram', label: 'Instagram', color: 'text-pink-500' },
    { id: 'twitter', label: 'X / Twitter', color: 'text-sky-400' },
    { id: 'vimeo', label: 'Vimeo', color: 'text-blue-400' },
  ];

  // Parse metric string (e.g. "1.4M views", "92K") to numeric for accurate sorting
  const parseMetric = (str: string): number => {
    if (!str) return 0;
    const clean = str.replace(/[^0-9.KMBkmb]/g, '');
    let mult = 1;
    if (clean.toLowerCase().includes('b')) mult = 1_000_000_000;
    else if (clean.toLowerCase().includes('m')) mult = 1_000_000;
    else if (clean.toLowerCase().includes('k')) mult = 1_000;
    const val = parseFloat(clean);
    return isNaN(val) ? 0 : val * mult;
  };

  // Parse duration "MM:SS" to seconds
  const parseDurationSec = (dur: string): number => {
    if (!dur) return 0;
    const parts = dur.split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return 0;
  };

  const filteredPosts = sampleSocialPosts
    .filter((post) => {
      const matchesPlatform = selectedPlatform === 'all' || post.platform === selectedPlatform;
      const matchesSearch =
        post.caption.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.authorHandle.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesPlatform && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'views') return parseMetric(b.views) - parseMetric(a.views);
      if (sortBy === 'likes') return parseMetric(b.likes) - parseMetric(a.likes);
      if (sortBy === 'shares') return parseMetric(b.shares) - parseMetric(a.shares);
      if (sortBy === 'duration') return parseDurationSec(b.duration) - parseDurationSec(a.duration);
      return 0; // trending / default
    });

  const handleCopyLink = (post: SocialPost) => {
    navigator.clipboard?.writeText(post.mediaUrl);
    setCopiedPostId(post.id);
    setTimeout(() => setCopiedPostId(null), 2000);
  };

  return (
    <div id="social-feed-browser-container" className="space-y-4">
      {/* Header & In-App Browser Search Bar */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          darkMode ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
              <Compass className="w-5 h-5 text-cyan-500" />
              <span>Integrated Social Media Feed Explorer</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
              Scroll feeds directly in-app and grab video links with 1-click download extraction
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              id="social-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reels, tags, creators..."
              className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs sm:text-sm border outline-none ${
                darkMode
                  ? 'bg-zinc-950 border-zinc-700 text-zinc-100 placeholder-zinc-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>
        </div>

        {/* Platform Tabs & Sort Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar flex-1">
            {platforms.map((p) => {
              const isSelected = selectedPlatform === p.id;
              return (
                <button
                  key={p.id}
                  id={`platform-filter-tab-${p.id}`}
                  onClick={() => setSelectedPlatform(p.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : darkMode
                        ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>

          {/* Feed Sort Selector */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto flex-shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              id="social-feed-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              aria-label="Sort Social Feed by"
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold outline-none ${
                darkMode ? 'bg-zinc-950 border-zinc-700 text-zinc-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="trending">🔥 Trending</option>
              <option value="views">👁️ Most Views</option>
              <option value="likes">❤️ Most Likes</option>
              <option value="shares">🔄 Most Shares</option>
              <option value="duration">⏱️ Longest Video</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Social Feed Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPosts.map((post) => {
          return (
            <div
              key={post.id}
              id={`social-card-${post.id}`}
              className={`rounded-2xl border overflow-hidden flex flex-col justify-between transition-all hover:shadow-lg ${
                darkMode
                  ? 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Card Header: Creator Info */}
              <div className="p-3.5 flex items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-800/80">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={post.authorAvatar}
                    alt={post.authorName}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-zinc-700 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold truncate leading-tight">{post.authorName}</h4>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">{post.authorHandle}</p>
                  </div>
                </div>

                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 flex-shrink-0">
                  {post.platform}
                </span>
              </div>

              {/* Video Preview Image with Duration & Overlay Button */}
              <div className="relative group overflow-hidden bg-black/40 aspect-video">
                <img
                  src={post.thumbnail}
                  alt={post.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Duration Badge */}
                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-white text-[10px] font-mono font-semibold">
                  {post.duration}
                </div>

                {/* Hover 1-Click Action Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
                  <button
                    type="button"
                    id={`quick-dl-btn-${post.id}`}
                    onClick={() => onSelectVideoForDownload(post.mediaUrl, post.caption)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-xl shadow-cyan-600/40 transition-transform active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Media</span>
                  </button>
                </div>
              </div>

              {/* Card Body: Caption & Stats */}
              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                <p className="text-xs font-medium text-slate-700 dark:text-zinc-200 line-clamp-2 leading-relaxed">
                  {post.caption}
                </p>

                <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-slate-400 dark:text-zinc-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3 text-slate-400" />
                      {post.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3 text-rose-500" />
                      {post.likes}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopyLink(post)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors"
                      title="Copy Media URL"
                    >
                      {copiedPostId === post.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Share2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectVideoForDownload(post.mediaUrl, post.caption)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Extract</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
