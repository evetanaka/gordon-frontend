'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  ChevronDown, ExternalLink, Copy, Power, Check, X,
  LayoutDashboard, Layers, Trophy, Coins, Lock, Zap,
  AlertTriangle, Crown, ArrowRight, Shield, Star, Gift,
  Users, Vote, TrendingUp, ChevronUp, Flame, Award
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

// --- CONSTANTS ---

const GDN_PRICE = 0.842;

const RANK_TIERS = [
  { rank: 'none', label: 'Unranked', emoji: '—', feeDeposit: 1.0, feeWithdraw: 0.50, minRatio: 0, minDeposit: 0, color: '#6B6B6B' },
  { rank: 'bronze', label: 'Bronze', emoji: '🥉', feeDeposit: 0.75, feeWithdraw: 0.375, minRatio: 0.01, minDeposit: 0, color: '#CD7F32' },
  { rank: 'silver', label: 'Silver', emoji: '🥈', feeDeposit: 0.50, feeWithdraw: 0.25, minRatio: 0.05, minDeposit: 0, color: '#C0C0C0' },
  { rank: 'gold', label: 'Gold', emoji: '🥇', feeDeposit: 0.25, feeWithdraw: 0.125, minRatio: 0.10, minDeposit: 0, color: '#FFD700' },
  { rank: 'platinum', label: 'Platinum', emoji: '💎', feeDeposit: 0.10, feeWithdraw: 0.05, minRatio: 0.10, minDeposit: 500000, color: '#00FF66' },
];

interface Perk {
  label: string;
  icon: React.ReactNode;
  values: (string | boolean)[];
}

const PERKS_TABLE: Perk[] = [
  { label: 'Deposit fee', icon: <ArrowRight className="w-3.5 h-3.5" />, values: ['1.00%', '0.75%', '0.50%', '0.25%', '0.10%'] },
  { label: 'Withdrawal fee', icon: <ArrowRight className="w-3.5 h-3.5 rotate-180" />, values: ['0.50%', '0.375%', '0.25%', '0.125%', '0.05%'] },
  { label: 'Fee discount', icon: <Gift className="w-3.5 h-3.5" />, values: ['—', '25%', '50%', '75%', '90%'] },
  { label: 'Priority support', icon: <Shield className="w-3.5 h-3.5" />, values: [false, false, true, true, true] },
  { label: 'Early vault access', icon: <Lock className="w-3.5 h-3.5" />, values: [false, false, false, true, true] },
  { label: 'Governance voting', icon: <Vote className="w-3.5 h-3.5" />, values: [false, false, false, true, true] },
  { label: 'Airdrop multiplier', icon: <Star className="w-3.5 h-3.5" />, values: ['1×', '1.5×', '2×', '3×', '5×'] },
  { label: 'Private channel', icon: <Users className="w-3.5 h-3.5" />, values: [false, false, false, false, true] },
  { label: 'Governance weight', icon: <Crown className="w-3.5 h-3.5" />, values: ['—', '—', '—', '1×', '2×'] },
];

// --- NAV LINKS ---

const navLinks = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Vaults', href: '/vaults' },
  { label: 'Leaderboard', href: '/leaderboard' },
  { label: 'Stake', href: '/stake' },
  { label: '$GDN', href: '/token' },
];

const bottomNavItems = [
  { label: 'Home', icon: <LayoutDashboard className="w-5 h-5" />, href: '/dashboard' },
  { label: 'Vaults', icon: <Layers className="w-5 h-5" />, href: '/vaults' },
  { label: 'Stake', icon: <Zap className="w-5 h-5" />, href: '/stake' },
  { label: '$GDN', icon: <Coins className="w-5 h-5" />, href: '/token' },
];

// --- HOW IT WORKS CARD ---

const HowItWorksCard = ({ delay, step, title, desc, icon }: { delay: number; step: string; title: string; desc: string; icon: React.ReactNode }) => {
  const [ref, isVisible] = useScrollReveal({ delay });
  return (
    <div ref={ref} className={`bg-[#111] border border-[#222] p-6 transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="font-mono text-[10px] text-[#00FF66] uppercase tracking-widest">{step}</div>
        <div className="text-[#00FF66]">{icon}</div>
      </div>
      <h3 className="font-mono text-sm text-white font-bold mb-2">{title}</h3>
      <p className="font-mono text-xs text-[#6B6B6B] leading-relaxed">{desc}</p>
    </div>
  );
};

// --- MAIN PAGE ---

export default function StakePage() {
  const [isConnected, setIsConnected] = useState(true);
  const [walletOpen, setWalletOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '' });
  const walletRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Staking state
  const [stakedAmount, setStakedAmount] = useState(772);
  const [walletBalance, setWalletBalance] = useState(1200);
  const totalDeposited = 12400;
  const [stakeInput, setStakeInput] = useState('');
  const [unstakeInput, setUnstakeInput] = useState('');
  const [stakingStep, setStakingStep] = useState<'idle' | 'approving' | 'staking' | 'unstaking' | 'done'>('idle');
  const [activeTab, setActiveTab] = useState<'stake' | 'unstake'>('stake');

  useOnClickOutside(walletRef, () => setWalletOpen(false));
  useOnClickOutside(menuRef, () => setMobileMenuOpen(false));
  useEffect(() => { const h = () => setScrolled(window.scrollY > 20); window.addEventListener("scroll", h); return () => window.removeEventListener("scroll", h); }, []);

  const showToast = (msg: string) => {
    setToast({ visible: true, message: msg });
    setTimeout(() => setToast({ visible: false, message: '' }), 3000);
  };

  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); showToast('Copied to clipboard'); };

  const currentRank = calculateLoyaltyRank(stakedAmount, totalDeposited);
  const currentRankIdx = RANK_TIERS.findIndex(r => r.rank === currentRank.rank);
  const currentRatio = totalDeposited > 0 ? (stakedAmount * GDN_PRICE) / totalDeposited : 0;

  // Preview ranks
  const stakePreview = stakeInput && parseFloat(stakeInput) > 0
    ? calculateLoyaltyRank(stakedAmount + parseFloat(stakeInput), totalDeposited) : null;
  const unstakePreview = unstakeInput && parseFloat(unstakeInput) > 0
    ? calculateLoyaltyRank(Math.max(0, stakedAmount - parseFloat(unstakeInput)), totalDeposited) : null;

  const unstakeWarning = unstakePreview && unstakePreview.rank !== currentRank.rank;

  // Progress to next rank
  const nextRankTier = currentRankIdx < 4 ? RANK_TIERS[currentRankIdx + 1] : null;
  const progressPct = nextRankTier ? Math.min(100, (currentRatio / nextRankTier.minRatio) * 100) : 100;
  const gdnNeeded = nextRankTier ? Math.max(0, Math.ceil(((nextRankTier.minRatio * totalDeposited) - (stakedAmount * GDN_PRICE)) / GDN_PRICE)) : 0;

  // Count-up stats
  const [tvlRef, tvlVal] = useCountUp(2.4, 2000, 0, 2, '$', 'M');
  const [stakersRef, stakersVal] = useCountUp(1847, 1800, 0, 0);
  const [avgStakeRef, avgStakeVal] = useCountUp(1298, 2000, 0, 0, '', ' GDN');
  const [burnRef, burnVal] = useCountUp(1.42, 2000, 0, 2, '', 'M');

  // Actions
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

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Toast message={toast.message} visible={toast.visible} />

      {/* NAVBAR */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#333]' : 'bg-transparent border-b border-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-mono font-bold text-xl tracking-tighter text-white">GORDON<span className="text-[#00FF66]">.fi</span></Link>
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href} className={`font-mono text-xs uppercase tracking-widest transition-colors ${l.href === '/stake' ? 'text-[#00FF66]' : 'text-[#6B6B6B] hover:text-white'}`}>{l.label}</Link>
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
              <button onClick={() => setIsConnected(true)} className="bg-[#00FF66] text-black font-mono font-bold text-xs px-4 py-2 uppercase tracking-wider hover:bg-white transition-colors">Connect</button>
            )}
          </div>
        </div>
      </nav>

      {/* CONTENT */}
      <main className="max-w-5xl mx-auto px-4 md:px-6 pt-24 pb-12 md:pb-24">

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-[#6B6B6B] font-mono text-xs uppercase tracking-widest flex items-center gap-2">
            <span className="text-[#00FF66]">&gt;</span> STAKE $GDN
          </h1>
          <div className="w-full h-[1px] bg-[#333] mt-2 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1/4 h-full bg-[#00FF66] opacity-20 animate-glitch-h" />
          </div>
          <p className="font-mono text-xs text-[#6B6B6B] mt-3 max-w-xl">
            Stake $GDN to climb Loyalty Ranks, reduce platform fees, and unlock exclusive perks. No lockup period — unstake anytime.
          </p>
        </div>

        {/* PROTOCOL STATS BANNER */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {[
            { ref: tvlRef, label: 'TOTAL STAKED', value: tvlVal },
            { ref: stakersRef, label: 'STAKERS', value: stakersVal },
            { ref: avgStakeRef, label: 'AVG STAKE', value: avgStakeVal },
            { ref: burnRef, label: 'TOTAL BURNED', value: burnVal + ' GDN' },
          ].map((s, i) => (
            <div key={i} ref={s.ref} className="bg-[#111] border border-[#222] p-4">
              <div className="font-mono text-[10px] uppercase tracking-widest text-[#6B6B6B] mb-2">{s.label}</div>
              <div className="font-mono text-lg md:text-xl text-white">{s.value}</div>
            </div>
          ))}
        </div>

        {!isConnected ? (
          /* NOT CONNECTED */
          <div className="bg-[#111] border border-[#222] p-12 text-center">
            <Zap className="w-10 h-10 text-[#00FF66] mx-auto mb-4" />
            <h3 className="font-mono text-lg text-white mb-2">Connect Wallet to Stake</h3>
            <p className="font-mono text-sm text-[#6B6B6B] mb-6 max-w-md mx-auto">Stake your $GDN tokens to reduce fees and unlock exclusive perks across the Gordon.fi protocol.</p>
            <button onClick={() => setIsConnected(true)} className="bg-[#00FF66] text-black font-mono text-sm font-bold px-8 py-3 hover:bg-[#00DD55] transition-colors">Connect Wallet</button>
          </div>
        ) : (
          <>
            {/* TWO-COLUMN: Position + Stake/Unstake */}
            <div className="grid lg:grid-cols-5 gap-4 mb-10">

              {/* LEFT: Staking Position (3 cols) */}
              <div className="lg:col-span-3 bg-[#111] border border-[#222]">
                {/* Current rank hero */}
                <div className="p-6 border-b border-[#222]">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 flex items-center justify-center text-4xl" style={{
                        background: `linear-gradient(135deg, ${RANK_TIERS[currentRankIdx].color}22, ${RANK_TIERS[currentRankIdx].color}08)`,
                        border: `1px solid ${RANK_TIERS[currentRankIdx].color}44`,
                      }}>
                        {currentRank.emoji}
                      </div>
                      <div>
                        <div className="font-mono text-[10px] uppercase tracking-widest text-[#6B6B6B] mb-1">YOUR RANK</div>
                        <div className="font-mono text-xl text-white font-bold">{currentRank.label}</div>
                        <div className="font-mono text-xs text-[#6B6B6B]">{currentRank.feePercent}% deposit fee</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-[10px] uppercase tracking-widest text-[#6B6B6B] mb-1">STAKE RATIO</div>
                      <div className="font-mono text-2xl text-[#00FF66]">{(currentRatio * 100).toFixed(2)}%</div>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="font-mono text-[9px] uppercase tracking-widest text-[#6B6B6B] mb-1">STAKED</div>
                      <div className="font-mono text-sm text-white">{stakedAmount.toLocaleString()} GDN</div>
                    </div>
                    <div>
                      <div className="font-mono text-[9px] uppercase tracking-widest text-[#6B6B6B] mb-1">VALUE</div>
                      <div className="font-mono text-sm text-white">${(stakedAmount * GDN_PRICE).toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="font-mono text-[9px] uppercase tracking-widest text-[#6B6B6B] mb-1">WALLET</div>
                      <div className="font-mono text-sm text-white">{walletBalance.toLocaleString()} GDN</div>
                    </div>
                    <div>
                      <div className="font-mono text-[9px] uppercase tracking-widest text-[#6B6B6B] mb-1">TOTAL DEPOSITS</div>
                      <div className="font-mono text-sm text-white">${totalDeposited.toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                {/* Progress to next rank */}
                <div className="p-6">
                  {nextRankTier ? (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-mono text-xs text-[#6B6B6B] flex items-center gap-2">
                          <span className="text-lg">{RANK_TIERS[currentRankIdx].emoji}</span>
                          <span>{RANK_TIERS[currentRankIdx].label}</span>
                        </div>
                        <div className="font-mono text-xs text-[#6B6B6B] flex items-center gap-2">
                          <span>{nextRankTier.label}</span>
                          <span className="text-lg">{nextRankTier.emoji}</span>
                        </div>
                      </div>
                      <div className="h-3 bg-[#222] w-full mb-3 relative overflow-hidden">
                        <div className="h-full transition-all duration-700 ease-out" style={{
                          width: `${progressPct}%`,
                          background: `linear-gradient(90deg, ${RANK_TIERS[currentRankIdx].color}, ${nextRankTier.color})`,
                        }} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="font-mono text-xs text-[#6B6B6B]">
                          {(currentRatio * 100).toFixed(2)}% ratio
                        </div>
                        <div className="font-mono text-xs text-[#6B6B6B]">
                          {(nextRankTier.minRatio * 100).toFixed(0)}% needed
                        </div>
                      </div>
                      <div className="mt-3 font-mono text-xs">
                        <span className="text-[#6B6B6B]">Need </span>
                        <span className="text-[#00FF66] font-bold">{gdnNeeded.toLocaleString()} GDN</span>
                        <span className="text-[#6B6B6B]"> (~${(gdnNeeded * GDN_PRICE).toFixed(0)}) to reach {nextRankTier.label}</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <Crown className="w-8 h-8 text-[#00FF66] mx-auto mb-2" />
                      <div className="font-mono text-sm text-[#00FF66]">Maximum rank achieved ✨</div>
                      <div className="font-mono text-xs text-[#6B6B6B] mt-1">You enjoy the lowest fees on the protocol</div>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT: Stake/Unstake (2 cols) */}
              <div className="lg:col-span-2 bg-[#111] border border-[#222]">
                {/* Tabs */}
                <div className="flex border-b border-[#222]">
                  <button onClick={() => setActiveTab('stake')} className={`flex-1 py-3.5 font-mono text-xs uppercase tracking-widest text-center transition-colors flex items-center justify-center gap-2 ${activeTab === 'stake' ? 'text-[#00FF66] border-b-2 border-[#00FF66] bg-[#00FF66]/5' : 'text-[#6B6B6B] hover:text-white'}`}>
                    <Zap className="w-3.5 h-3.5" /> Stake
                  </button>
                  <button onClick={() => setActiveTab('unstake')} className={`flex-1 py-3.5 font-mono text-xs uppercase tracking-widest text-center transition-colors flex items-center justify-center gap-2 ${activeTab === 'unstake' ? 'text-white border-b-2 border-white bg-white/5' : 'text-[#6B6B6B] hover:text-white'}`}>
                    <Lock className="w-3.5 h-3.5" /> Unstake
                  </button>
                </div>

                <div className="p-6">
                  {activeTab === 'stake' ? (
                    <>
                      {/* Balance */}
                      <div className="flex justify-between mb-2">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-[#6B6B6B]">Amount</span>
                        <span className="font-mono text-xs text-[#6B6B6B]">Balance: <span className="text-white">{walletBalance.toLocaleString()}</span> GDN</span>
                      </div>

                      {/* Input */}
                      <div className="relative mb-3">
                        <input type="number" value={stakeInput} onChange={e => setStakeInput(e.target.value)} placeholder="0.00"
                          className="w-full bg-[#0A0A0A] border border-[#333] px-4 py-4 pr-16 font-mono text-xl text-white focus:border-[#00FF66] focus:outline-none transition-colors" />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-sm text-[#6B6B6B]">GDN</span>
                      </div>

                      {/* Quick % */}
                      <div className="grid grid-cols-4 gap-2 mb-5">
                        {[{ pct: 0.25, label: '25%' }, { pct: 0.5, label: '50%' }, { pct: 0.75, label: '75%' }, { pct: 1, label: 'MAX' }].map(b => (
                          <button key={b.label} onClick={() => setStakePercent(b.pct)} className="bg-[#0A0A0A] border border-[#333] py-2 font-mono text-[10px] text-[#6B6B6B] hover:text-[#00FF66] hover:border-[#00FF66]/50 transition-colors uppercase tracking-wider">{b.label}</button>
                        ))}
                      </div>

                      {/* Preview */}
                      {stakePreview && stakeInput && parseFloat(stakeInput) > 0 && (
                        <div className="mb-5 space-y-2">
                          <div className="bg-[#0A0A0A] border border-[#222] p-3">
                            <div className="flex items-center justify-between font-mono text-xs">
                              <span className="text-[#6B6B6B]">New rank</span>
                              <span className="text-white flex items-center gap-2">
                                {stakePreview.emoji} {stakePreview.label}
                                {stakePreview.rank !== currentRank.rank && <span className="text-[#00FF66] text-[10px] px-1.5 py-0.5 bg-[#00FF66]/10">↑ RANK UP</span>}
                              </span>
                            </div>
                          </div>
                          <div className="bg-[#0A0A0A] border border-[#222] p-3">
                            <div className="flex items-center justify-between font-mono text-xs">
                              <span className="text-[#6B6B6B]">Deposit fee</span>
                              <span className="text-white">{stakePreview.feePercent}%</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* CTA */}
                      <button onClick={handleStake} disabled={stakingStep !== 'idle' || !stakeInput || parseFloat(stakeInput) <= 0 || parseFloat(stakeInput) > walletBalance}
                        className="w-full bg-[#00FF66] text-black font-mono text-sm font-bold py-4 hover:bg-[#00DD55] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        {stakingStep === 'approving' ? (<><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> Approving...</>) :
                         stakingStep === 'staking' ? (<><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> Staking...</>) :
                         (<><Zap className="w-4 h-4" /> Stake $GDN</>)}
                      </button>

                      <div className="mt-3 font-mono text-[10px] text-[#6B6B6B] text-center">
                        2-step transaction: Approve → Stake · No lockup period
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Staked balance */}
                      <div className="flex justify-between mb-2">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-[#6B6B6B]">Amount</span>
                        <span className="font-mono text-xs text-[#6B6B6B]">Staked: <span className="text-white">{stakedAmount.toLocaleString()}</span> GDN</span>
                      </div>

                      {/* Input */}
                      <div className="relative mb-3">
                        <input type="number" value={unstakeInput} onChange={e => setUnstakeInput(e.target.value)} placeholder="0.00"
                          className="w-full bg-[#0A0A0A] border border-[#333] px-4 py-4 pr-16 font-mono text-xl text-white focus:border-[#00FF66] focus:outline-none transition-colors" />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-sm text-[#6B6B6B]">GDN</span>
                      </div>

                      {/* Quick % */}
                      <div className="grid grid-cols-4 gap-2 mb-5">
                        {[{ pct: 0.25, label: '25%' }, { pct: 0.5, label: '50%' }, { pct: 0.75, label: '75%' }, { pct: 1, label: 'MAX' }].map(b => (
                          <button key={b.label} onClick={() => setUnstakePercent(b.pct)} className="bg-[#0A0A0A] border border-[#333] py-2 font-mono text-[10px] text-[#6B6B6B] hover:text-white hover:border-[#333] transition-colors uppercase tracking-wider">{b.label}</button>
                        ))}
                      </div>

                      {/* Warning */}
                      {unstakeWarning && unstakeInput && (
                        <div className="mb-4 bg-[#1a1500] border border-yellow-600/30 p-3 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                          <div className="font-mono text-xs">
                            <span className="text-yellow-400">Rank will drop</span>
                            <span className="text-[#6B6B6B]"> to </span>
                            <span className="text-white">{unstakePreview?.emoji} {unstakePreview?.label}</span>
                            <span className="text-[#6B6B6B]"> ({unstakePreview?.feePercent}% fees)</span>
                          </div>
                        </div>
                      )}

                      {/* Preview (no warning) */}
                      {unstakePreview && unstakeInput && parseFloat(unstakeInput) > 0 && !unstakeWarning && (
                        <div className="mb-5 bg-[#0A0A0A] border border-[#222] p-3">
                          <div className="flex items-center justify-between font-mono text-xs">
                            <span className="text-[#6B6B6B]">Rank after</span>
                            <span className="text-white">{unstakePreview.emoji} {unstakePreview.label} (no change)</span>
                          </div>
                        </div>
                      )}

                      {/* CTA */}
                      <button onClick={handleUnstake} disabled={stakingStep !== 'idle' || !unstakeInput || parseFloat(unstakeInput) <= 0 || parseFloat(unstakeInput) > stakedAmount}
                        className="w-full border border-[#333] text-white font-mono text-sm font-bold py-4 hover:border-[#00FF66] hover:text-[#00FF66] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        {stakingStep === 'unstaking' ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Unstaking...</>) :
                         (<><Lock className="w-4 h-4" /> Unstake $GDN</>)}
                      </button>

                      <div className="mt-3 font-mono text-[10px] text-[#6B6B6B] text-center">
                        Instant unstake · No cooldown period
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* LOYALTY RANKS — Comparison Table */}
            <div className="mb-8">
              <h2 className="text-[#6B6B6B] font-mono text-xs uppercase tracking-widest flex items-center gap-2 mb-2">
                <span className="text-[#00FF66]">&gt;</span> LOYALTY RANKS
              </h2>
              <div className="w-full h-[1px] bg-[#333] mt-2 mb-6 relative overflow-hidden"><div className="absolute top-0 left-0 w-1/4 h-full bg-[#00FF66] opacity-20 animate-glitch-h" /></div>

              {/* Desktop: comparison table */}
              <div className="hidden md:block overflow-x-auto">
                <div className="bg-[#111] border border-[#222]">
                  {/* Header row */}
                  <div className="grid grid-cols-6 border-b border-[#222]">
                    <div className="p-4 font-mono text-[10px] uppercase tracking-widest text-[#6B6B6B]">PERK</div>
                    {RANK_TIERS.map((tier, idx) => (
                      <div key={tier.rank} className={`p-4 text-center border-l border-[#222] ${idx === currentRankIdx ? 'bg-[#00FF66]/5' : ''}`}>
                        <div className="text-2xl mb-1">{tier.emoji}</div>
                        <div className="font-mono text-xs text-white font-bold">{tier.label}</div>
                        <div className="font-mono text-[9px] text-[#6B6B6B] mt-0.5">
                          {tier.rank === 'none' ? 'No minimum' :
                           tier.rank === 'platinum' ? '10% + $500K' :
                           `${(tier.minRatio * 100).toFixed(0)}% ratio`}
                        </div>
                        {idx === currentRankIdx && (
                          <div className="mt-2 font-mono text-[9px] bg-[#00FF66] text-black px-2 py-0.5 inline-block uppercase tracking-wider font-bold">Current</div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Perk rows */}
                  {PERKS_TABLE.map((perk, pi) => (
                    <div key={perk.label} className={`grid grid-cols-6 ${pi < PERKS_TABLE.length - 1 ? 'border-b border-[#222]' : ''}`}>
                      <div className="p-3 flex items-center gap-2 font-mono text-xs text-[#6B6B6B]">
                        <span className="text-[#6B6B6B]">{perk.icon}</span>
                        {perk.label}
                      </div>
                      {perk.values.map((val, vi) => (
                        <div key={vi} className={`p-3 text-center border-l border-[#222] font-mono text-xs flex items-center justify-center ${vi === currentRankIdx ? 'bg-[#00FF66]/5' : ''}`}>
                          {typeof val === 'boolean' ? (
                            val ? <Check className="w-4 h-4 text-[#00FF66]" /> : <X className="w-4 h-4 text-[#333]" />
                          ) : (
                            <span className={`${vi > 0 && perk.label.includes('fee') && typeof val === 'string' ? 'text-[#00FF66]' : 'text-white'}`}>{val}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile: cards */}
              <div className="md:hidden space-y-3">
                {RANK_TIERS.map((tier, idx) => {
                  const isCurrent = idx === currentRankIdx;
                  const isLocked = idx > currentRankIdx;
                  return (
                    <div key={tier.rank} className={`bg-[#111] border p-4 transition-all ${isCurrent ? 'border-[#00FF66] shadow-[0_0_20px_rgba(0,255,102,0.08)]' : 'border-[#222]'} ${isLocked ? 'opacity-60' : ''}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{tier.emoji}</span>
                          <div>
                            <span className="font-mono text-sm text-white font-bold">{tier.label}</span>
                            <div className="font-mono text-[9px] text-[#6B6B6B]">
                              {tier.rank === 'none' ? 'No minimum' :
                               tier.rank === 'platinum' ? '10% ratio + $500K deposits' :
                               `${(tier.minRatio * 100).toFixed(0)}% stake ratio`}
                            </div>
                          </div>
                        </div>
                        {isCurrent && <span className="bg-[#00FF66] text-black font-mono text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider">Current</span>}
                        {isLocked && <Lock className="w-3 h-3 text-[#6B6B6B]" />}
                        {idx < currentRankIdx && <Check className="w-4 h-4 text-[#00FF66]" />}
                      </div>
                      <div className="space-y-1.5">
                        {PERKS_TABLE.map(perk => {
                          const val = perk.values[idx];
                          return (
                            <div key={perk.label} className="flex items-center justify-between font-mono text-[11px]">
                              <span className="text-[#6B6B6B]">{perk.label}</span>
                              {typeof val === 'boolean' ? (
                                val ? <span className="text-[#00FF66]">✓</span> : <span className="text-[#333]">✗</span>
                              ) : (
                                <span className="text-white">{val}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* HOW IT WORKS */}
            <div className="mb-8">
              <h2 className="text-[#6B6B6B] font-mono text-xs uppercase tracking-widest flex items-center gap-2 mb-2">
                <span className="text-[#00FF66]">&gt;</span> HOW IT WORKS
              </h2>
              <div className="w-full h-[1px] bg-[#333] mt-2 mb-6 relative overflow-hidden"><div className="absolute top-0 left-0 w-1/4 h-full bg-[#00FF66] opacity-20 animate-glitch-h" /></div>

              <div className="grid md:grid-cols-3 gap-4">
                <HowItWorksCard delay={0} step="01" title="Stake $GDN" desc="Deposit $GDN tokens into the staking contract. No lockup — withdraw anytime." icon={<Zap className="w-6 h-6" />} />
                <HowItWorksCard delay={150} step="02" title="Climb Ranks" desc="Your rank is based on staked GDN value relative to your total vault deposits. Higher ratio = higher rank." icon={<TrendingUp className="w-6 h-6" />} />
                <HowItWorksCard delay={300} step="03" title="Enjoy Perks" desc="Reduced fees on deposits & withdrawals, early vault access, governance voting, airdrop multipliers, and more." icon={<Gift className="w-6 h-6" />} />
              </div>
            </div>

            {/* CTA to $GDN page */}
            <div className="bg-[#111] border border-[#222] p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <div className="font-mono text-sm text-white mb-1">Need more $GDN?</div>
                <div className="font-mono text-xs text-[#6B6B6B]">Buy $GDN on Uniswap or check the token page for price, burns, and flywheel details.</div>
              </div>
              <div className="flex gap-3">
                <Link href="/token" className="bg-transparent border border-[#333] text-white font-mono text-xs font-bold px-5 py-2.5 hover:border-[#00FF66] transition-colors flex items-center gap-2">
                  $GDN Token <ArrowRight className="w-3 h-3" />
                </Link>
                <a href="https://app.uniswap.org" target="_blank" rel="noreferrer" className="bg-[#00FF66] text-black font-mono text-xs font-bold px-5 py-2.5 hover:bg-[#00DD55] transition-colors flex items-center gap-2">
                  Buy on Uniswap <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </>
        )}

      </main>

      {/* MOBILE BOTTOM NAV */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#0A0A0A] border-t border-[#333] z-50 flex justify-around items-center h-16 pb-safe">
        <Link href="/dashboard" className="flex flex-col items-center gap-1 text-[#6B6B6B]"><LayoutDashboard className="w-5 h-5" /><span className="font-mono text-[10px] tracking-widest uppercase">Dash</span></Link>
        <Link href="/vaults" className="flex flex-col items-center gap-1 text-[#6B6B6B]"><Layers className="w-5 h-5" /><span className="font-mono text-[10px] tracking-widest uppercase">Vaults</span></Link>
        <Link href="/stake" className="flex flex-col items-center gap-1 text-[#00FF66]"><Zap className="w-5 h-5" /><span className="font-mono text-[10px] tracking-widest uppercase">Stake</span></Link>
        <Link href="/token" className="flex flex-col items-center gap-1 text-[#6B6B6B]"><Coins className="w-5 h-5" /><span className="font-mono text-[10px] tracking-widest uppercase">$GDN</span></Link>
      </div>

      <style jsx global>{`
        @keyframes glitch-h { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(100%); } }
        .animate-glitch-h { animation: glitch-h 3s linear infinite; }
        @keyframes fade-in-up { from { opacity: 0; transform: translate(-50%, 10px); } to { opacity: 1; transform: translate(-50%, 0); } }
        .animate-fade-in-up { animation: fade-in-up 0.3s ease-out; }
      `}</style>
    </div>
  );
}
