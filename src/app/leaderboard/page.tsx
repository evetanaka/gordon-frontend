'use client'

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import ConnectButton from '@/components/ConnectButton';
import Navbar from '@/components/Navbar';
import MobileNav from '@/components/MobileNav';
import {
  ChevronDown, ChevronUp, ExternalLink, Copy, Power, Activity, ArrowUpRight, ArrowRight,
  LayoutDashboard, Layers, Trophy, Coins, Search, X, Star, Check, TrendingUp, Zap
} from 'lucide-react';
import { useLeaderboard } from '@/hooks/usePublicData';

// --- HOOKS ---
const useScrollReveal = (opts: { threshold?: number; delay?: number } = {}) => {
  const ref = useRef<any>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setTimeout(() => setV(true), opts.delay || 0); o.unobserve(e.target); } }, { threshold: opts.threshold || 0.1 });
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, [opts.delay, opts.threshold]);
  return [ref, v] as const;
};
const useCountUp = (end: number, dur = 2000, start = 0, dec = 0, pre = '', suf = '') => {
  const [c, setC] = useState(start);
  const [ref, vis] = useScrollReveal({ threshold: 0.5 });
  useEffect(() => {
    if (!vis) return;
    let s: number | null = null;
    const a = (t: number) => { if (!s) s = t; const p = Math.min((t - s) / dur, 1); setC(start + (end - start) * (1 - Math.pow(1 - p, 5))); if (p < 1) requestAnimationFrame(a); else setC(end); };
    requestAnimationFrame(a);
  }, [vis, end, dur, start]);
  return [ref, `${pre}${c.toFixed(dec).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}${suf}`] as const;
};
const useOnClickOutside = (ref: React.RefObject<any>, handler: (e: any) => void) => {
  useEffect(() => {
    const l = (e: any) => { if (!ref.current || ref.current.contains(e.target)) return; handler(e); };
    document.addEventListener('mousedown', l); document.addEventListener('touchstart', l);
    return () => { document.removeEventListener('mousedown', l); document.removeEventListener('touchstart', l); };
  }, [ref, handler]);
};

// --- DATA ---
const genSparkline = (base: number, trend: number) => Array.from({ length: 30 }, (_, i) => Math.max(0, Math.min(100, base + trend * (i / 30) + (Math.random() - 0.5) * 12)));

// --- SPARKLINE ---
const Sparkline = ({ data, width = 60, height = 20 }: { data: number[]; width?: number; height?: number }) => {
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`).join(' ');
  const up = data[data.length - 1] > data[0];
  return (
    <svg width={width} height={height} className="inline-block">
      <polyline points={pts} fill="none" stroke={up ? '#00FF66' : '#FF3B3B'} strokeWidth="1.5" />
    </svg>
  );
};

// --- TOAST ---
const Toast = ({ message, visible }: { message: string; visible: boolean }) => {
  if (!visible) return null;
  return (
    <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-fade-in-up">
      <div className="bg-[#111] border border-[#00FF66] px-4 py-2 font-mono text-xs text-[#00FF66] shadow-[0_0_20px_rgba(0,255,102,0.15)] flex items-center gap-2">
        <Check className="w-3 h-3" /> {message}
      </div>
    </div>
  );
};

// --- MAIN ---
type SortKey = 'winRate' | 'pnl' | 'roi' | 'volume' | 'openPos' | 'trackedDays';
type SortDir = 'asc' | 'desc';
type Tab = 'all' | 'top50' | 'whales' | 'rising' | 'watchlist';

export default function LeaderboardPage() {
  const { data: apiWallets, isLoading: apiLoading } = useLeaderboard('score', 100);
  const WALLETS = apiWallets.map((w, i) => ({
    address: w.address,
    short: `${w.address.slice(0, 6)}...${w.address.slice(-4)}`,
    winRate: w.winRate,
    pnl: w.pnl,
    roi: w.roi,
    volume: w.volume,
    openPos: 0,
    trackedDays: 0,
    vault: w.vaults[0] || null,
    vaultId: w.vaults[0] || null,
    vaultRank: i + 1,
    signalShare: null,
    isRising: false,
    risingDelta: 0,
    sparkline: genSparkline(50 + w.winRate * 0.3, w.roi > 0 ? 10 : -5),
    rank: w.rank,
    score: w.score,
  }));
  const [isConnected, setIsConnected] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [timePeriod, setTimePeriod] = useState('30D');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('winRate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [visibleCount, setVisibleCount] = useState(50);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVis, setToastVis] = useState(false);
  const [watchlist, setWatchlist] = useState<string[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  useOnClickOutside(dropdownRef, () => setDropdownOpen(false));

  useEffect(() => {
    try { setWatchlist(JSON.parse(localStorage.getItem('gordon_watchlist') || '[]')); } catch { setWatchlist([]); }
  }, []);

  const showToast = useCallback((m: string) => { setToastMsg(m); setToastVis(true); setTimeout(() => setToastVis(false), 3000); }, []);

  const toggleWatchlist = (addr: string) => {
    const next = watchlist.includes(addr) ? watchlist.filter(a => a !== addr) : [...watchlist, addr];
    setWatchlist(next);
    localStorage.setItem('gordon_watchlist', JSON.stringify(next));
    showToast(next.includes(addr) ? 'Added to watchlist' : 'Removed from watchlist');
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const [trackedRef, tracked] = useCountUp(4209, 2000, 0, 0);
  const [avgWrRef, avgWr] = useCountUp(64.2, 2000, 0, 1, '', '%');
  const [topRoiRef, topRoi] = useCountUp(412, 2000, 0, 0, '+', '%');
  const [totalVolRef, totalVol] = useCountUp(142, 2000, 0, 0, '$', 'M');

  const filtered = useMemo(() => {
    let list = [...WALLETS];
    if (activeTab === 'top50') list = list.filter(w => w.vault === 'Alpha Vault' && (w.vaultRank || 999) <= 50);
    else if (activeTab === 'whales') list = list.filter(w => w.vault === 'Degen Vault' && (w.vaultRank || 999) <= 5);
    else if (activeTab === 'rising') list = list.filter(w => w.isRising);
    else if (activeTab === 'watchlist') list = list.filter(w => watchlist.includes(w.short));
    if (searchQuery) list = list.filter(w => w.short.toLowerCase().includes(searchQuery.toLowerCase()) || w.address.toLowerCase().includes(searchQuery.toLowerCase()));
    list.sort((a: any, b: any) => sortDir === 'desc' ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey]);
    return list.map((w, i) => ({ ...w, rank: i + 1 }));
  }, [activeTab, searchQuery, sortKey, sortDir, watchlist]);

  const visible = filtered.slice(0, visibleCount);
  const medals = ['🥇', '🥈', '🥉'];
  const wrColor = (wr: number) => wr >= 75 ? 'text-[#00FF66]' : wr >= 60 ? 'text-white' : 'text-[#FF3B3B]';
  const pnlColor = (v: number) => v > 0 ? 'text-[#00FF66]' : v < 0 ? 'text-[#FF3B3B]' : 'text-[#6B6B6B]';
  const fmtPnl = (v: number) => `${v >= 0 ? '+' : ''}$${Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toLocaleString()}`;
  const fmtVol = (v: number) => v >= 1000000 ? `$${(v / 1000000).toFixed(1)}M` : `$${(v / 1000).toFixed(0)}K`;

  const SortHeader = ({ label, k, cls }: { label: string; k: SortKey; cls?: string }) => (
    <button onClick={() => handleSort(k)} className={`flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest transition-colors ${sortKey === k ? 'text-white' : 'text-[#6B6B6B] hover:text-white'} ${cls || ''}`}>
      {label}
      {sortKey === k && (sortDir === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />)}
    </button>
  );

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'all', label: 'All' },
    { id: 'top50', label: 'Top 50' },
    { id: 'whales', label: 'Top 5 Whales' },
    { id: 'rising', label: 'Rising Stars' },
    { id: 'watchlist', label: `Watchlist${watchlist.length > 0 ? ` (${watchlist.length})` : ''}` },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-[#00FF66] selection:text-black pb-24 md:pb-12">
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Space+Grotesk:wght@700&display=swap');
        .font-sans { font-family: 'Space Grotesk', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes glitch-h { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(100%); } }
        .animate-glitch-h { animation: glitch-h 3s linear infinite; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0A0A0A; }
        ::-webkit-scrollbar-thumb { background: #333; }
        ::-webkit-scrollbar-thumb:hover { background: #00FF66; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      <Navbar />
      <MobileNav />

      {/* MAIN */}
      <main className="max-w-5xl mx-auto px-4 md:px-6 pt-24 pb-12 md:pb-24">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-[#6B6B6B] font-mono text-xs uppercase tracking-widest flex items-center gap-2">
                <span className="text-[#00FF66]">&gt;</span> LEADERBOARD
              </h1>
            </div>
            <div className="w-full h-[1px] bg-[#333] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1/4 h-full bg-[#00FF66] opacity-20 animate-glitch-h" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse" />
            <span className="font-mono text-xs text-[#6B6B6B]">4,209 wallets tracked · Updated 12s ago</span>
          </div>
        </div>

        {/* PROTOCOL STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Total Tracked', value: tracked, ref: trackedRef },
            { label: 'Avg Win Rate', value: avgWr, ref: avgWrRef, color: 'text-[#00FF66]' },
            { label: 'Top Wallet ROI', value: topRoi, ref: topRoiRef, color: 'text-[#00FF66]' },
            { label: 'Total Volume', value: totalVol, ref: totalVolRef },
          ].map((s, i) => (
            <div key={i} className="bg-[#111] border border-[#333] p-4 hover:border-[#6B6B6B] transition-colors">
              <div className="font-mono text-[9px] text-[#6B6B6B] uppercase tracking-widest mb-2">{s.label}</div>
              <div ref={s.ref} className={`font-sans font-bold text-xl ${s.color || 'text-white'}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* FILTERS + SEARCH */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => { setActiveTab(tab.id); setVisibleCount(50); }}
                  className={`px-3 py-2 font-mono text-[10px] uppercase tracking-widest whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-[#00FF66] text-black' : 'text-[#6B6B6B] hover:text-white bg-[#111] border border-[#333]'}`}>
                  {tab.id === 'watchlist' && <Star className="w-3 h-3 inline mr-1" />}{tab.label}
                </button>
              ))}
            </div>
            {/* Time */}
            <div className="flex gap-1">
              {['7D', '30D', '90D', 'ALL'].map(p => (
                <button key={p} onClick={() => setTimePeriod(p)} className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors ${timePeriod === p ? 'bg-[#333] text-white' : 'text-[#6B6B6B] hover:text-white'}`}>
                  [{p}]
                </button>
              ))}
            </div>
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
            <input ref={searchRef} type="text" placeholder="Search wallet address..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-[#333] focus:border-[#00FF66] outline-none pl-10 pr-10 py-3 font-mono text-xs text-white placeholder-[#6B6B6B] transition-colors" />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B6B] hover:text-white"><X className="w-4 h-4" /></button>
            )}
          </div>
        </div>

        {/* TABLE */}
        {visible.length === 0 ? (
          <div className="border border-[#333] bg-[#111] py-20 text-center">
            <Trophy className="w-8 h-8 text-[#333] mx-auto mb-4" />
            <div className="font-mono text-xs text-[#6B6B6B] uppercase tracking-widest mb-2">No Wallets Found</div>
            <p className="text-[#E0E0E0] text-sm max-w-xs mx-auto">
              {activeTab === 'watchlist' ? "Your watchlist is empty. Star wallets to track them here." : "No wallets match your search."}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-[#333] items-center">
                <div className="col-span-1 font-mono text-[10px] text-[#6B6B6B] uppercase tracking-widest">#</div>
                <div className="col-span-2 font-mono text-[10px] text-[#6B6B6B] uppercase tracking-widest">Wallet</div>
                <div className="col-span-1"><SortHeader label="Win %" k="winRate" /></div>
                <div className="col-span-2 text-right"><SortHeader label={`${timePeriod} PNL`} k="pnl" cls="justify-end" /></div>
                <div className="col-span-1 text-right"><SortHeader label="ROI" k="roi" cls="justify-end" /></div>
                <div className="col-span-2 text-right"><SortHeader label="Volume" k="volume" cls="justify-end" /></div>
                <div className="col-span-2 text-right font-mono text-[10px] text-[#6B6B6B] uppercase tracking-widest">Trend</div>
                <div className="col-span-1" />
              </div>

              {visible.map((w, i) => (
                <Link key={w.address} href={`/leaderboard/${w.short}`}
                  className={`grid grid-cols-12 gap-2 px-4 py-3 border-b border-[#222] hover:bg-[#111] transition-all items-center group cursor-pointer animate-fade-in-up ${w.rank <= 3 ? `border-l-2 ${w.rank === 1 ? 'border-l-[#FFD700]' : w.rank === 2 ? 'border-l-[#C0C0C0]' : 'border-l-[#CD7F32]'}` : ''}`}
                  style={{ animationDelay: `${i * 30}ms`, opacity: 0 }}>
                  <div className="col-span-1 font-mono text-xs text-[#6B6B6B]">{w.rank <= 3 ? medals[w.rank - 1] : w.rank}</div>
                  <div className="col-span-2">
                    <div className="font-mono text-xs text-white group-hover:text-[#00FF66] transition-colors">{w.short}</div>
                    <div className="font-mono text-[9px] text-[#6B6B6B] mt-0.5">
                      {w.isRising && <span className="text-[#00FF66]">📈 Rising +{w.risingDelta}% · </span>}
                      {w.vault && <span>{w.vaultRank && w.vaultRank <= 3 ? medals[w.vaultRank - 1] : ''} {w.vault} · </span>}
                      {w.trackedDays}d{w.signalShare ? ` · ${w.signalShare}%` : ''}
                    </div>
                  </div>
                  <div className={`col-span-1 font-mono text-sm font-bold ${wrColor(w.winRate)}`}>{w.winRate}%</div>
                  <div className={`col-span-2 text-right font-mono text-sm ${pnlColor(w.pnl)}`}>{fmtPnl(w.pnl)}</div>
                  <div className={`col-span-1 text-right font-mono text-sm ${pnlColor(w.roi)}`}>+{w.roi}%</div>
                  <div className="col-span-2 text-right font-mono text-sm text-[#6B6B6B]">{fmtVol(w.volume)}</div>
                  <div className="col-span-2 text-right"><Sparkline data={w.sparkline} /></div>
                  <div className="col-span-1 text-right">
                    <ArrowRight className="w-3 h-3 text-[#333] group-hover:text-[#00FF66] transition-colors inline" />
                  </div>
                </Link>
              ))}
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden flex flex-col gap-3">
              {visible.map((w, i) => (
                <Link key={w.address} href={`/leaderboard/${w.short}`}
                  className={`bg-[#111] border border-[#333] p-4 hover:border-[#6B6B6B] transition-colors animate-fade-in-up ${w.rank <= 3 ? `border-l-2 ${w.rank === 1 ? 'border-l-[#FFD700]' : w.rank === 2 ? 'border-l-[#C0C0C0]' : 'border-l-[#CD7F32]'}` : ''}`}
                  style={{ animationDelay: `${i * 30}ms`, opacity: 0 }}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="font-mono text-xs text-[#6B6B6B] mr-2">#{w.rank}</span>
                      <span className="font-mono text-sm text-white">{w.short}</span>
                    </div>
                    <Sparkline data={w.sparkline} width={50} height={16} />
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-2">
                    <div>
                      <div className="font-mono text-[9px] text-[#6B6B6B] uppercase">Win Rate</div>
                      <div className={`font-mono text-sm font-bold ${wrColor(w.winRate)}`}>{w.winRate}%</div>
                    </div>
                    <div>
                      <div className="font-mono text-[9px] text-[#6B6B6B] uppercase">PNL</div>
                      <div className={`font-mono text-sm ${pnlColor(w.pnl)}`}>{fmtPnl(w.pnl)}</div>
                    </div>
                    <div>
                      <div className="font-mono text-[9px] text-[#6B6B6B] uppercase">ROI</div>
                      <div className={`font-mono text-sm ${pnlColor(w.roi)}`}>+{w.roi}%</div>
                    </div>
                  </div>
                  <div className="font-mono text-[9px] text-[#6B6B6B]">
                    {w.isRising && <span className="text-[#00FF66]">📈 Rising · </span>}
                    {w.vault && <span>{w.vault} · </span>}
                    {fmtVol(w.volume)} vol · {w.trackedDays}d
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            <div className="text-center mt-6 space-y-2">
              <div className="font-mono text-[10px] text-[#6B6B6B]">Showing {Math.min(visibleCount, filtered.length)} of {activeTab === 'all' ? '4,209' : filtered.length} wallets</div>
              {visibleCount < filtered.length && (
                <button onClick={() => setVisibleCount(c => c + 50)} className="font-mono text-xs text-[#6B6B6B] hover:text-[#00FF66] uppercase tracking-widest transition-colors">
                  [Load More]
                </button>
              )}
            </div>
          </>
        )}
      </main>

      <Toast message={toastMsg} visible={toastVis} />
    </div>
  );
}
