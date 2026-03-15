'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import ConnectButton from '@/components/ConnectButton';
import Navbar from '@/components/Navbar';
import MobileNav from '@/components/MobileNav';
import { useAccount } from 'wagmi';
import { usePublicVaults } from '@/hooks/usePublicData';
import { CONTRACTS } from '@/config/contracts';
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

// useCountUp removed — no fake animated stats

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

// --- VAULT DATA (from API) ---

interface VaultConfig {
  id: string;
  name: string;
  subtitle: string;
  status: 'live' | 'soon';
  mockApy: number;
  riskLevel: number;
  riskLabel: string;
  tracked: number;
  strategy: string;
  tags: string[];
  address: `0x${string}`;
}

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
  vault: VaultConfig & { tvl: number | null; isLoading: boolean; userShares: bigint | undefined };
  index: number;
  isConnected: boolean;
  showToast: (msg: string) => void;
}) => {
  const [ref, isVisible] = useScrollReveal({ delay: index * 150 });
  const isSoon = vault.status === 'soon';
  const hasPosition = isConnected && vault.userShares && vault.userShares > BigInt(0);

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
              <div className="font-sans font-bold text-2xl text-[#6B6B6B]">—</div>
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
            {isSoon ? '—' : vault.isLoading ? (
              <span className="inline-block w-16 h-4 bg-[#222] animate-pulse" />
            ) : vault.tvl !== null ? (
              vault.tvl >= 1000000 ? `$${(vault.tvl / 1000000).toFixed(2)}M` : `$${vault.tvl.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
            ) : '—'}
          </div>
        </div>
        <div>
          <div className="font-mono text-[9px] text-[#6B6B6B] uppercase tracking-widest mb-1">TRACKED</div>
          <div className="font-mono text-sm text-white">{vault.tracked > 0 ? `${vault.tracked} wallets` : '—'}</div>
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
      {hasPosition && (
        <div className="px-5 py-3 border-t border-[#00FF66]/20 bg-[#00FF66]/[0.02]">
          <div className="font-mono text-[9px] text-[#00FF66] uppercase tracking-widest mb-2">YOUR POSITION</div>
          <div className="font-mono text-sm text-white">Active</div>
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
        ) : (
          <Link href={`/vaults/${vault.id}`} className="w-full py-3 bg-[#00FF66] text-black font-mono font-bold text-xs uppercase tracking-wider hover:bg-white transition-colors flex items-center justify-center gap-2">
            {hasPosition ? 'Manage' : 'Deposit'} <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  );
};

// --- MAIN ---

export default function VaultsPage() {
  const { isConnected } = useAccount();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('APY');
  const [sortOpen, setSortOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(dropdownRef, () => setDropdownOpen(false));
  useOnClickOutside(sortRef, () => setSortOpen(false));


  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  }, []);

  // Fetch vaults from API
  const { data: apiVaults, isLoading: apiLoading } = usePublicVaults();

  // Build enriched vault list from API data
  const vaultsWithData = apiVaults.map(v => ({
    id: v.slug,
    name: v.name,
    subtitle: v.description || v.categories.join(' · ') || v.category,
    status: 'live' as const,
    mockApy: 0, // Will be calculated from real PnL later
    riskLevel: 2,
    riskLabel: 'Medium',
    tracked: typeof v.trackedWallets === 'number' ? v.trackedWallets : 0,
    strategy: v.description || `Copy-trades the top ${v.category} prediction market wallets.`,
    tags: v.categories.map((c: string) => c.toUpperCase()),
    address: (v.ethAddress || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    tvl: null as number | null,
    isLoading: false,
    userShares: undefined as bigint | undefined,
    chain: v.chain,
    openPositions: v.openPositions,
    closedTrades: v.closedTrades,
    totalPnl: v.totalPnl,
  }));

  // Compute total TVL for banner
  const totalTvl = 0; // Will come from on-chain reads later
  const anyLoading = apiLoading;

  // No fake countUp — show real or placeholder
  const tvlRef = useRef<HTMLSpanElement>(null);
  const vaultsRef = useRef<HTMLSpanElement>(null);
  const apyRef = useRef<HTMLSpanElement>(null);

  // Filtering & Sorting
  let filteredVaults = vaultsWithData;
  if (activeTab === 'my') {
    filteredVaults = vaultsWithData.filter(v => v.userShares && v.userShares > BigInt(0));
  } else if (activeTab === 'deprecated') {
    filteredVaults = [];
  }

  const sortedVaults = [...filteredVaults].sort((a, b) => {
    if (a.status === 'soon') return 1;
    if (b.status === 'soon') return -1;
    switch (sortBy) {
      case 'APY': return b.mockApy - a.mockApy;
      case 'TVL': return (b.tvl ?? 0) - (a.tvl ?? 0);
      case 'Risk': return b.riskLevel - a.riskLevel;
      case 'Newest': return 0;
      default: return 0;
    }
  });

  const myVaultsCount = vaultsWithData.filter(v => v.userShares && v.userShares > BigInt(0)).length;

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

      <Navbar />
      <MobileNav />

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-5xl mx-auto px-4 md:px-6 pt-24 pb-12 md:pb-24">
        {/* SECTION 1: PROTOCOL STATS BANNER */}
        <div className="w-full bg-[#111] border border-[#333] mb-8 md:mb-12 flex flex-col md:flex-row justify-center items-center py-4 px-6 md:gap-16 gap-4">
          <div className="text-[#6B6B6B] font-mono text-[10px] uppercase tracking-widest hidden md:block">
            PROTOCOL STATS
          </div>
          <div className="flex w-full md:w-auto justify-between md:justify-start gap-4 md:gap-12">
            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
              <span className="text-[#6B6B6B] font-mono text-[10px] uppercase tracking-widest">Total TVL:</span>
              <span ref={tvlRef} className="font-sans font-bold text-white text-lg md:text-base">
                {anyLoading ? '...' : totalTvl >= 1000000 ? `$${(totalTvl / 1000000).toFixed(2)}M` : totalTvl > 0 ? `$${totalTvl.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '$0'}
              </span>
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
              <span className="text-[#6B6B6B] font-mono text-[10px] uppercase tracking-widest">Active Vaults:</span>
              <span ref={vaultsRef} className="font-sans font-bold text-white text-lg md:text-base">{vaultsWithData.length}</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
              <span className="text-[#6B6B6B] font-mono text-[10px] uppercase tracking-widest">Avg APY:</span>
              <span ref={apyRef} className="font-sans font-bold text-[#6B6B6B] text-lg md:text-base">—</span>
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
