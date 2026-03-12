'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import ConnectButton from '@/components/ConnectButton';
import {
  ChevronDown, ExternalLink, Copy, Power, Activity, ArrowUpRight, ArrowLeft, ArrowRight,
  LayoutDashboard, Layers, Trophy, Coins, Check, Star, Zap
} from 'lucide-react';

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

const SectionHeader = ({ title }: { title: string }) => {
  const [ref, vis] = useScrollReveal();
  return (
    <div ref={ref} className={`mb-6 transition-all duration-500 ${vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <h2 className="text-[#6B6B6B] font-mono text-xs uppercase tracking-widest flex items-center gap-2"><span className="text-[#00FF66]">&gt;</span> {title}</h2>
      <div className="w-full h-[1px] bg-[#333] mt-2 relative overflow-hidden"><div className="absolute top-0 left-0 w-1/4 h-full bg-[#00FF66] opacity-20 animate-glitch-h" /></div>
    </div>
  );
};

// --- CHART ---
const WinRateChart = ({ data, avgData }: { data: number[]; avgData: number[] }) => {
  const [hovered, setHovered] = useState<any>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);
  useEffect(() => {
    const u = () => { if (chartRef.current) setWidth(chartRef.current.clientWidth); };
    u(); window.addEventListener('resize', u); return () => window.removeEventListener('resize', u);
  }, []);
  const h = 250, pad = { t: 20, r: 20, b: 30, l: 50 };
  const getX = (i: number) => pad.l + (i / (data.length - 1)) * (width - pad.l - pad.r);
  const getY = (v: number) => h - pad.b - (v / 100) * (h - pad.t - pad.b);
  const pathD = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d)}`).join(' ');
  const areaD = `${pathD} L ${getX(data.length - 1)} ${h - pad.b} L ${getX(0)} ${h - pad.b} Z`;
  const avgPath = avgData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d)}`).join(' ');

  const handleMouse = (e: React.MouseEvent) => {
    if (!chartRef.current) return;
    const rect = chartRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const cw = rect.width - pad.l - pad.r;
    const rx = Math.max(0, Math.min(x - pad.l, cw));
    const idx = Math.round((rx / cw) * (data.length - 1));
    if (idx >= 0 && idx < data.length) setHovered({ x: getX(idx), y: getY(data[idx]), val: data[idx], avg: avgData[idx], day: idx + 1 });
  };

  return (
    <div className="relative w-full h-[250px]" ref={chartRef} onMouseMove={handleMouse} onMouseLeave={() => setHovered(null)}>
      <svg className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="wrGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00FF66" stopOpacity="0.1" /><stop offset="100%" stopColor="#00FF66" stopOpacity="0" />
          </linearGradient>
          <pattern id="gridWr" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="#222" strokeWidth="0.5" /></pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#gridWr)" />
        <g className="font-mono text-[10px] fill-[#6B6B6B]">
          {[0, 25, 50, 75, 100].map(v => (
            <g key={v}>
              <line x1={pad.l - 5} y1={getY(v)} x2="100%" y2={getY(v)} stroke="#222" strokeWidth="1" strokeDasharray="2,2" />
              <text x={pad.l - 10} y={getY(v) + 4} textAnchor="end">{v}%</text>
            </g>
          ))}
        </g>
        <path d={avgPath} fill="none" stroke="#6B6B6B" strokeWidth="1.5" strokeDasharray="6,4" opacity="0.5" />
        <path d={areaD} fill="url(#wrGrad)" />
        <path d={pathD} fill="none" stroke="#00FF66" strokeWidth="2" strokeLinejoin="round" />
        {hovered && (
          <g>
            <line x1={hovered.x} y1={pad.t} x2={hovered.x} y2={h - pad.b} stroke="#6B6B6B" strokeWidth="1" strokeDasharray="4,4" />
            <circle cx={hovered.x} cy={hovered.y} r="4" fill="#0A0A0A" stroke="#00FF66" strokeWidth="2" />
          </g>
        )}
      </svg>
      {hovered && (
        <div className="absolute pointer-events-none bg-[#111] border border-[#333] p-3 shadow-[0_0_15px_rgba(0,255,102,0.1)] z-10" style={{ left: Math.min(hovered.x + 15, width - 150), top: Math.max(pad.t, hovered.y - 60) }}>
          <div className="text-[#6B6B6B] font-mono text-[10px] mb-1">Day {hovered.day}</div>
          <div className="text-[#00FF66] font-mono font-bold text-sm">{hovered.val.toFixed(1)}%</div>
          <div className="text-[#6B6B6B] font-mono text-[10px] mt-1">Avg: {hovered.avg.toFixed(1)}%</div>
        </div>
      )}
      <div className="absolute top-2 right-2 flex gap-4 font-mono text-[10px] text-[#6B6B6B]">
        <span className="flex items-center gap-1"><span className="w-3 h-[2px] bg-[#00FF66] inline-block" /> Win Rate</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0 inline-block" style={{ borderBottom: '1.5px dashed #6B6B6B' }} /> Average</span>
      </div>
    </div>
  );
};

// --- MOCK DATA ---
const PROFILES: Record<string, any> = {
  '0x71C...49A2': {
    address: '0x71C7a3d849A2', short: '0x71C...49A2', rank: 1,
    winRate: 84.2, pnl30d: 142500, roiAllTime: 412, totalVolume: 2100000,
    openPositions: 3, avgTradeSize: 24500, totalTrades: 142, trackedSince: '47 days ago', trackedDays: 47,
    bestTrade: { amount: 82000, pct: 340, market: 'Trump wins 2026' },
    worstTrade: { amount: -12000, pct: -18, market: 'SOL > $300' },
    winRateHistory: Array.from({ length: 30 }, (_, i) => ({ day: i + 1, rate: Math.min(95, 60 + i * 0.8 + (Math.random() - 0.3) * 5), avgRate: 62 + Math.random() * 4 })),
    categories: [
      { name: 'Political', pct: 42, color: '#00FF66' },
      { name: 'Crypto', pct: 31, color: '#3B82F6' },
      { name: 'Macro', pct: 18, color: '#FFD700' },
      { name: 'Other', pct: 9, color: '#6B6B6B' },
    ],
    positions: [
      { market: 'Trump wins 2026', side: 'YES', size: 420000, pnl: 12.4 },
      { market: 'BTC > $150K Q2', side: 'YES', size: 74000, pnl: -2.1 },
      { market: 'Fed cuts rates May', side: 'YES', size: 95000, pnl: 3.2 },
    ],
    trades: [
      { time: '2m ago', market: 'Trump wins 2026', action: 'BUY', side: 'YES', size: 42000, result: 'open', resultAmount: 0, resultPct: 12.4 },
      { time: '2h ago', market: 'ETH > $5K by June', action: 'SELL', side: 'NO', size: 18000, result: 'win', resultAmount: 4200, resultPct: 23.3 },
      { time: '6h ago', market: 'BTC > $150K Q2', action: 'BUY', side: 'YES', size: 22000, result: 'open', resultAmount: 0, resultPct: -2.1 },
      { time: '1d ago', market: 'Apple buys Disney', action: 'SELL', side: 'NO', size: 35000, result: 'win', resultAmount: 12800, resultPct: 36.6 },
      { time: '2d ago', market: 'SOL > $300', action: 'SELL', side: 'YES', size: 8400, result: 'loss', resultAmount: -2100, resultPct: -25 },
      { time: '3d ago', market: 'Fed cuts rates May', action: 'BUY', side: 'YES', size: 12000, result: 'open', resultAmount: 0, resultPct: 3.2 },
      { time: '4d ago', market: 'US recession 2026', action: 'BUY', side: 'YES', size: 15000, result: 'win', resultAmount: 3200, resultPct: 21.3 },
      { time: '5d ago', market: 'Vitalik resigns', action: 'SELL', side: 'NO', size: 28000, result: 'win', resultAmount: 8400, resultPct: 30 },
      { time: '6d ago', market: 'ETH merge v2', action: 'BUY', side: 'YES', size: 19000, result: 'win', resultAmount: 5700, resultPct: 30 },
      { time: '7d ago', market: 'DOGE > $1', action: 'BUY', side: 'YES', size: 6000, result: 'loss', resultAmount: -1800, resultPct: -30 },
      { time: '8d ago', market: 'BTC ETF inflows', action: 'BUY', side: 'YES', size: 32000, result: 'win', resultAmount: 9600, resultPct: 30 },
      { time: '10d ago', market: 'OpenAI IPO Q2', action: 'SELL', side: 'YES', size: 14000, result: 'win', resultAmount: 2800, resultPct: 20 },
      { time: '12d ago', market: 'Fed hike surprise', action: 'BUY', side: 'NO', size: 25000, result: 'win', resultAmount: 7500, resultPct: 30 },
      { time: '14d ago', market: 'Nvidia > $200', action: 'BUY', side: 'YES', size: 18000, result: 'loss', resultAmount: -3600, resultPct: -20 },
    ],
    vaults: [{ name: 'Alpha Vault', id: 'alpha', rank: 1, signalShare: 32, trackedDays: 47 }],
  },
  '0xA1F...88D3': {
    address: '0xA1F9c3e288D3', short: '0xA1F...88D3', rank: 4,
    winRate: 72.4, pnl30d: 68100, roiAllTime: 412, totalVolume: 8400000,
    openPositions: 4, avgTradeSize: 85000, totalTrades: 98, trackedSince: '62 days ago', trackedDays: 62,
    bestTrade: { amount: 240000, pct: 180, market: 'BTC > $200K' },
    worstTrade: { amount: -45000, pct: -35, market: 'ETH flippening' },
    winRateHistory: Array.from({ length: 30 }, (_, i) => ({ day: i + 1, rate: Math.min(90, 55 + i * 0.6 + (Math.random() - 0.3) * 8), avgRate: 62 + Math.random() * 4 })),
    categories: [
      { name: 'Crypto', pct: 58, color: '#3B82F6' },
      { name: 'Political', pct: 22, color: '#00FF66' },
      { name: 'Macro', pct: 15, color: '#FFD700' },
      { name: 'Other', pct: 5, color: '#6B6B6B' },
    ],
    positions: [
      { market: 'BTC > $200K 2026', side: 'YES', size: 280000, pnl: 28.4 },
      { market: 'ETH flippening', side: 'YES', size: 190000, pnl: -8.7 },
      { market: 'Solana > $500', side: 'YES', size: 140000, pnl: 15.2 },
      { market: 'DOGE > $1', side: 'YES', size: 72000, pnl: -12.3 },
    ],
    trades: [
      { time: '5m ago', market: 'BTC > $200K 2026', action: 'BUY', side: 'YES', size: 85000, result: 'open', resultAmount: 0, resultPct: 28.4 },
      { time: '42m ago', market: 'ETH flippening', action: 'SELL', side: 'YES', size: 44000, result: 'loss', resultAmount: -15400, resultPct: -35 },
      { time: '2h ago', market: 'Fed emergency cut', action: 'BUY', side: 'NO', size: 32000, result: 'win', resultAmount: 9600, resultPct: 30 },
      { time: '1d ago', market: 'Solana > $500', action: 'BUY', side: 'YES', size: 140000, result: 'open', resultAmount: 0, resultPct: 15.2 },
      { time: '3d ago', market: 'DOGE > $1', action: 'BUY', side: 'YES', size: 72000, result: 'open', resultAmount: 0, resultPct: -12.3 },
    ],
    vaults: [{ name: 'Degen Vault', id: 'degen', rank: 1, signalShare: 38, trackedDays: 62 }],
  },
};

// --- CATEGORY BAR ---
const CategoryBar = ({ cat, index }: { cat: { name: string; pct: number; color: string }; index: number }) => {
  const [ref, vis] = useScrollReveal({ delay: index * 150 });
  return (
    <div ref={ref}>
      <div className="flex justify-between font-mono text-xs mb-1.5">
        <span className="text-white">{cat.name}</span>
        <span className="text-[#6B6B6B]">{cat.pct}%</span>
      </div>
      <div className="w-full h-2 bg-[#222] overflow-hidden">
        <div className="h-full transition-all duration-700 ease-out" style={{ width: vis ? `${cat.pct}%` : '0%', backgroundColor: cat.color }} />
      </div>
    </div>
  );
};

// --- MAIN ---
export default function WalletProfilePage({ params }: { params: { address: string } }) {
  const profile = PROFILES[decodeURIComponent(params.address)];

  const [isConnected, setIsConnected] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [chartPeriod, setChartPeriod] = useState('30D');
  const [tradeTab, setTradeTab] = useState('all');
  const [tradeCount, setTradeCount] = useState(20);
  const [watchlisted, setWatchlisted] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVis, setToastVis] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(dropdownRef, () => setDropdownOpen(false));

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => {
    if (profile) {
      try { const wl = JSON.parse(localStorage.getItem('gordon_watchlist') || '[]'); setWatchlisted(wl.includes(profile.short)); } catch {}
    }
  }, [profile]);

  const showToast = useCallback((m: string) => { setToastMsg(m); setToastVis(true); setTimeout(() => setToastVis(false), 3000); }, []);

  const toggleWatchlist = () => {
    if (!profile) return;
    try {
      const wl = JSON.parse(localStorage.getItem('gordon_watchlist') || '[]');
      const next = watchlisted ? wl.filter((a: string) => a !== profile.short) : [...wl, profile.short];
      localStorage.setItem('gordon_watchlist', JSON.stringify(next));
      setWatchlisted(!watchlisted);
      showToast(watchlisted ? 'Removed from watchlist' : 'Added to watchlist');
    } catch {}
  };

  const medals = ['🥇', '🥈', '🥉'];
  const wrColor = (wr: number) => wr >= 75 ? 'text-[#00FF66]' : wr >= 60 ? 'text-white' : 'text-[#FF3B3B]';
  const pnlColor = (v: number) => v > 0 ? 'text-[#00FF66]' : v < 0 ? 'text-[#FF3B3B]' : 'text-[#6B6B6B]';
  const fmtK = (v: number) => Math.abs(v) >= 1000 ? `$${(Math.abs(v) / 1000).toFixed(1)}K` : `$${Math.abs(v)}`;
  const fmtVol = (v: number) => v >= 1000000 ? `$${(v / 1000000).toFixed(1)}M` : `$${(v / 1000).toFixed(0)}K`;

  const filteredTrades = profile ? profile.trades.filter((t: any) => {
    if (tradeTab === 'wins') return t.result === 'win';
    if (tradeTab === 'losses') return t.result === 'loss';
    if (tradeTab === 'open') return t.result === 'open';
    return true;
  }) : [];
  const visibleTrades = filteredTrades.slice(0, tradeCount);

  const chartData = profile ? profile.winRateHistory.map((d: any) => d.rate) : [];
  const avgData = profile ? profile.winRateHistory.map((d: any) => d.avgRate) : [];

  // Stat count-ups (always called, use 0 if no profile)
  const [wrRef, wrVal] = useCountUp(profile?.winRate || 0, 2000, 0, 1, '', '%');
  const [pnlRef, pnlVal] = useCountUp((profile?.pnl30d || 0) / 1000, 2000, 0, 1, '+$', 'K');
  const [roiRef, roiVal] = useCountUp(profile?.roiAllTime || 0, 2000, 0, 0, '+', '%');
  const [volRef, volVal] = useCountUp((profile?.totalVolume || 0) / 1000000, 2000, 0, 1, '$', 'M');

  // Avatar gradient from address
  const hash = profile ? profile.address.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0) : 0;

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="font-mono text-[#6B6B6B] text-xs uppercase tracking-widest mb-4">&gt; WALLET NOT FOUND</div>
          <Link href="/leaderboard" className="text-[#00FF66] font-mono text-sm hover:underline">← Back to Leaderboard</Link>
        </div>
      </div>
    );
  }
  const hue1 = hash % 360;
  const hue2 = (hash * 7) % 360;

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
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #0A0A0A; } ::-webkit-scrollbar-thumb { background: #333; }
      `}} />

      {/* NAVBAR */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#333]' : 'bg-transparent border-b border-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-mono font-bold text-xl tracking-tighter text-white">GORDON<span className="text-[#00FF66]">.fi</span></Link>
          <div className="hidden md:flex items-center gap-8">
            {[{ l: 'Dashboard', h: '/dashboard' }, { l: 'Vaults', h: '/vaults' }, { l: 'Leaderboard', h: '/leaderboard' }, { l: 'Stake', h: '/stake' }, { l: '$GDN', h: '/token' }].map(link => (
              <Link key={link.l} href={link.h} className={`font-mono text-xs uppercase tracking-widest relative group transition-colors ${link.l === 'Leaderboard' ? 'text-white' : 'text-[#6B6B6B] hover:text-[#00FF66]'}`}>
                {link.l}<span className={`absolute -bottom-1 left-0 h-[1px] transition-all duration-300 ${link.l === 'Leaderboard' ? 'w-full bg-white' : 'w-0 bg-[#00FF66] group-hover:w-full'}`} />
              </Link>
            ))}
          </div>
          <ConnectButton />
        </div>
      </nav>

      {/* MOBILE NAV */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#0A0A0A] border-t border-[#333] z-50 flex justify-around items-center h-16 pb-safe">
        <Link href="/dashboard" className="flex flex-col items-center gap-1 text-[#6B6B6B]"><LayoutDashboard className="w-5 h-5" /><span className="font-mono text-[10px] tracking-widest uppercase">Dash</span></Link>
        <Link href="/vaults" className="flex flex-col items-center gap-1 text-[#6B6B6B]"><Layers className="w-5 h-5" /><span className="font-mono text-[10px] tracking-widest uppercase">Vaults</span></Link>
        <Link href="/stake" className="flex flex-col items-center gap-1 text-[#6B6B6B]"><Zap className="w-5 h-5" /><span className="font-mono text-[10px] tracking-widest uppercase">Stake</span></Link>
        <Link href="/token" className="flex flex-col items-center gap-1 text-[#6B6B6B]"><Coins className="w-5 h-5" /><span className="font-mono text-[10px] tracking-widest uppercase">$GDN</span></Link>
      </div>

      {/* MAIN */}
      <main className="max-w-5xl mx-auto px-4 md:px-6 pt-24 pb-12 md:pb-24">

        {/* BACK */}
        <Link href="/leaderboard" className="inline-flex items-center gap-2 text-[#6B6B6B] hover:text-[#00FF66] font-mono text-xs uppercase tracking-widest mb-8 transition-colors">
          <ArrowLeft className="w-3 h-3" /> Back to Leaderboard
        </Link>

        {/* WALLET HEADER */}
        <div className="flex flex-col md:flex-row gap-4 md:items-center mb-8">
          <div className="w-14 h-14 rounded-full shrink-0" style={{ background: `linear-gradient(135deg, hsl(${hue1},70%,50%), hsl(${hue2},70%,50%))` }} />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-mono text-lg md:text-xl text-white">{profile.short}</span>
              <span className="font-mono text-[10px] px-2 py-0.5 bg-[#00FF66]/10 text-[#00FF66] uppercase tracking-widest">
                {profile.rank <= 3 ? medals[profile.rank - 1] : '#'}{profile.rank <= 3 ? '' : profile.rank} Ranked
              </span>
            </div>
            <div className="font-mono text-xs text-[#6B6B6B]">
              {profile.vaults.map((v: any) => `${v.rank <= 3 ? medals[v.rank - 1] : '#' + v.rank} ${v.name} · ${v.signalShare}% signals`).join(' · ')} · Tracked {profile.trackedSince}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { navigator.clipboard.writeText(profile.address); showToast('Address copied'); }}
              className="px-3 py-2 border border-[#333] text-[#6B6B6B] hover:text-white hover:border-[#6B6B6B] font-mono text-[10px] uppercase tracking-widest transition-colors flex items-center gap-1">
              <Copy className="w-3 h-3" /> Copy
            </button>
            <button className="px-3 py-2 border border-[#333] text-[#6B6B6B] hover:text-white hover:border-[#6B6B6B] font-mono text-[10px] uppercase tracking-widest transition-colors flex items-center gap-1">
              <ExternalLink className="w-3 h-3" /> Etherscan
            </button>
            <button onClick={toggleWatchlist}
              className={`px-3 py-2 border font-mono text-[10px] uppercase tracking-widest transition-colors flex items-center gap-1 ${watchlisted ? 'border-[#FFD700] text-[#FFD700] bg-[#FFD700]/10' : 'border-[#333] text-[#6B6B6B] hover:text-[#FFD700] hover:border-[#FFD700]'}`}>
              <Star className={`w-3 h-3 ${watchlisted ? 'fill-[#FFD700]' : ''}`} /> {watchlisted ? 'Watching' : 'Watch'}
            </button>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
          {[
            { label: 'Win Rate', value: wrVal, ref: wrRef, color: wrColor(profile.winRate) },
            { label: '30D PNL', value: pnlVal, ref: pnlRef, color: 'text-[#00FF66]' },
            { label: 'All-time ROI', value: roiVal, ref: roiRef, color: 'text-[#00FF66]' },
            { label: 'Total Volume', value: volVal, ref: volRef },
            { label: 'Open Positions', value: profile.openPositions.toString() },
            { label: 'Avg Trade Size', value: fmtK(profile.avgTradeSize) },
            { label: 'Best Trade', value: `+${fmtK(profile.bestTrade.amount)}`, sub: profile.bestTrade.market, color: 'text-[#00FF66]' },
            { label: 'Worst Trade', value: `-${fmtK(Math.abs(profile.worstTrade.amount))}`, sub: profile.worstTrade.market, color: 'text-[#FF3B3B]' },
          ].map((s: any, i) => (
            <div key={i} className="bg-[#111] border border-[#333] p-4 hover:border-[#6B6B6B] transition-colors">
              <div className="font-mono text-[9px] text-[#6B6B6B] uppercase tracking-widest mb-2">{s.label}</div>
              <div ref={s.ref} className={`font-sans font-bold text-lg ${s.color || 'text-white'}`}>{s.value}</div>
              {s.sub && <div className="font-mono text-[9px] text-[#6B6B6B] mt-1 truncate">{s.sub}</div>}
            </div>
          ))}
        </div>

        {/* WIN RATE CHART */}
        <SectionHeader title="WIN RATE OVER TIME" />
        <div className="bg-[#111] border border-[#333] p-4 mb-12">
          <div className="flex justify-end gap-2 mb-4 font-mono text-[10px] uppercase tracking-widest">
            {['7D', '30D', '90D', 'ALL'].map(p => (
              <button key={p} onClick={() => setChartPeriod(p)} className={`px-3 py-1 transition-colors ${chartPeriod === p ? 'bg-[#333] text-white' : 'text-[#6B6B6B] hover:text-white'}`}>[{p}]</button>
            ))}
          </div>
          <WinRateChart data={chartData} avgData={avgData} />
        </div>

        {/* TWO COLUMNS */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Open Positions */}
          <div>
            <SectionHeader title="OPEN POSITIONS" />
            <div className="flex flex-col gap-3">
              {profile.positions.map((pos: any, i: number) => (
                <div key={i} className="bg-[#111] border border-[#333] p-4 hover:border-[#6B6B6B] transition-colors animate-fade-in-up" style={{ animationDelay: `${i * 100}ms`, opacity: 0 }}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-white text-sm">&ldquo;{pos.market}&rdquo;</div>
                    <div className={`font-mono text-sm font-bold ${pos.pnl >= 0 ? 'text-[#00FF66]' : 'text-[#FF3B3B]'}`}>{pos.pnl >= 0 ? '+' : ''}{pos.pnl}%</div>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-xs text-[#6B6B6B]">
                    <span className={`px-1.5 py-0.5 text-[10px] ${pos.side === 'YES' ? 'bg-[#00FF66]/10 text-[#00FF66]' : 'bg-[#FF3B3B]/10 text-[#FF3B3B]'}`}>{pos.side}</span>
                    <span>${(pos.size / 1000).toFixed(0)}K</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Market Breakdown */}
          <div>
            <SectionHeader title="MARKET BREAKDOWN" />
            <div className="bg-[#111] border border-[#333] p-5 space-y-4">
              {profile.categories.map((cat: any, i: number) => (
                <CategoryBar key={cat.name} cat={cat} index={i} />
              ))}
            </div>
          </div>
        </div>

        {/* TRADE HISTORY */}
        <SectionHeader title="TRADE HISTORY" />
        <div className="mb-12">
          {/* Tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'All Trades' },
              { id: 'wins', label: 'Wins ✓' },
              { id: 'losses', label: 'Losses ✗' },
              { id: 'open', label: 'Open' },
            ].map(tab => (
              <button key={tab.id} onClick={() => { setTradeTab(tab.id); setTradeCount(20); }}
                className={`px-3 py-2 font-mono text-[10px] uppercase tracking-widest whitespace-nowrap transition-colors ${tradeTab === tab.id ? 'bg-[#333] text-white' : 'text-[#6B6B6B] hover:text-white bg-[#111] border border-[#333]'}`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-[#111] border border-[#333]">
            <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-[#333] font-mono text-[10px] text-[#6B6B6B] uppercase tracking-widest">
              <div className="col-span-2">Time</div>
              <div className="col-span-4">Market</div>
              <div className="col-span-2">Action</div>
              <div className="col-span-2 text-right">Size</div>
              <div className="col-span-2 text-right">Result</div>
            </div>
            {visibleTrades.map((t: any, i: number) => (
              <div key={i} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-[#222] hover:bg-[#222]/50 transition-colors items-center animate-fade-in-up" style={{ animationDelay: `${i * 30}ms`, opacity: 0 }}>
                <div className="col-span-2 font-mono text-xs text-[#6B6B6B]">{t.time}</div>
                <div className="col-span-4 text-white text-sm truncate">&ldquo;{t.market}&rdquo;</div>
                <div className="col-span-2 font-mono text-xs">
                  <span className={t.action === 'BUY' ? 'text-[#00FF66]' : 'text-[#FF3B3B]'}>{t.action}</span>
                  {' '}<span className={`px-1 py-0.5 text-[10px] ${t.side === 'YES' ? 'bg-[#00FF66]/10 text-[#00FF66]' : 'bg-[#FF3B3B]/10 text-[#FF3B3B]'}`}>{t.side}</span>
                </div>
                <div className="col-span-2 text-right font-mono text-xs text-white">${(t.size / 1000).toFixed(0)}K</div>
                <div className={`col-span-2 text-right font-mono text-xs ${t.result === 'win' ? 'text-[#00FF66]' : t.result === 'loss' ? 'text-[#FF3B3B]' : 'text-[#6B6B6B]'}`}>
                  {t.result === 'win' && `✓ +$${(t.resultAmount / 1000).toFixed(1)}K`}
                  {t.result === 'loss' && `✗ -$${(Math.abs(t.resultAmount) / 1000).toFixed(1)}K`}
                  {t.result === 'open' && `Open ${t.resultPct >= 0 ? '+' : ''}${t.resultPct}%`}
                </div>
              </div>
            ))}
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden flex flex-col gap-3">
            {visibleTrades.map((t: any, i: number) => (
              <div key={i} className="bg-[#111] border border-[#333] p-4 animate-fade-in-up" style={{ animationDelay: `${i * 30}ms`, opacity: 0 }}>
                <div className="flex justify-between items-start mb-2">
                  <div className="text-white text-sm truncate flex-1">&ldquo;{t.market}&rdquo;</div>
                  <div className={`font-mono text-xs ml-2 ${t.result === 'win' ? 'text-[#00FF66]' : t.result === 'loss' ? 'text-[#FF3B3B]' : 'text-[#6B6B6B]'}`}>
                    {t.result === 'win' && `✓ +$${(t.resultAmount / 1000).toFixed(1)}K`}
                    {t.result === 'loss' && `✗ -$${(Math.abs(t.resultAmount) / 1000).toFixed(1)}K`}
                    {t.result === 'open' && `${t.resultPct >= 0 ? '+' : ''}${t.resultPct}%`}
                  </div>
                </div>
                <div className="flex items-center gap-3 font-mono text-[10px] text-[#6B6B6B]">
                  <span>{t.time}</span>
                  <span className={t.action === 'BUY' ? 'text-[#00FF66]' : 'text-[#FF3B3B]'}>{t.action}</span>
                  <span className={`px-1 py-0.5 ${t.side === 'YES' ? 'bg-[#00FF66]/10 text-[#00FF66]' : 'bg-[#FF3B3B]/10 text-[#FF3B3B]'}`}>{t.side}</span>
                  <span>${(t.size / 1000).toFixed(0)}K</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="text-center mt-4">
            <div className="font-mono text-[10px] text-[#6B6B6B] mb-2">{Math.min(tradeCount, filteredTrades.length)} of {profile.totalTrades} trades</div>
            {tradeCount < filteredTrades.length && (
              <button onClick={() => setTradeCount(c => c + 20)} className="font-mono text-xs text-[#6B6B6B] hover:text-[#00FF66] uppercase tracking-widest transition-colors">[Load More]</button>
            )}
          </div>
        </div>

        {/* VAULT CONTRIBUTION */}
        {profile.vaults.length > 0 && (
          <>
            <SectionHeader title="VAULT CONTRIBUTION" />
            <div className="flex flex-col gap-4">
              {profile.vaults.map((v: any) => (
                <div key={v.id} className="bg-[#111] border border-[#333] p-5 hover:border-[#6B6B6B] transition-colors">
                  <div className="flex justify-between items-center mb-3">
                    <div className="font-sans font-bold text-white">{v.rank <= 3 ? medals[v.rank - 1] : `#${v.rank}`} {v.name}</div>
                    <Link href={`/vaults/${v.id}`} className="font-mono text-[10px] text-[#6B6B6B] hover:text-[#00FF66] uppercase tracking-widest transition-colors flex items-center gap-1">
                      View Vault <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="flex items-center gap-4 font-mono text-xs text-[#6B6B6B] mb-3">
                    <span>Rank #{v.rank}</span>
                    <span>·</span>
                    <span>{v.signalShare}% of signals</span>
                    <span>·</span>
                    <span>Tracked {v.trackedDays}d</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#222] overflow-hidden">
                    <div className="h-full bg-[#00FF66]" style={{ width: `${v.signalShare}%` }} />
                  </div>
                  <div className="font-mono text-[9px] text-[#6B6B6B] mt-1">{v.signalShare}% of vault signals</div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <Toast message={toastMsg} visible={toastVis} />
    </div>
  );
}
