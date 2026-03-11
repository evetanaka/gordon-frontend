'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronDown, ExternalLink, Copy, Power, Activity, ArrowUpRight, ArrowRight,
  LayoutDashboard, Layers, Trophy, Coins, Check, Lock, Clock, TrendingUp,
  Shield, Zap, AlertTriangle, X
} from 'lucide-react';

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
      const percentage = Math.min(progress / duration, 1);
      const easeOut = 1 - Math.pow(1 - percentage, 5);
      const currentCount = start + (end - start) * easeOut;
      setCount(currentCount);
      if (percentage < 1) requestAnimationFrame(animate);
      else setCount(end);
    };
    requestAnimationFrame(animate);
  }, [isVisible, end, duration, start]);

  const formatted = count.toFixed(decimals).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
};

// --- TOAST ---

const Toast = ({ message, visible }: { message: string; visible: boolean }) => {
  if (!visible) return null;
  return (
    <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-fade-in-up">
      <div className="bg-[#111] border border-[#00FF66] px-4 py-2 font-mono text-xs text-[#00FF66] shadow-[0_0_20px_rgba(0,255,102,0.15)] flex items-center gap-2">
        <Check className="w-3 h-3" />
        {message}
      </div>
    </div>
  );
};

// --- VAULT DATA ---

interface VaultData {
  id: string;
  name: string;
  subtitle: string;
  status: 'live' | 'soon';
  apy: number;
  tvl: number;
  riskLevel: number;
  riskLabel: string;
  tracked: number;
  strategy: string;
  tags: string[];
  userDeposit: number;
  userPnl: number;
  change24h: number;
}

const vaultsData: VaultData[] = [
  {
    id: 'alpha',
    name: 'Alpha Vault',
    subtitle: 'Top 50 Traders · Diversified',
    status: 'live',
    apy: 47.2,
    tvl: 2400000,
    riskLevel: 2,
    riskLabel: 'Medium',
    tracked: 50,
    strategy: 'Copies the top 50 most profitable Polymarket traders. Diversified across political, crypto, and macro markets.',
    tags: ['DIVERSIFIED', 'AUTO-COMPOUND', 'BLUE CHIP'],
    userDeposit: 8000,
    userPnl: 1847,
    change24h: 2.4,
  },
  {
    id: 'degen',
    name: 'Degen Vault',
    subtitle: 'Top 5 Whales · High Conviction',
    status: 'live',
    apy: 89.1,
    tvl: 890000,
    riskLevel: 4,
    riskLabel: 'High',
    tracked: 5,
    strategy: 'Mirrors the top 5 highest-conviction whale wallets. Concentrated bets, higher risk/reward.',
    tags: ['HIGH RISK', 'WHALE TRACK', 'CONCENTRATED'],
    userDeposit: 4400,
    userPnl: 1000,
    change24h: -1.2,
  },
  {
    id: 'stable',
    name: 'Stable Vault',
    subtitle: 'Market Neutral · Low Volatility',
    status: 'soon',
    apy: 12.5,
    tvl: 0,
    riskLevel: 1,
    riskLabel: 'Low',
    tracked: 100,
    strategy: 'Delta-neutral strategies across prediction markets. Designed for capital preservation with steady yield.',
    tags: ['LOW RISK', 'DELTA NEUTRAL', 'STABLE'],
    userDeposit: 0,
    userPnl: 0,
    change24h: 0,
  },
  {
    id: 'momentum',
    name: 'Momentum Vault',
    subtitle: 'Trend Following · Multi-Market',
    status: 'soon',
    apy: 63.8,
    tvl: 0,
    riskLevel: 3,
    riskLabel: 'Medium-High',
    tracked: 20,
    strategy: 'Follows momentum signals from the top 20 trend-following wallets across all Polymarket categories.',
    tags: ['TREND', 'MULTI-MARKET', 'MOMENTUM'],
    userDeposit: 0,
    userPnl: 0,
    change24h: 0,
  },
];

// --- VAULT CARD ---

const RiskBar = ({ level }: { level: number }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map(i => (
      <div
        key={i}
        className={`h-1.5 w-3 ${
          i <= level
            ? level <= 2 ? 'bg-[#00FF66]' : level <= 3 ? 'bg-yellow-500' : 'bg-[#FF3B3B]'
            : 'bg-[#333]'
        }`}
      />
    ))}
  </div>
);

const VaultCardItem = ({ vault, index, isConnected, showToast }: {
  vault: VaultData;
  index: number;
  isConnected: boolean;
  showToast: (msg: string) => void;
}) => {
  const [ref, isVisible] = useScrollReveal({ delay: index * 150 });
  const isSoon = vault.status === 'soon';
  const hasPosition = vault.userDeposit > 0;

  return (
    <div
      ref={ref}
      className={`group relative bg-[#111] border transition-all duration-500 flex flex-col ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${isSoon
        ? 'border-[#333] opacity-70'
        : 'border-[#333] hover:border-[#00FF66]/50 hover:shadow-[0_0_30px_rgba(0,255,102,0.05)]'
      }`}
    >
      {/* Header */}
      <div className="p-5 pb-0">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-sans font-bold text-lg text-white">{vault.name}</h3>
              {isSoon ? (
                <span className="font-mono text-[10px] px-2 py-0.5 bg-[#333] text-[#6B6B6B] uppercase tracking-widest">SOON</span>
              ) : (
                <span className="font-mono text-[10px] px-2 py-0.5 bg-[#00FF66]/10 text-[#00FF66] uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-pulse" />
                  LIVE
                </span>
              )}
            </div>
            <div className="font-mono text-[10px] text-[#6B6B6B] uppercase tracking-widest">{vault.subtitle}</div>
          </div>
          {!isSoon && (
            <div className="text-right">
              <div className="font-sans font-bold text-2xl text-[#00FF66]">{vault.apy}%</div>
              <div className="font-mono text-[10px] text-[#6B6B6B] uppercase tracking-widest">APY</div>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {vault.tags.map(tag => (
            <span key={tag} className="font-mono text-[9px] px-2 py-0.5 border border-[#333] text-[#6B6B6B] uppercase tracking-widest">
              {tag}
            </span>
          ))}
        </div>

        {/* Strategy */}
        <p className="text-[#6B6B6B] text-xs leading-relaxed mb-4">{vault.strategy}</p>
      </div>

      {/* Stats Row */}
      <div className="px-5 py-3 border-t border-[#222] grid grid-cols-3 gap-4">
        <div>
          <div className="font-mono text-[9px] text-[#6B6B6B] uppercase tracking-widest mb-1">TVL</div>
          <div className="font-mono text-sm text-white">
            {isSoon ? '—' : `$${(vault.tvl / 1000000).toFixed(1)}M`}
          </div>
        </div>
        <div>
          <div className="font-mono text-[9px] text-[#6B6B6B] uppercase tracking-widest mb-1">TRACKED</div>
          <div className="font-mono text-sm text-white">{vault.tracked} wallets</div>
        </div>
        <div>
          <div className="font-mono text-[9px] text-[#6B6B6B] uppercase tracking-widest mb-1">RISK</div>
          <div className="flex items-center gap-2">
            <RiskBar level={vault.riskLevel} />
            <span className="font-mono text-[10px] text-[#6B6B6B]">{vault.riskLabel}</span>
          </div>
        </div>
      </div>

      {/* User Position (if connected & has deposit) */}
      {isConnected && hasPosition && (
        <div className="px-5 py-3 border-t border-[#00FF66]/20 bg-[#00FF66]/[0.02]">
          <div className="font-mono text-[9px] text-[#00FF66] uppercase tracking-widest mb-2">YOUR POSITION</div>
          <div className="flex justify-between items-center">
            <div>
              <span className="font-mono text-sm text-white">${vault.userDeposit.toLocaleString()}</span>
              <span className="font-mono text-[10px] text-[#6B6B6B] ml-2">deposited</span>
            </div>
            <div className={`font-mono text-sm ${vault.userPnl >= 0 ? 'text-[#00FF66]' : 'text-[#FF3B3B]'}`}>
              {vault.userPnl >= 0 ? '+' : ''}${vault.userPnl.toLocaleString()}
              <span className="text-[10px] ml-1">
                ({vault.userPnl >= 0 ? '+' : ''}{((vault.userPnl / vault.userDeposit) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="p-5 pt-4 mt-auto">
        {isSoon ? (
          <button
            onClick={() => showToast('Added to waitlist')}
            className="w-full py-3 border border-[#333] text-[#6B6B6B] font-mono text-xs uppercase tracking-widest hover:border-[#6B6B6B] hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <Clock className="w-3 h-3" /> Join Waitlist
          </button>
        ) : hasPosition ? (
          <div className="grid grid-cols-2 gap-3">
            <a href={`/vaults/${vault.id}`} className="py-3 bg-[#00FF66] text-black font-mono font-bold text-xs uppercase tracking-wider hover:bg-white transition-colors text-center">
              Deposit More
            </a>
            <a href={`/vaults/${vault.id}`} className="py-3 border border-[#333] text-white font-mono text-xs uppercase tracking-widest hover:border-[#00FF66] hover:text-[#00FF66] transition-colors text-center">
              Manage
            </a>
          </div>
        ) : (
          <a href={`/vaults/${vault.id}`} className="w-full py-3 bg-[#00FF66] text-black font-mono font-bold text-xs uppercase tracking-wider hover:bg-white transition-colors flex items-center justify-center gap-2">
            Deposit <ArrowRight className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
};

// --- MAIN ---

export default function VaultsPage() {
  const [isConnected, setIsConnected] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('APY');
  const [sortOpen, setSortOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(dropdownRef, () => setDropdownOpen(false));
  useOnClickOutside(sortRef, () => setSortOpen(false));

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  }, []);

  const [tvlRef, tvl] = useCountUp(3.29, 2000, 0, 2, '$', 'M');
  const [vaultsRef, activeVaults] = useCountUp(2, 1500, 0, 0);
  const [apyRef, avgApy] = useCountUp(68.2, 2000, 0, 1, '', '%');

  // Filtering & Sorting
  let filteredVaults = vaultsData;
  if (activeTab === 'my') {
    filteredVaults = vaultsData.filter(v => v.userDeposit > 0);
  } else if (activeTab === 'deprecated') {
    filteredVaults = [];
  }

  const sortedVaults = [...filteredVaults].sort((a, b) => {
    if (a.status === 'soon') return 1;
    if (b.status === 'soon') return -1;
    switch (sortBy) {
      case 'APY': return b.apy - a.apy;
      case 'TVL': return b.tvl - a.tvl;
      case 'Risk': return b.riskLevel - a.riskLevel;
      case 'Newest': return 0;
      default: return 0;
    }
  });

  const myVaultsCount = vaultsData.filter(v => v.userDeposit > 0).length;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-[#00FF66] selection:text-black pb-24 md:pb-12">
      {/* GLOBAL STYLES */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Space+Grotesk:wght@700&display=swap');
        .font-sans { font-family: 'Space Grotesk', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0A0A0A; }
        ::-webkit-scrollbar-thumb { background: #333; }
        ::-webkit-scrollbar-thumb:hover { background: #00FF66; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {/* --- TOP NAVBAR --- */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#333]' : 'bg-transparent border-b border-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <a href="/" className="font-mono font-bold text-xl tracking-tighter text-white cursor-pointer">
            GORDON<span className="text-[#00FF66]">.fi</span>
          </a>
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Vaults', href: '/vaults' },
              { label: 'Leaderboard', href: '/leaderboard' },
              { label: 'Stake', href: '/stake' },
              { label: '$GDN', href: '/token' },
            ].map(link => (
              <a key={link.label} href={link.href} className={`font-mono text-xs uppercase tracking-widest relative group transition-colors ${link.label === 'Vaults' ? 'text-white' : 'text-[#6B6B6B] hover:text-[#00FF66]'}`}>
                {link.label}
                <span className={`absolute -bottom-1 left-0 h-[1px] transition-all duration-300 ${link.label === 'Vaults' ? 'w-full bg-white' : 'w-0 bg-[#00FF66] group-hover:w-full'}`} />
              </a>
            ))}
          </div>
          <div>
            {isConnected ? (
              <div className="relative" ref={dropdownRef}>
                <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2 bg-[#111] border border-[#333] px-3 py-1.5 hover:border-[#00FF66] transition-colors group">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#00FF66] via-blue-500 to-purple-600 relative">
                    <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#00FF66] border border-[#111]" />
                  </div>
                  <span className="font-mono text-xs text-white hidden md:inline">0x71C...49A2</span>
                  <ChevronDown className="w-3 h-3 text-[#6B6B6B] group-hover:text-[#00FF66] transition-colors" />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#111] border border-[#333] shadow-[0_0_20px_rgba(0,0,0,0.5)] flex flex-col font-mono text-xs z-50 animate-fade-in-up" style={{animationDuration: '0.2s'}}>
                    <button className="flex items-center gap-2 px-4 py-3 text-[#6B6B6B] hover:text-white hover:bg-[#222] text-left transition-colors">
                      <Copy className="w-3 h-3" /> Copy Address
                    </button>
                    <button className="flex items-center justify-between px-4 py-3 text-[#6B6B6B] hover:text-white hover:bg-[#222] text-left border-t border-[#222] transition-colors">
                      <span className="flex items-center gap-2"><ExternalLink className="w-3 h-3" /> Etherscan</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                    <button className="flex items-center gap-2 px-4 py-3 text-[#6B6B6B] hover:text-white hover:bg-[#222] text-left border-t border-[#222] transition-colors">
                      <Activity className="w-3 h-3" /> Switch Network
                    </button>
                    <button onClick={() => { setIsConnected(false); setDropdownOpen(false); }} className="flex items-center gap-2 px-4 py-3 text-[#FF3B3B] hover:bg-[#FF3B3B]/10 text-left border-t border-[#222] transition-colors">
                      <Power className="w-3 h-3" /> Disconnect
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => setIsConnected(true)} className="bg-[#00FF66] text-black font-mono font-bold text-xs px-4 py-2 uppercase tracking-wider hover:bg-white transition-colors">
                Connect
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* --- MOBILE BOTTOM NAV --- */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#0A0A0A] border-t border-[#333] z-50 flex justify-around items-center h-16 pb-safe">
        <a href="/dashboard" className="flex flex-col items-center gap-1 text-[#6B6B6B]">
          <LayoutDashboard className="w-5 h-5" />
          <span className="font-mono text-[10px] tracking-widest uppercase">Dash</span>
        </a>
        <a href="/vaults" className="flex flex-col items-center gap-1 text-white">
          <Layers className="w-5 h-5" />
          <span className="font-mono text-[10px] tracking-widest uppercase">Vaults</span>
        </a>
        <a href="/stake" className="flex flex-col items-center gap-1 text-[#6B6B6B]">
          <Zap className="w-5 h-5" />
          <span className="font-mono text-[10px] tracking-widest uppercase">Stake</span>
        </a>
        <a href="/token" className="flex flex-col items-center gap-1 text-[#6B6B6B]">
          <Coins className="w-5 h-5" />
          <span className="font-mono text-[10px] tracking-widest uppercase">$GDN</span>
        </a>
      </div>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-4xl mx-auto px-4 md:px-6 pt-28 pb-12 md:pb-24">
        {/* SECTION 1: PROTOCOL STATS BANNER */}
        <div className="w-full bg-[#111] border border-[#333] mb-8 md:mb-12 flex flex-col md:flex-row justify-center items-center py-4 px-6 md:gap-16 gap-4">
          <div className="text-[#6B6B6B] font-mono text-[10px] uppercase tracking-widest hidden md:block">
            PROTOCOL STATS
          </div>
          <div className="flex w-full md:w-auto justify-between md:justify-start gap-4 md:gap-12">
            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
              <span className="text-[#6B6B6B] font-mono text-[10px] uppercase tracking-widest">Total TVL:</span>
              <span ref={tvlRef} className="font-sans font-bold text-white text-lg md:text-base">{tvl}</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
              <span className="text-[#6B6B6B] font-mono text-[10px] uppercase tracking-widest">Active Vaults:</span>
              <span ref={vaultsRef} className="font-sans font-bold text-white text-lg md:text-base">{activeVaults}</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
              <span className="text-[#6B6B6B] font-mono text-[10px] uppercase tracking-widest">Avg APY:</span>
              <span ref={apyRef} className="font-sans font-bold text-[#00FF66] text-lg md:text-base">{avgApy}</span>
            </div>
          </div>
        </div>

        {/* SECTION 2: FILTERS & SORT */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          {/* Tabs */}
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar pb-2 md:pb-0">
            {[
              { id: 'all', label: 'All Vaults' },
              { id: 'my', label: `My Vaults${myVaultsCount > 0 ? ` (${myVaultsCount})` : ''}` },
              { id: 'deprecated', label: 'Deprecated' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 font-mono text-xs uppercase tracking-widest whitespace-nowrap transition-colors border border-transparent ${
                  activeTab === tab.id
                    ? 'bg-[#333] text-white border-[#444]'
                    : 'text-[#6B6B6B] hover:text-white bg-[#111] border-[#333]'
                }`}
              >
                [{tab.label}]
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="relative w-full md:w-auto" ref={sortRef}>
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="w-full md:w-auto flex items-center justify-between gap-4 bg-[#111] border border-[#333] px-4 py-2 hover:border-[#6B6B6B] transition-colors group"
            >
              <span className="font-mono text-xs text-[#6B6B6B] uppercase tracking-widest flex items-center gap-2">
                Sort: <span className="text-white">{sortBy}</span>
              </span>
              <ChevronDown className="w-4 h-4 text-[#6B6B6B] group-hover:text-white transition-colors" />
            </button>
            {sortOpen && (
              <div className="absolute right-0 mt-2 w-full md:w-48 bg-[#111] border border-[#333] shadow-[0_0_20px_rgba(0,0,0,0.5)] flex flex-col font-mono text-xs z-40 animate-fade-in-up" style={{animationDuration: '0.2s'}}>
                {['APY', 'TVL', 'Risk', 'Newest'].map(option => (
                  <button
                    key={option}
                    onClick={() => { setSortBy(option); setSortOpen(false); }}
                    className={`px-4 py-3 text-left transition-colors uppercase tracking-widest ${
                      sortBy === option ? 'text-[#00FF66] bg-[#222]' : 'text-[#6B6B6B] hover:text-white hover:bg-[#222]'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: VAULT CARDS GRID */}
        {sortedVaults.length === 0 ? (
          <div className="w-full border border-[#333] bg-[#111] py-20 text-center flex flex-col items-center">
            <Layers className="w-8 h-8 text-[#333] mb-4" />
            <div className="text-[#6B6B6B] font-mono text-xs uppercase tracking-widest mb-2">No Vaults Found</div>
            <p className="text-[#E0E0E0] text-sm max-w-xs">
              {activeTab === 'deprecated'
                ? "We haven't deprecated any vaults yet. Keep tracking alpha."
                : "You don't have any active positions in our vaults."}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {sortedVaults.map((vault, i) => (
              <VaultCardItem
                key={vault.id}
                vault={vault}
                index={i}
                isConnected={isConnected}
                showToast={showToast}
              />
            ))}
          </div>
        )}
      </main>

      <Toast message={toastMessage} visible={toastVisible} />
    </div>
  );
}
