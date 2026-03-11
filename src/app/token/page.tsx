'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronDown, ExternalLink, Copy, Power, Activity, ArrowRight,
  LayoutDashboard, Layers, Trophy, Coins, Check, TrendingUp,
  Flame, AlertTriangle, X, ArrowUpRight, Zap, Shield, Star,
  Lock, Users, Vote, Gift, Crown, ChevronUp
} from 'lucide-react';
import { calculateLoyaltyRank } from '@/components/DepositModal';

// --- CUSTOM HOOKS ---

const useScrollReveal = (options: { threshold?: number; delay?: number } = { threshold: 0.1, delay: 0 }) => {
  const ref = useRef<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setTimeout(() => setIsVisible(true), options.delay || 0);
        observer.unobserve(entry.target);
      }
    }, { threshold: options.threshold, rootMargin: '0px' });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [options.delay, options.threshold]);
  return [ref, isVisible] as const;
};

const useCountUp = (end: number, duration = 2000, start = 0, decimals = 0, prefix = '', suffix = '') => {
  const [count, setCount] = useState(start);
  const [ref, isVisible] = useScrollReveal({ threshold: 0.5 });
  useEffect(() => {
    if (!isVisible) return;
    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const pct = Math.min(progress / duration, 1);
      const easeOut = 1 - Math.pow(1 - pct, 5);
      setCount(start + (end - start) * easeOut);
      if (pct < 1) requestAnimationFrame(animate);
      else setCount(end);
    };
    requestAnimationFrame(animate);
  }, [isVisible, end, duration, start]);
  const formatted = count.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return [ref, `${prefix}${formatted}${suffix}`] as const;
};

const useOnClickOutside = (ref: React.RefObject<any>, handler: (e: any) => void) => {
  useEffect(() => {
    const listener = (event: any) => {
      if (!ref.current || ref.current.contains(event.target)) return;
      handler(event);
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => { document.removeEventListener('mousedown', listener); document.removeEventListener('touchstart', listener); };
  }, [ref, handler]);
};

// --- TOAST ---

const Toast = ({ message, visible }: { message: string; visible: boolean }) => {
  if (!visible) return null;
  return (
    <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-fade-in-up">
      <div className="bg-[#111] border border-[#00FF66] px-4 py-2 font-mono text-xs text-[#00FF66] shadow-[0_0_20px_rgba(0,255,102,0.15)] flex items-center gap-2">
        <Check className="w-3 h-3" />{message}
      </div>
    </div>
  );
};

// --- SECTION HEADER ---

const SectionHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => {
  const [ref, isVisible] = useScrollReveal();
  return (
    <div ref={ref} className={`mb-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <h2 className="font-mono text-2xl md:text-3xl text-white flex items-center gap-2">
        <span className="text-[#00FF66]">&gt;</span> {title}
      </h2>
      <div className="h-[2px] w-16 bg-[#00FF66] mt-2 mb-1" />
      {subtitle && <p className="font-mono text-sm text-[#6B6B6B] mt-2">{subtitle}</p>}
    </div>
  );
};

// --- MOCK DATA ---

const GDN_PRICE = 0.842;
const TOKEN_DATA = {
  price: 0.842, priceChange24h: 5.2, marketCap: 84200000, marketCapRank: 247,
  volume24h: 3200000, volumeChange: 12, totalBurned: 1420000, burnPercent: 1.42,
  circulatingSupply: 98580000, totalSupply: 100000000,
  priceHigh: 1.12, priceLow: 0.34, priceAvg: 0.71,
};

// Price history mock (90 points)
const PRICE_HISTORY = (() => {
  const pts: { time: string; price: number }[] = [];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
  for (let i = 0; i < 90; i++) {
    const base = 0.34 + (0.842 - 0.34) * (i / 89);
    const noise = Math.sin(i * 0.3) * 0.12 + Math.sin(i * 0.7) * 0.08 + Math.cos(i * 0.15) * 0.15;
    const peak = i > 45 && i < 60 ? 0.2 * Math.sin((i - 45) / 15 * Math.PI) : 0;
    const price = Math.max(0.3, Math.min(1.15, base + noise + peak));
    const monthIdx = Math.floor(i / 18);
    const day = (i % 30) + 1;
    pts.push({ time: `${months[Math.min(monthIdx, 4)]} ${day}`, price: parseFloat(price.toFixed(3)) });
  }
  return pts;
})();

const BURN_LOG: { timestamp: string; display: string; amount: number; usd: number; source: string; tx: string }[] = [
  { timestamp: '2026-03-11T14:32:08Z', display: '2026-03-11 14:32:08', amount: 1420, usd: 1195.64, source: 'Alpha Vault perf fee', tx: '0xa7f2...3b91' },
  { timestamp: '2026-03-11T08:15:42Z', display: '2026-03-11 08:15:42', amount: 892, usd: 751.16, source: 'Deposit fees (batch)', tx: '0xb31c...8e44' },
  { timestamp: '2026-03-10T22:41:19Z', display: '2026-03-10 22:41:19', amount: 2100, usd: 1768.20, source: 'Degen Vault perf fee', tx: '0xc8d1...2f67' },
  { timestamp: '2026-03-10T16:08:55Z', display: '2026-03-10 16:08:55', amount: 1650, usd: 1389.30, source: 'Withdrawal fees (batch)', tx: '0xd4e9...aa12' },
  { timestamp: '2026-03-10T10:22:31Z', display: '2026-03-10 10:22:31', amount: 540, usd: 454.68, source: 'Deposit fees (batch)', tx: '0xe5f1...7c33' },
  { timestamp: '2026-03-09T19:44:17Z', display: '2026-03-09 19:44:17', amount: 3200, usd: 2694.40, source: 'Alpha Vault perf fee', tx: '0xf612...5d88' },
  { timestamp: '2026-03-09T15:11:03Z', display: '2026-03-09 15:11:03', amount: 780, usd: 656.76, source: 'Withdrawal fees (batch)', tx: '0x1a23...4e56' },
  { timestamp: '2026-03-09T09:33:48Z', display: '2026-03-09 09:33:48', amount: 1890, usd: 1591.38, source: 'Degen Vault perf fee', tx: '0x2b34...5f67' },
  { timestamp: '2026-03-08T23:18:22Z', display: '2026-03-08 23:18:22', amount: 420, usd: 353.64, source: 'Deposit fees (batch)', tx: '0x3c45...6a78' },
  { timestamp: '2026-03-08T17:45:09Z', display: '2026-03-08 17:45:09', amount: 2750, usd: 2315.50, source: 'Alpha Vault perf fee', tx: '0x4d56...7b89' },
  { timestamp: '2026-03-08T12:02:37Z', display: '2026-03-08 12:02:37', amount: 1100, usd: 926.20, source: 'Degen Vault perf fee', tx: '0x5e67...8c9a' },
  { timestamp: '2026-03-08T06:28:51Z', display: '2026-03-08 06:28:51', amount: 630, usd: 530.46, source: 'Withdrawal fees (batch)', tx: '0x6f78...9dab' },
  { timestamp: '2026-03-07T20:55:14Z', display: '2026-03-07 20:55:14', amount: 1950, usd: 1641.90, source: 'Alpha Vault perf fee', tx: '0x7089...aebc' },
  { timestamp: '2026-03-07T14:19:40Z', display: '2026-03-07 14:19:40', amount: 860, usd: 724.12, source: 'Deposit fees (batch)', tx: '0x819a...bfcd' },
  { timestamp: '2026-03-07T08:42:05Z', display: '2026-03-07 08:42:05', amount: 1340, usd: 1128.28, source: 'Degen Vault perf fee', tx: '0x92ab...c0de' },
];

const RANK_TIERS = [
  { rank: 'none', label: 'Unranked', emoji: '—', feeDeposit: 1.0, feeWithdraw: 0.50, minRatio: 0, minDeposit: 0 },
  { rank: 'bronze', label: 'Bronze', emoji: '🥉', feeDeposit: 0.75, feeWithdraw: 0.375, minRatio: 0.01, minDeposit: 0 },
  { rank: 'silver', label: 'Silver', emoji: '🥈', feeDeposit: 0.50, feeWithdraw: 0.25, minRatio: 0.05, minDeposit: 0 },
  { rank: 'gold', label: 'Gold', emoji: '🥇', feeDeposit: 0.25, feeWithdraw: 0.125, minRatio: 0.10, minDeposit: 0 },
  { rank: 'platinum', label: 'Platinum', emoji: '💎', feeDeposit: 0.10, feeWithdraw: 0.05, minRatio: 0.10, minDeposit: 500000 },
];

const PERKS_LIST = [
  { key: 'depositFee', label: 'Deposit fee' },
  { key: 'withdrawFee', label: 'Withdrawal fee' },
  { key: 'prioritySupport', label: 'Priority support' },
  { key: 'earlyAccess', label: 'Early vault access' },
  { key: 'governance', label: 'Governance voting' },
  { key: 'airdrop', label: 'Airdrop multiplier' },
  { key: 'privateChannel', label: 'Private channel' },
];

const RANK_PERKS: Record<string, Record<string, string | boolean>> = {
  none: { depositFee: '1.00%', withdrawFee: '0.50%', prioritySupport: false, earlyAccess: false, governance: false, airdrop: '1×', privateChannel: false },
  bronze: { depositFee: '0.75% (25% off)', withdrawFee: '0.375% (25% off)', prioritySupport: false, earlyAccess: false, governance: false, airdrop: '1.5×', privateChannel: false },
  silver: { depositFee: '0.50% (50% off)', withdrawFee: '0.25% (50% off)', prioritySupport: true, earlyAccess: false, governance: false, airdrop: '2×', privateChannel: false },
  gold: { depositFee: '0.25% (75% off)', withdrawFee: '0.125% (75% off)', prioritySupport: true, earlyAccess: true, governance: true, airdrop: '3×', privateChannel: false },
  platinum: { depositFee: '0.10% (90% off)', withdrawFee: '0.05% (90% off)', prioritySupport: true, earlyAccess: true, governance: true, airdrop: '5×', privateChannel: true },
};

// --- COMPONENTS ---

// Metric card
const MetricCard = ({ label, value, sub, index }: { label: string; value: string; sub: string; index: number }) => {
  const [ref, isVisible] = useScrollReveal({ delay: index * 100 });
  return (
    <div ref={ref} className={`bg-[#111] border border-[#222] p-4 transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="font-mono text-[10px] uppercase tracking-widest text-[#6B6B6B] mb-2">{label}</div>
      <div className="font-mono text-xl md:text-2xl text-white">{value}</div>
      <div className="font-mono text-xs text-[#6B6B6B] mt-1">{sub}</div>
    </div>
  );
};

// Price chart
const PriceChart = ({ data, period }: { data: { time: string; price: number }[]; period: string }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [drawn, setDrawn] = useState(false);
  const [ref, isVisible] = useScrollReveal();

  useEffect(() => { if (isVisible) setTimeout(() => setDrawn(true), 200); }, [isVisible]);

  const sliceMap: Record<string, number> = { '1H': 4, '1D': 10, '7D': 30, '30D': 60, 'ALL': 90 };
  const sliced = data.slice(-(sliceMap[period] || 90));
  const w = 800, h = 300, px = 40, py = 30;
  const prices = sliced.map(d => d.price);
  const min = Math.min(...prices) * 0.95;
  const max = Math.max(...prices) * 1.05;
  const xScale = (i: number) => px + (i / (sliced.length - 1)) * (w - px * 2);
  const yScale = (v: number) => py + (1 - (v - min) / (max - min)) * (h - py * 2);
  const line = sliced.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(d.price).toFixed(1)}`).join(' ');
  const area = line + ` L${xScale(sliced.length - 1).toFixed(1)},${(h - py).toFixed(1)} L${xScale(0).toFixed(1)},${(h - py).toFixed(1)} Z`;
  const totalLen = sliced.length * 12;

  const handleMouse = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * w;
    const idx = Math.round(((x - px) / (w - px * 2)) * (sliced.length - 1));
    if (idx >= 0 && idx < sliced.length) setHoveredIdx(idx);
  }, [sliced.length]);

  return (
    <div ref={ref}>
      <svg ref={svgRef} viewBox={`0 0 ${w} ${h}`} className="w-full" onMouseMove={handleMouse} onMouseLeave={() => setHoveredIdx(null)}>
        <defs>
          <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00FF66" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00FF66" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map(pct => {
          const y = py + pct * (h - py * 2);
          const val = max - pct * (max - min);
          return (
            <g key={pct}>
              <line x1={px} y1={y} x2={w - px} y2={y} stroke="#222" strokeDasharray="4 4" />
              <text x={px - 5} y={y + 4} fill="#6B6B6B" fontSize="10" fontFamily="monospace" textAnchor="end">${val.toFixed(2)}</text>
            </g>
          );
        })}
        {/* Area */}
        <path d={area} fill="url(#priceGrad)" className={`transition-opacity duration-1000 ${drawn ? 'opacity-100' : 'opacity-0'}`} />
        {/* Line */}
        <path d={line} fill="none" stroke="#00FF66" strokeWidth="2"
          strokeDasharray={totalLen} strokeDashoffset={drawn ? 0 : totalLen}
          style={{ transition: 'stroke-dashoffset 1.5s ease-out' }} />
        {/* Hover */}
        {hoveredIdx !== null && (
          <>
            <line x1={xScale(hoveredIdx)} y1={py} x2={xScale(hoveredIdx)} y2={h - py} stroke="#333" strokeDasharray="2 2" />
            <circle cx={xScale(hoveredIdx)} cy={yScale(sliced[hoveredIdx].price)} r={4} fill="#00FF66" />
            <rect x={xScale(hoveredIdx) - 50} y={yScale(sliced[hoveredIdx].price) - 30} width={100} height={24} fill="#111" stroke="#333" />
            <text x={xScale(hoveredIdx)} y={yScale(sliced[hoveredIdx].price) - 14} fill="white" fontSize="11" fontFamily="monospace" textAnchor="middle">
              ${sliced[hoveredIdx].price.toFixed(3)} · {sliced[hoveredIdx].time}
            </text>
          </>
        )}
      </svg>
    </div>
  );
};

// Flywheel node
const FlywheelNode = ({ icon, label, delay }: { icon: React.ReactNode; label: string; delay: number }) => {
  const [ref, isVisible] = useScrollReveal({ delay });
  return (
    <div ref={ref} className={`bg-[#111] border border-[#222] p-3 md:p-4 text-center transition-all duration-500 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
      <div className="text-[#00FF66] flex justify-center mb-2">{icon}</div>
      <div className="font-mono text-[10px] md:text-xs uppercase tracking-wider text-white">{label}</div>
    </div>
  );
};

// --- MAIN PAGE ---

export default function TokenPage() {
  const [isConnected, setIsConnected] = useState(true);
  const [walletOpen, setWalletOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [chartPeriod, setChartPeriod] = useState('ALL');
  const walletRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Staking state
  const [stakedAmount, setStakedAmount] = useState(772);
  const [walletBalance, setWalletBalance] = useState(1200);
  const totalDeposited = 12400;
  const [stakeInput, setStakeInput] = useState('');
  const [unstakeInput, setUnstakeInput] = useState('');
  const [stakingStep, setStakingStep] = useState<'idle' | 'approving' | 'staking' | 'unstaking' | 'done'>('idle');
  const [mobileStakeTab, setMobileStakeTab] = useState<'stake' | 'unstake'>('stake');

  useOnClickOutside(walletRef, () => setWalletOpen(false));
  useOnClickOutside(menuRef, () => setMobileMenuOpen(false));

  const showToast = (msg: string) => {
    setToast({ visible: true, message: msg });
    setTimeout(() => setToast({ visible: false, message: '' }), 3000);
  };

  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); showToast('Copied to clipboard'); };

  const currentRank = calculateLoyaltyRank(stakedAmount, totalDeposited);

  // Preview rank for stake/unstake
  const stakePreviewRank = stakeInput ? calculateLoyaltyRank(stakedAmount + parseFloat(stakeInput || '0'), totalDeposited) : null;
  const unstakePreviewRank = unstakeInput ? calculateLoyaltyRank(Math.max(0, stakedAmount - parseFloat(unstakeInput || '0')), totalDeposited) : null;
  const unstakeWarning = unstakePreviewRank && unstakePreviewRank.rank !== currentRank.rank;

  // Rank index for current highlight
  const currentRankIdx = RANK_TIERS.findIndex(r => r.rank === currentRank.rank);

  // Stake action
  const handleStake = async () => {
    const amt = parseFloat(stakeInput);
    if (!amt || amt <= 0 || amt > walletBalance) return;
    setStakingStep('approving');
    await new Promise(r => setTimeout(r, 2000));
    setStakingStep('staking');
    await new Promise(r => setTimeout(r, 2000));
    setStakedAmount(prev => prev + amt);
    setWalletBalance(prev => prev - amt);
    setStakeInput('');
    setStakingStep('done');
    showToast(`Staked ${amt.toFixed(0)} GDN successfully`);
    setTimeout(() => setStakingStep('idle'), 500);
  };

  const handleUnstake = async () => {
    const amt = parseFloat(unstakeInput);
    if (!amt || amt <= 0 || amt > stakedAmount) return;
    setStakingStep('unstaking');
    await new Promise(r => setTimeout(r, 2000));
    setStakedAmount(prev => prev - amt);
    setWalletBalance(prev => prev + amt);
    setUnstakeInput('');
    setStakingStep('done');
    showToast(`Unstaked ${amt.toFixed(0)} GDN successfully`);
    setTimeout(() => setStakingStep('idle'), 500);
  };

  const setStakePercent = (pct: number) => setStakeInput((walletBalance * pct).toFixed(0));
  const setUnstakePercent = (pct: number) => setUnstakeInput((stakedAmount * pct).toFixed(0));

  // Progress to next rank
  const nextRankTier = currentRankIdx < 4 ? RANK_TIERS[currentRankIdx + 1] : null;
  const currentRatio = totalDeposited > 0 ? (stakedAmount * GDN_PRICE) / totalDeposited : 0;
  const progressPct = nextRankTier ? Math.min(100, (currentRatio / nextRankTier.minRatio) * 100) : 100;
  const gdnNeeded = nextRankTier ? Math.max(0, Math.ceil(((nextRankTier.minRatio * totalDeposited) - (stakedAmount * GDN_PRICE)) / GDN_PRICE)) : 0;

  const navLinks = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Vaults', href: '/vaults' },
    { label: 'Leaderboard', href: '/leaderboard' },
    { label: '$GDN', href: '/token' },
  ];

  const bottomNavItems = [
    { label: 'Home', icon: <LayoutDashboard className="w-5 h-5" />, href: '/dashboard' },
    { label: 'Vaults', icon: <Layers className="w-5 h-5" />, href: '/vaults' },
    { label: 'Lead', icon: <Trophy className="w-5 h-5" />, href: '/leaderboard' },
    { label: '$GDN', icon: <Coins className="w-5 h-5" />, href: '/token' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Toast message={toast.message} visible={toast.visible} />

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-sm border-b border-[#222]">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/" className="font-mono font-bold text-lg text-white tracking-tight">GORDON<span className="text-[#00FF66]">.fi</span></a>
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(l => (
              <a key={l.href} href={l.href} className={`font-mono text-sm transition-colors ${l.href === '/token' ? 'text-[#00FF66]' : 'text-[#6B6B6B] hover:text-white'}`}>{l.label}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {isConnected ? (
              <div ref={walletRef} className="relative">
                <button onClick={() => setWalletOpen(!walletOpen)} className="flex items-center gap-2 bg-[#111] border border-[#333] px-3 py-1.5 font-mono text-xs text-white hover:border-[#00FF66] transition-colors">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#00FF66] to-[#0066FF]" />
                  0x71C...49A2
                  <ChevronDown className="w-3 h-3 text-[#6B6B6B]" />
                </button>
                {walletOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-[#111] border border-[#333] min-w-[180px] z-50">
                    <button onClick={() => { copyToClipboard('0x71C7a3d84900FF6649A2'); setWalletOpen(false); }} className="w-full text-left px-4 py-2 font-mono text-xs text-[#6B6B6B] hover:text-white hover:bg-[#1a1a1a] flex items-center gap-2"><Copy className="w-3 h-3" /> Copy address</button>
                    <a href="https://polygonscan.com" target="_blank" rel="noreferrer" className="block px-4 py-2 font-mono text-xs text-[#6B6B6B] hover:text-white hover:bg-[#1a1a1a] flex items-center gap-2"><ExternalLink className="w-3 h-3" /> Polygonscan</a>
                    <button onClick={() => { setIsConnected(false); setWalletOpen(false); }} className="w-full text-left px-4 py-2 font-mono text-xs text-[#FF3B3B] hover:bg-[#1a1a1a] flex items-center gap-2"><Power className="w-3 h-3" /> Disconnect</button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => setIsConnected(true)} className="bg-[#00FF66] text-black font-mono text-xs font-bold px-4 py-1.5 hover:bg-[#00DD55] transition-colors">Connect Wallet</button>
            )}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-[#6B6B6B]">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <div className="space-y-1"><div className="w-5 h-0.5 bg-current" /><div className="w-5 h-0.5 bg-current" /><div className="w-5 h-0.5 bg-current" /></div>}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div ref={menuRef} className="md:hidden bg-[#0A0A0A] border-t border-[#222] px-4 py-4 space-y-3">
            {navLinks.map(l => (
              <a key={l.href} href={l.href} className={`block font-mono text-sm ${l.href === '/token' ? 'text-[#00FF66]' : 'text-[#6B6B6B]'}`}>{l.label}</a>
            ))}
          </div>
        )}
      </nav>

      {/* CONTENT */}
      <main className="max-w-6xl mx-auto px-4 py-8 md:py-12 pb-24 md:pb-12">

        {/* 1. HEADER */}
        <SectionHeader title="$GDN TOKEN" subtitle="The deflationary engine behind Gordon.fi" />

        {/* 2. TOKEN METRICS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-12">
          <MetricCard index={0} label="PRICE" value={`$${TOKEN_DATA.price}`} sub={`+${TOKEN_DATA.priceChange24h}% 24h`} />
          <MetricCard index={1} label="MARKET CAP" value="$84.2M" sub={`#${TOKEN_DATA.marketCapRank} rank`} />
          <MetricCard index={2} label="24H VOLUME" value="$3.2M" sub={`+${TOKEN_DATA.volumeChange}% vs 7d avg`} />
          <MetricCard index={3} label="TOTAL BURNED" value="1,420,000 GDN" sub={`${TOKEN_DATA.burnPercent}% of supply`} />
          <MetricCard index={4} label="CIRCULATING" value="98,580,000" sub="98.58%" />
          <MetricCard index={5} label="TOTAL SUPPLY" value="100,000,000" sub="Fixed cap" />
        </div>

        {/* 3. PRICE CHART */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-mono text-lg text-white flex items-center gap-2"><span className="text-[#00FF66]">&gt;</span> PRICE CHART</h3>
            <div className="flex gap-1">
              {['1H', '1D', '7D', '30D', 'ALL'].map(p => (
                <button key={p} onClick={() => setChartPeriod(p)} className={`px-3 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${chartPeriod === p ? 'bg-[#00FF66] text-black' : 'bg-[#111] text-[#6B6B6B] border border-[#222] hover:text-white'}`}>{p}</button>
              ))}
            </div>
          </div>
          <div className="bg-[#111] border border-[#222] p-4">
            <PriceChart data={PRICE_HISTORY} period={chartPeriod} />
            <div className="flex gap-6 mt-4 font-mono text-xs text-[#6B6B6B]">
              <span>HIGH: <span className="text-[#00FF66]">${TOKEN_DATA.priceHigh}</span></span>
              <span>LOW: <span className="text-[#FF3B3B]">${TOKEN_DATA.priceLow}</span></span>
              <span>AVG: <span className="text-white">${TOKEN_DATA.priceAvg}</span></span>
            </div>
          </div>
        </div>

        {/* 4. BUYBACK & BURN LOG */}
        <div className="mb-12">
          <SectionHeader title="BUYBACK & BURN LOG" />
          <div className="bg-[#0A0A0A] border border-[#222] p-4 md:p-6 font-mono text-sm max-h-[500px] overflow-y-auto">
            <div className="text-[#00FF66] mb-4">gordon@fi:~$ tail -f buyback.log</div>
            <div className="space-y-4">
              {BURN_LOG.map((entry, i) => (
                <div key={i} className="border-b border-[#111] pb-3" style={{ animation: `slideInLeft 0.3s ease-out ${i * 50}ms both` }}>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-[#6B6B6B]">[{entry.display}]</span>
                    <span className="text-[#00FF66] font-bold">BUY</span>
                    <span className="text-white">{entry.amount.toLocaleString()} GDN</span>
                    <span className="text-[#6B6B6B]">(${entry.usd.toLocaleString()})</span>
                    <span className={`${i === 0 ? 'animate-pulse' : ''}`}>🔥</span>
                    <span className="text-orange-400 font-bold">BURN</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 pl-4 md:pl-0">
                    <span className="text-[#6B6B6B] text-xs">src: {entry.source}</span>
                    <a href={`https://polygonscan.com/tx/${entry.tx}`} target="_blank" rel="noreferrer" className="text-xs text-[#6B6B6B] hover:text-[#00FF66] flex items-center gap-1">
                      tx: {entry.tx} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-[#6B6B6B]">
              <span className="opacity-50">░</span> Waiting for next burn...
              <span className="animate-pulse ml-1">█</span>
            </div>
            <div className="mt-4 pt-3 border-t border-[#222] text-xs text-[#6B6B6B] space-y-1">
              <div>── STATS ──</div>
              <div>Total burned today: <span className="text-white">4,452 GDN</span> ($3,748)</div>
              <div>7-day burn rate: <span className="text-white">18,240 GDN/week</span></div>
              <div>Avg burn frequency: <span className="text-white">~4.2 hours</span></div>
            </div>
          </div>
        </div>

        {/* 5. FLYWHEEL DIAGRAM */}
        <div className="mb-12">
          <SectionHeader title="THE $GDN FLYWHEEL" />
          <div className="bg-[#111] border border-[#222] p-6 md:p-8">
            {/* Desktop: circular flow */}
            <div className="hidden md:grid grid-cols-3 gap-4 items-center mb-6">
              <FlywheelNode delay={0} icon={<TrendingUp className="w-6 h-6" />} label="Vault Profits" />
              <FlywheelNode delay={150} icon={<Coins className="w-6 h-6" />} label="20% Perf Fee" />
              <FlywheelNode delay={300} icon={<ArrowUpRight className="w-6 h-6" />} label="Market Buy GDN" />
            </div>
            {/* Arrows row */}
            <div className="hidden md:flex justify-around mb-6">
              {[0, 1, 2].map(i => (
                <div key={i} className="text-[#00FF66]">
                  <svg width="40" height="20" viewBox="0 0 40 20">
                    <line x1="0" y1="10" x2="30" y2="10" stroke="#00FF66" strokeWidth="2" strokeDasharray="4 3">
                      <animate attributeName="stroke-dashoffset" from="14" to="0" dur="1s" repeatCount="indefinite" />
                    </line>
                    <polygon points="30,5 40,10 30,15" fill="#00FF66" />
                  </svg>
                </div>
              ))}
            </div>
            <div className="hidden md:grid grid-cols-3 gap-4 items-center mb-6">
              <FlywheelNode delay={600} icon={<Users className="w-6 h-6" />} label="More Deposits" />
              <FlywheelNode delay={500} icon={<TrendingUp className="w-6 h-6" />} label="Higher Price" />
              <FlywheelNode delay={400} icon={<Flame className="w-6 h-6" />} label="Burn 🔥" />
            </div>

            {/* Mobile: vertical flow */}
            <div className="md:hidden space-y-2">
              {[
                { icon: <TrendingUp className="w-5 h-5" />, label: 'Vault Profits' },
                { icon: <Coins className="w-5 h-5" />, label: '20% Perf Fee' },
                { icon: <ArrowUpRight className="w-5 h-5" />, label: 'Market Buy GDN' },
                { icon: <Flame className="w-5 h-5" />, label: 'Burn 🔥' },
                { icon: <TrendingUp className="w-5 h-5" />, label: 'Higher Price' },
                { icon: <Users className="w-5 h-5" />, label: 'More Deposits' },
              ].map((n, i) => (
                <React.Fragment key={i}>
                  <FlywheelNode delay={i * 100} icon={n.icon} label={n.label} />
                  {i < 5 && (
                    <div className="flex justify-center text-[#00FF66]">
                      <svg width="20" height="24" viewBox="0 0 20 24"><line x1="10" y1="0" x2="10" y2="16" stroke="#00FF66" strokeWidth="2" strokeDasharray="4 3"><animate attributeName="stroke-dashoffset" from="14" to="0" dur="1s" repeatCount="indefinite" /></line><polygon points="5,16 10,24 15,16" fill="#00FF66" /></svg>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-[#222] font-mono text-xs text-[#6B6B6B] space-y-1">
              <div className="flex items-center gap-2"><span className="text-[#00FF66]">+</span> Deposit fees (1%) → buy & burn</div>
              <div className="flex items-center gap-2"><span className="text-[#00FF66]">+</span> Withdrawal fees (0.5%) → buy & burn</div>
              <div className="flex items-center gap-2"><span className="text-[#00FF66]">+</span> Performance fees (20%) → buy & burn</div>
            </div>
          </div>
        </div>

        {/* 6. STAKE $GDN */}
        <div className="mb-12">
          <SectionHeader title="STAKE $GDN" subtitle="Stake $GDN to unlock Loyalty Ranks and reduce platform fees." />

          {!isConnected ? (
            <div className="bg-[#111] border border-[#222] p-8 text-center">
              <div className="font-mono text-[#6B6B6B] mb-4">Connect your wallet to stake $GDN</div>
              <button onClick={() => setIsConnected(true)} className="bg-[#00FF66] text-black font-mono text-sm font-bold px-6 py-2 hover:bg-[#00DD55] transition-colors">Connect Wallet</button>
            </div>
          ) : (
            <>
              {/* 6a. Staking Position */}
              <div className="bg-[#111] border border-[#222] p-6 mb-4">
                <div className="font-mono text-[10px] uppercase tracking-widest text-[#6B6B6B] mb-4">YOUR STAKING POSITION</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-[#6B6B6B] mb-1">STAKED</div>
                    <div className="font-mono text-xl text-white">{stakedAmount.toLocaleString()} GDN</div>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-[#6B6B6B] mb-1">VALUE</div>
                    <div className="font-mono text-xl text-white">${(stakedAmount * GDN_PRICE).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-[#6B6B6B] mb-1">RANK</div>
                    <div className="font-mono text-xl text-white">{currentRank.emoji} {currentRank.label}</div>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-[#6B6B6B] mb-1">RATIO</div>
                    <div className="font-mono text-xl text-white">{(currentRatio * 100).toFixed(2)}%</div>
                  </div>
                </div>

                {/* Progress bar */}
                {nextRankTier ? (
                  <div>
                    <div className="flex items-center justify-between mb-2 font-mono text-xs">
                      <span className="text-[#6B6B6B]">Progress to {RANK_TIERS[currentRankIdx + 1].emoji} {RANK_TIERS[currentRankIdx + 1].label}</span>
                      <span className="text-white">{(nextRankTier.minRatio * 100).toFixed(0)}% ratio needed</span>
                    </div>
                    <div className="h-2 bg-[#222] w-full">
                      <div className="h-full bg-[#00FF66] transition-all duration-600 ease-out" style={{ width: `${progressPct}%` }} />
                    </div>
                    <div className="font-mono text-xs text-[#6B6B6B] mt-2">
                      Need <span className="text-white">{gdnNeeded.toLocaleString()} more GDN</span> (~${(gdnNeeded * GDN_PRICE).toFixed(0)}) to reach {RANK_TIERS[currentRankIdx + 1].label}
                    </div>
                  </div>
                ) : (
                  <div className="font-mono text-sm text-[#00FF66] flex items-center gap-2">
                    <Crown className="w-4 h-4" /> You&apos;ve reached the highest rank ✨
                  </div>
                )}
              </div>

              {/* 6b. Stake / Unstake */}
              {/* Mobile tabs */}
              <div className="flex md:hidden mb-0">
                <button onClick={() => setMobileStakeTab('stake')} className={`flex-1 py-2 font-mono text-xs uppercase tracking-wider text-center border ${mobileStakeTab === 'stake' ? 'bg-[#00FF66] text-black border-[#00FF66]' : 'bg-[#111] text-[#6B6B6B] border-[#222]'}`}>Stake</button>
                <button onClick={() => setMobileStakeTab('unstake')} className={`flex-1 py-2 font-mono text-xs uppercase tracking-wider text-center border ${mobileStakeTab === 'unstake' ? 'bg-[#111] text-white border-[#333]' : 'bg-[#111] text-[#6B6B6B] border-[#222]'}`}>Unstake</button>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                {/* Stake panel */}
                <div className={`bg-[#111] border border-[#222] p-6 ${mobileStakeTab !== 'stake' ? 'hidden md:block' : ''}`}>
                  <div className="font-mono text-sm text-white mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-[#00FF66]" /> STAKE $GDN</div>
                  <div className="mb-2 flex justify-between font-mono text-xs text-[#6B6B6B]">
                    <span>Amount</span>
                    <span>Balance: {walletBalance.toLocaleString()} GDN</span>
                  </div>
                  <input type="number" value={stakeInput} onChange={e => setStakeInput(e.target.value)} placeholder="0" className="w-full bg-[#0A0A0A] border border-[#333] px-4 py-3 font-mono text-white text-lg focus:border-[#00FF66] focus:outline-none mb-2" />
                  <div className="flex gap-2 mb-4">
                    {[0.25, 0.5, 0.75, 1].map(pct => (
                      <button key={pct} onClick={() => setStakePercent(pct)} className="flex-1 bg-[#0A0A0A] border border-[#333] py-1 font-mono text-[10px] text-[#6B6B6B] hover:text-white hover:border-[#00FF66] transition-colors">{pct === 1 ? 'MAX' : `${pct * 100}%`}</button>
                    ))}
                  </div>
                  {stakePreviewRank && stakeInput && (
                    <div className="mb-4 bg-[#0A0A0A] border border-[#222] p-3 font-mono text-xs">
                      <span className="text-[#6B6B6B]">New rank: </span>
                      <span className="text-white">{stakePreviewRank.emoji} {stakePreviewRank.label}</span>
                      <span className="text-[#6B6B6B]"> ({stakePreviewRank.feePercent}% deposit fee)</span>
                      {stakePreviewRank.rank !== currentRank.rank && (
                        <span className="text-[#00FF66] ml-2">↑ Rank up!</span>
                      )}
                    </div>
                  )}
                  <button onClick={handleStake} disabled={stakingStep !== 'idle' || !stakeInput || parseFloat(stakeInput) <= 0 || parseFloat(stakeInput) > walletBalance}
                    className="w-full bg-[#00FF66] text-black font-mono text-sm font-bold py-3 hover:bg-[#00DD55] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {stakingStep === 'approving' ? (<><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> Approving...</>) :
                     stakingStep === 'staking' ? (<><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> Staking...</>) :
                     'Stake $GDN'}
                  </button>
                </div>

                {/* Unstake panel */}
                <div className={`bg-[#111] border border-[#222] p-6 ${mobileStakeTab !== 'unstake' ? 'hidden md:block' : ''}`}>
                  <div className="font-mono text-sm text-white mb-4 flex items-center gap-2"><Lock className="w-4 h-4 text-[#6B6B6B]" /> UNSTAKE $GDN</div>
                  <div className="mb-2 flex justify-between font-mono text-xs text-[#6B6B6B]">
                    <span>Amount</span>
                    <span>Staked: {stakedAmount.toLocaleString()} GDN</span>
                  </div>
                  <input type="number" value={unstakeInput} onChange={e => setUnstakeInput(e.target.value)} placeholder="0" className="w-full bg-[#0A0A0A] border border-[#333] px-4 py-3 font-mono text-white text-lg focus:border-[#00FF66] focus:outline-none mb-2" />
                  <div className="flex gap-2 mb-4">
                    {[0.25, 0.5, 0.75, 1].map(pct => (
                      <button key={pct} onClick={() => setUnstakePercent(pct)} className="flex-1 bg-[#0A0A0A] border border-[#333] py-1 font-mono text-[10px] text-[#6B6B6B] hover:text-white hover:border-[#00FF66] transition-colors">{pct === 1 ? 'MAX' : `${pct * 100}%`}</button>
                    ))}
                  </div>
                  {unstakeWarning && unstakeInput && (
                    <div className="mb-4 bg-[#1a1500] border border-yellow-600/40 p-3 font-mono text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-yellow-400">Warning:</span>
                        <span className="text-[#6B6B6B]"> You&apos;ll drop to </span>
                        <span className="text-white">{unstakePreviewRank?.emoji} {unstakePreviewRank?.label}</span>
                        <span className="text-[#6B6B6B]"> ({unstakePreviewRank?.feePercent}% fees)</span>
                      </div>
                    </div>
                  )}
                  {unstakePreviewRank && unstakeInput && !unstakeWarning && (
                    <div className="mb-4 bg-[#0A0A0A] border border-[#222] p-3 font-mono text-xs">
                      <span className="text-[#6B6B6B]">New rank: </span>
                      <span className="text-white">{unstakePreviewRank.emoji} {unstakePreviewRank.label}</span>
                      <span className="text-[#6B6B6B]"> (no change)</span>
                    </div>
                  )}
                  <button onClick={handleUnstake} disabled={stakingStep !== 'idle' || !unstakeInput || parseFloat(unstakeInput) <= 0 || parseFloat(unstakeInput) > stakedAmount}
                    className="w-full bg-transparent border border-[#333] text-white font-mono text-sm font-bold py-3 hover:border-[#00FF66] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {stakingStep === 'unstaking' ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Unstaking...</>) : 'Unstake $GDN'}
                  </button>
                </div>
              </div>

              {/* 6c. Loyalty Ranks & Perks */}
              <div className="mb-4">
                <div className="font-mono text-lg text-white flex items-center gap-2 mb-4">
                  <span className="text-[#00FF66]">&gt;</span> LOYALTY RANKS & PERKS
                </div>
                <div className="space-y-3">
                  {RANK_TIERS.map((tier, idx) => {
                    const isCurrent = idx === currentRankIdx;
                    const isAchieved = idx < currentRankIdx;
                    const isLocked = idx > currentRankIdx;
                    const perks = RANK_PERKS[tier.rank];
                    return (
                      <div key={tier.rank} className={`bg-[#111] border p-4 md:p-5 transition-all ${isCurrent ? 'border-[#00FF66] shadow-[0_0_15px_rgba(0,255,102,0.1)]' : 'border-[#222]'} ${isLocked ? 'opacity-70' : ''}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{tier.emoji}</span>
                            <div>
                              <span className="font-mono text-sm text-white font-bold">{tier.label.toUpperCase()}</span>
                              <div className="font-mono text-[10px] text-[#6B6B6B]">
                                {tier.rank === 'none' ? 'No minimum' :
                                 tier.rank === 'platinum' ? `${(tier.minRatio * 100).toFixed(0)}% ratio + $500K deposits` :
                                 `Min stake: ${(tier.minRatio * 100).toFixed(0)}% of deposits`}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isCurrent && <span className="bg-[#00FF66] text-black font-mono text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">Current</span>}
                            {isAchieved && <Check className="w-4 h-4 text-[#00FF66]" />}
                            {isLocked && <Lock className="w-3 h-3 text-[#6B6B6B]" />}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                          {PERKS_LIST.map(perk => {
                            const val = perks[perk.key];
                            const isBool = typeof val === 'boolean';
                            return (
                              <div key={perk.key} className="flex items-center justify-between font-mono text-xs py-0.5">
                                <span className="text-[#6B6B6B]">{perk.label}</span>
                                {isBool ? (
                                  val ? <span className="text-[#00FF66]">✓</span> : <span className="text-[#333]">✗</span>
                                ) : (
                                  <span className="text-white">{val}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {isLocked && idx === currentRankIdx + 1 && (
                          <div className="mt-3 pt-3 border-t border-[#222] font-mono text-xs text-[#6B6B6B]">
                            Stake <span className="text-[#00FF66]">{gdnNeeded.toLocaleString()} more GDN</span> to unlock
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 7. TRADE $GDN */}
        <div className="mb-12">
          <SectionHeader title="TRADE $GDN" />
          <div className="bg-[#111] border border-[#222] p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
              <div className="flex-1">
                <div className="font-mono text-[10px] uppercase tracking-widest text-[#6B6B6B] mb-1">CONTRACT</div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-white">0xGDN...1234</span>
                  <button onClick={() => copyToClipboard('0xGDN00000000000000001234')} className="text-[#6B6B6B] hover:text-[#00FF66] transition-colors"><Copy className="w-3 h-3" /></button>
                </div>
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-[#6B6B6B] mb-1">NETWORK</div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  <span className="font-mono text-sm text-white">Polygon</span>
                </div>
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-[#6B6B6B] mb-1">DECIMALS</div>
                <span className="font-mono text-sm text-white">18</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="https://app.uniswap.org" target="_blank" rel="noreferrer" className="flex-1 bg-[#00FF66] text-black font-mono text-sm font-bold py-3 hover:bg-[#00DD55] transition-colors flex items-center justify-center gap-2">
                Buy on Uniswap <ExternalLink className="w-4 h-4" />
              </a>
              <button onClick={() => showToast('$GDN added to MetaMask')} className="flex-1 bg-transparent border border-[#333] text-white font-mono text-sm font-bold py-3 hover:border-[#00FF66] transition-colors flex items-center justify-center gap-2">
                Add to MetaMask
              </button>
            </div>
          </div>
        </div>

      </main>

      {/* MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-[#222] z-50">
        <div className="flex justify-around py-2">
          {bottomNavItems.map(item => (
            <a key={item.href} href={item.href} className={`flex flex-col items-center gap-0.5 px-3 py-1 ${item.href === '/token' ? 'text-[#00FF66]' : 'text-[#6B6B6B]'}`}>
              {item.icon}
              <span className="font-mono text-[9px] uppercase">{item.label}</span>
            </a>
          ))}
        </div>
      </nav>

      {/* Keyframe for burn log animation */}
      <style jsx global>{`
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translate(-50%, 10px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.3s ease-out; }
      `}</style>
    </div>
  );
}
