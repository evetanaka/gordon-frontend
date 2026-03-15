'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { formatUnits, type Address } from 'viem';
import ConnectButton from '@/components/ConnectButton';
import Navbar from '@/components/Navbar';
import MobileNav from '@/components/MobileNav';
import { useStaking } from '@/hooks/useStaking';
import { useToken, useAllowance } from '@/hooks/useToken';
import { CONTRACTS } from '@/config/contracts';
import {
  ChevronDown, ExternalLink, Copy, Power, Check, X,
  LayoutDashboard, Layers, Trophy, Coins, Lock, Zap,
  AlertTriangle, Crown, ArrowRight, Shield, Star, Gift,
  Users, Vote, TrendingUp, ChevronUp, Flame, Award, Clock
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

const LOCK_OPTIONS = [
  { months: 3, boost: '1x', boostBps: 10000 },
  { months: 6, boost: '1.5x', boostBps: 15000 },
  { months: 9, boost: '2x', boostBps: 20000 },
  { months: 12, boost: '3x', boostBps: 30000 },
];

const TIER_LABELS = ['Unranked', 'Bronze', 'Silver', 'Gold', 'Platinum'];
const TIER_EMOJIS = ['—', '🥉', '🥈', '🥇', '💎'];
const TIER_COLORS = ['#6B6B6B', '#CD7F32', '#C0C0C0', '#FFD700', '#00FF66'];

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

// --- HELPERS ---

function formatGDN(val: bigint | undefined): string {
  if (!val) return '0';
  return Number(formatUnits(val, 18)).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatGDNRaw(val: bigint | undefined): number {
  if (!val) return 0;
  return Number(formatUnits(val, 18));
}

function calcSlashPercent(lockEnd: bigint, now: number): number {
  const lockEndSec = Number(lockEnd);
  if (now >= lockEndSec) return 0;
  const remainingSec = lockEndSec - now;
  const remainingMonths = Math.ceil(remainingSec / (30 * 24 * 3600));
  const slash = 5 + 0.5 * remainingMonths;
  return Math.min(slash, 10);
}

function formatDate(timestamp: bigint): string {
  if (!timestamp || timestamp === 0n) return '—';
  return new Date(Number(timestamp) * 1000).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function formatDuration(seconds: bigint | undefined): string {
  if (!seconds || seconds === 0n) return 'Unlocked';
  const s = Number(seconds);
  const days = Math.floor(s / 86400);
  if (days > 30) {
    const months = Math.floor(days / 30);
    const remDays = days % 30;
    return remDays > 0 ? `${months}mo ${remDays}d` : `${months}mo`;
  }
  if (days > 0) return `${days}d`;
  const hrs = Math.floor(s / 3600);
  return hrs > 0 ? `${hrs}h` : `< 1h`;
}

// --- MAIN PAGE ---

export default function StakePage() {
  const { address, isConnected } = useAccount();
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [stakeInput, setStakeInput] = useState('');
  const [lockMonths, setLockMonths] = useState(3);
  const [activeTab, setActiveTab] = useState<'stake' | 'unstake'>('stake');
  const [txStep, setTxStep] = useState<'idle' | 'approving' | 'staking' | 'unstaking' | 'claiming'>('idle');

  // Hooks
  const staking = useStaking();
  const gdnToken = useToken('GDN');
  const allowance = useAllowance('GDN', CONTRACTS.GDNStaking as Address);

  const showToast = (msg: string) => {
    setToast({ visible: true, message: msg });
    setTimeout(() => setToast({ visible: false, message: '' }), 3000);
  };

  // Refetch on tx confirmation
  useEffect(() => {
    if (staking.isTxConfirmed) {
      staking.refetchAll();
      gdnToken.balance !== undefined && allowance.refetch();
      if (txStep === 'approving') {
        showToast('Approval confirmed — now stake');
        // Auto-proceed to stake after approval
        setTimeout(() => {
          const amt = parseFloat(stakeInput);
          if (amt > 0) {
            setTxStep('staking');
            staking.resetWrite();
            setTimeout(() => {
              staking.stake(stakeInput, lockMonths);
            }, 300);
          } else {
            setTxStep('idle');
          }
        }, 500);
      } else if (txStep === 'staking') {
        showToast(`Staked ${stakeInput} GDN successfully`);
        setStakeInput('');
        setTxStep('idle');
        staking.resetWrite();
      } else if (txStep === 'unstaking') {
        showToast('Unstaked successfully');
        setTxStep('idle');
        staking.resetWrite();
      } else if (txStep === 'claiming') {
        showToast('Rewards claimed');
        setTxStep('idle');
        staking.resetWrite();
      }
    }
  }, [staking.isTxConfirmed]);

  // Reset on write error
  useEffect(() => {
    if (staking.writeError) {
      setTxStep('idle');
    }
  }, [staking.writeError]);

  // Derived values
  const walletBalance = formatGDNRaw(gdnToken.balance);
  const stakedAmt = formatGDNRaw(staking.stakedAmount);
  const pendingRewardsAmt = formatGDNRaw(staking.pendingRewards);
  const totalStaked = formatGDNRaw(staking.totalEffectiveStaked);
  const tierIdx = (staking.loyaltyTier ?? 0) as number;
  const boostBps = staking.boostBps ?? 0;
  const boostDisplay = boostBps > 0 ? `${(boostBps / 10000).toFixed(1)}x` : '—';
  const lockEnd = staking.lockEnd ?? 0n;
  const lockExpired = lockEnd > 0n && Number(lockEnd) <= Math.floor(Date.now() / 1000);
  const hasStake = staking.isUserStaking === true && stakedAmt > 0;
  const nowSec = Math.floor(Date.now() / 1000);
  const slashPct = hasStake && !lockExpired ? calcSlashPercent(lockEnd, nowSec) : 0;

  // Check if allowance sufficient
  const stakeAmtNum = parseFloat(stakeInput) || 0;
  const currentAllowance = allowance.allowance ?? 0n;
  const needsApproval = stakeAmtNum > 0 && currentAllowance < BigInt(Math.floor(stakeAmtNum * 1e18));

  const selectedBoost = LOCK_OPTIONS.find(o => o.months === lockMonths)!;

  // Actions
  const handleStake = () => {
    if (stakeAmtNum <= 0 || stakeAmtNum > walletBalance) return;
    if (needsApproval) {
      setTxStep('approving');
      staking.resetWrite();
      gdnToken.approve(CONTRACTS.GDNStaking as Address, stakeInput);
    } else {
      setTxStep('staking');
      staking.resetWrite();
      staking.stake(stakeInput, lockMonths);
    }
  };

  const handleUnstake = () => {
    if (!hasStake) return;
    setTxStep('unstaking');
    staking.resetWrite();
    staking.unstake();
  };

  const handleClaim = () => {
    if (pendingRewardsAmt <= 0) return;
    setTxStep('claiming');
    staking.resetWrite();
    staking.claimRewards();
  };

  const setStakePercent = (pct: number) => {
    const val = walletBalance * pct;
    setStakeInput(val > 0 ? val.toFixed(2) : '');
  };

  // Count-up stats
  const [tvlRef, tvlVal] = useCountUp(totalStaked, 2000, 0, 2, '', ' GDN');
  // Stakers count not available on-chain — show "—"
  const stakersRef = useRef<HTMLDivElement>(null);
  const stakersVal = '—';

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Toast message={toast.message} visible={toast.visible} />
      <Navbar />

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
            Stake $GDN with a lock period to earn rewards and climb Loyalty Ranks. Longer locks = higher boost.
          </p>
        </div>

        {/* PROTOCOL STATS BANNER */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {[
            { ref: tvlRef, label: 'TOTAL STAKED', value: tvlVal },
            { ref: stakersRef, label: 'STAKERS', value: stakersVal },
            { label: 'YOUR TIER', value: `${TIER_EMOJIS[tierIdx]} ${TIER_LABELS[tierIdx]}` },
            { label: 'PENDING REWARDS', value: `${pendingRewardsAmt.toFixed(2)} GDN` },
          ].map((s, i) => (
            <div key={i} ref={(s as any).ref} className="bg-[#111] border border-[#222] p-4">
              <div className="font-mono text-[10px] uppercase tracking-widest text-[#6B6B6B] mb-2">{s.label}</div>
              <div className="font-mono text-lg md:text-xl text-white">{s.value}</div>
            </div>
          ))}
        </div>

        {!isConnected ? (
          <div className="bg-[#111] border border-[#222] p-12 text-center">
            <Zap className="w-10 h-10 text-[#00FF66] mx-auto mb-4" />
            <h3 className="font-mono text-lg text-white mb-2">Connect Wallet to Stake</h3>
            <p className="font-mono text-sm text-[#6B6B6B] mb-6 max-w-md mx-auto">Stake your $GDN tokens to earn rewards, reduce fees and unlock exclusive perks.</p>
            <ConnectButton />
          </div>
        ) : (
          <>
            {/* TWO-COLUMN: Position + Stake/Unstake */}
            <div className="grid lg:grid-cols-5 gap-4 mb-10">

              {/* LEFT: Your Position (3 cols) */}
              <div className="lg:col-span-3 bg-[#111] border border-[#222]">
                <div className="p-6 border-b border-[#222]">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 flex items-center justify-center text-4xl" style={{
                        background: `linear-gradient(135deg, ${TIER_COLORS[tierIdx]}22, ${TIER_COLORS[tierIdx]}08)`,
                        border: `1px solid ${TIER_COLORS[tierIdx]}44`,
                      }}>
                        {TIER_EMOJIS[tierIdx]}
                      </div>
                      <div>
                        <div className="font-mono text-[10px] uppercase tracking-widest text-[#6B6B6B] mb-1">YOUR RANK</div>
                        <div className="font-mono text-xl text-white font-bold">{TIER_LABELS[tierIdx]}</div>
                        <div className="font-mono text-xs text-[#6B6B6B]">Boost: {boostDisplay}</div>
                      </div>
                    </div>
                    {hasStake && (
                      <div className="text-right">
                        <div className="font-mono text-[10px] uppercase tracking-widest text-[#6B6B6B] mb-1">LOCK EXPIRY</div>
                        <div className={`font-mono text-sm ${lockExpired ? 'text-[#00FF66]' : 'text-white'}`}>
                          {lockExpired ? 'Unlocked ✓' : formatDate(lockEnd)}
                        </div>
                        {!lockExpired && staking.timeUntilUnlock && (
                          <div className="font-mono text-[10px] text-[#6B6B6B] mt-0.5 flex items-center gap-1 justify-end">
                            <Clock className="w-3 h-3" /> {formatDuration(staking.timeUntilUnlock)} remaining
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="font-mono text-[9px] uppercase tracking-widest text-[#6B6B6B] mb-1">STAKED</div>
                      <div className="font-mono text-sm text-white">{formatGDN(staking.stakedAmount)} GDN</div>
                    </div>
                    <div>
                      <div className="font-mono text-[9px] uppercase tracking-widest text-[#6B6B6B] mb-1">EFFECTIVE</div>
                      <div className="font-mono text-sm text-white">{formatGDN(staking.effectiveAmount)} GDN</div>
                    </div>
                    <div>
                      <div className="font-mono text-[9px] uppercase tracking-widest text-[#6B6B6B] mb-1">WALLET</div>
                      <div className="font-mono text-sm text-white">{walletBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} GDN</div>
                    </div>
                    <div>
                      <div className="font-mono text-[9px] uppercase tracking-widest text-[#6B6B6B] mb-1">PENDING REWARDS</div>
                      <div className="font-mono text-sm text-[#00FF66]">{pendingRewardsAmt.toFixed(4)} GDN</div>
                    </div>
                  </div>
                </div>

                {/* Claim rewards + unstake section */}
                <div className="p-6">
                  {hasStake ? (
                    <div className="space-y-4">
                      {/* Claim rewards */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-mono text-xs text-[#6B6B6B]">Claimable rewards</div>
                          <div className="font-mono text-lg text-[#00FF66]">{pendingRewardsAmt.toFixed(4)} GDN</div>
                        </div>
                        <button
                          onClick={handleClaim}
                          disabled={pendingRewardsAmt <= 0 || txStep !== 'idle'}
                          className="bg-[#00FF66] text-black font-mono text-xs font-bold px-6 py-2.5 hover:bg-[#00DD55] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {txStep === 'claiming' ? (
                            <><div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" /> Claiming...</>
                          ) : (
                            <><Gift className="w-3 h-3" /> Claim</>
                          )}
                        </button>
                      </div>

                      {/* Early unstake warning */}
                      {!lockExpired && slashPct > 0 && (
                        <div className="bg-[#1a1500] border border-yellow-600/30 p-3 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                          <div className="font-mono text-xs">
                            <span className="text-yellow-400">Early unstake penalty: {slashPct.toFixed(1)}%</span>
                            <span className="text-[#6B6B6B]"> — Lock expires {formatDate(lockEnd)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Zap className="w-8 h-8 text-[#6B6B6B] mx-auto mb-2" />
                      <div className="font-mono text-sm text-[#6B6B6B]">No active stake</div>
                      <div className="font-mono text-xs text-[#6B6B6B] mt-1">Stake GDN to start earning rewards</div>
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
                        <span className="font-mono text-xs text-[#6B6B6B]">Balance: <span className="text-white">{walletBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span> GDN</span>
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

                      {/* Lock duration selector */}
                      <div className="mb-5">
                        <div className="font-mono text-[10px] uppercase tracking-widest text-[#6B6B6B] mb-2">Lock Duration</div>
                        <div className="grid grid-cols-4 gap-2">
                          {LOCK_OPTIONS.map(opt => (
                            <button
                              key={opt.months}
                              onClick={() => setLockMonths(opt.months)}
                              className={`py-3 font-mono text-center transition-colors border ${
                                lockMonths === opt.months
                                  ? 'border-[#00FF66] bg-[#00FF66]/10 text-[#00FF66]'
                                  : 'border-[#333] bg-[#0A0A0A] text-[#6B6B6B] hover:border-[#00FF66]/50'
                              }`}
                            >
                              <div className="text-sm font-bold">{opt.months}mo</div>
                              <div className="text-[9px] mt-0.5">{opt.boost}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Preview */}
                      {stakeAmtNum > 0 && (
                        <div className="mb-5 space-y-2">
                          <div className="bg-[#0A0A0A] border border-[#222] p-3">
                            <div className="flex items-center justify-between font-mono text-xs">
                              <span className="text-[#6B6B6B]">Boost multiplier</span>
                              <span className="text-[#00FF66]">{selectedBoost.boost}</span>
                            </div>
                          </div>
                          <div className="bg-[#0A0A0A] border border-[#222] p-3">
                            <div className="flex items-center justify-between font-mono text-xs">
                              <span className="text-[#6B6B6B]">Effective stake</span>
                              <span className="text-white">{(stakeAmtNum * selectedBoost.boostBps / 10000).toFixed(2)} GDN</span>
                            </div>
                          </div>
                          <div className="bg-[#0A0A0A] border border-[#222] p-3">
                            <div className="flex items-center justify-between font-mono text-xs">
                              <span className="text-[#6B6B6B]">Lock until</span>
                              <span className="text-white">{new Date(Date.now() + lockMonths * 30 * 24 * 3600 * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* CTA */}
                      <button
                        onClick={handleStake}
                        disabled={txStep !== 'idle' || stakeAmtNum <= 0 || stakeAmtNum > walletBalance}
                        className="w-full bg-[#00FF66] text-black font-mono text-sm font-bold py-4 hover:bg-[#00DD55] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {txStep === 'approving' ? (
                          <><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> Approving...</>
                        ) : txStep === 'staking' ? (
                          <><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> Staking...</>
                        ) : needsApproval ? (
                          <><Check className="w-4 h-4" /> Approve & Stake</>
                        ) : (
                          <><Zap className="w-4 h-4" /> Stake $GDN</>
                        )}
                      </button>

                      <div className="mt-3 font-mono text-[10px] text-[#6B6B6B] text-center">
                        {needsApproval ? '2-step: Approve → Stake' : 'Sufficient allowance — 1-step stake'} · Lock: {lockMonths} months
                      </div>

                      {/* Write error */}
                      {staking.writeError && txStep === 'idle' && (
                        <div className="mt-3 bg-[#1a0000] border border-red-600/30 p-3 font-mono text-xs text-red-400">
                          {(staking.writeError as any)?.shortMessage || staking.writeError.message}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Unstake tab */}
                      {hasStake ? (
                        <>
                          <div className="space-y-3 mb-5">
                            <div className="bg-[#0A0A0A] border border-[#222] p-3">
                              <div className="flex items-center justify-between font-mono text-xs">
                                <span className="text-[#6B6B6B]">Staked amount</span>
                                <span className="text-white">{formatGDN(staking.stakedAmount)} GDN</span>
                              </div>
                            </div>
                            <div className="bg-[#0A0A0A] border border-[#222] p-3">
                              <div className="flex items-center justify-between font-mono text-xs">
                                <span className="text-[#6B6B6B]">Lock expiry</span>
                                <span className={lockExpired ? 'text-[#00FF66]' : 'text-white'}>
                                  {lockExpired ? 'Unlocked ✓' : formatDate(lockEnd)}
                                </span>
                              </div>
                            </div>
                            <div className="bg-[#0A0A0A] border border-[#222] p-3">
                              <div className="flex items-center justify-between font-mono text-xs">
                                <span className="text-[#6B6B6B]">Boost</span>
                                <span className="text-white">{boostDisplay}</span>
                              </div>
                            </div>
                          </div>

                          {/* Early unstake warning */}
                          {!lockExpired && slashPct > 0 && (
                            <div className="mb-4 bg-[#1a1500] border border-yellow-600/30 p-3 flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                              <div className="font-mono text-xs">
                                <div className="text-yellow-400 mb-1">Early unstake penalty: {slashPct.toFixed(1)}%</div>
                                <div className="text-[#6B6B6B]">
                                  You will receive ~{(stakedAmt * (1 - slashPct / 100)).toFixed(2)} GDN instead of {stakedAmt.toFixed(2)} GDN.
                                  Wait until {formatDate(lockEnd)} to avoid penalty.
                                </div>
                              </div>
                            </div>
                          )}

                          {/* CTA */}
                          <button
                            onClick={handleUnstake}
                            disabled={txStep !== 'idle'}
                            className="w-full border border-[#333] text-white font-mono text-sm font-bold py-4 hover:border-[#00FF66] hover:text-[#00FF66] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {txStep === 'unstaking' ? (
                              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Unstaking...</>
                            ) : (
                              <><Lock className="w-4 h-4" /> {lockExpired ? 'Unstake $GDN' : 'Early Unstake (Penalty)'}</>
                            )}
                          </button>

                          <div className="mt-3 font-mono text-[10px] text-[#6B6B6B] text-center">
                            {lockExpired ? 'No penalty — lock period ended' : `Early exit penalty: ${slashPct.toFixed(1)}%`}
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <Lock className="w-8 h-8 text-[#6B6B6B] mx-auto mb-2" />
                          <div className="font-mono text-sm text-[#6B6B6B]">Nothing to unstake</div>
                          <div className="font-mono text-xs text-[#6B6B6B] mt-1">Stake GDN first to see unstake options</div>
                        </div>
                      )}

                      {/* Write error */}
                      {staking.writeError && txStep === 'idle' && (
                        <div className="mt-3 bg-[#1a0000] border border-red-600/30 p-3 font-mono text-xs text-red-400">
                          {(staking.writeError as any)?.shortMessage || staking.writeError.message}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* LOCK DURATION COMPARISON TABLE */}
            <div className="mb-8">
              <h2 className="text-[#6B6B6B] font-mono text-xs uppercase tracking-widest flex items-center gap-2 mb-2">
                <span className="text-[#00FF66]">&gt;</span> LOCK DURATIONS
              </h2>
              <div className="w-full h-[1px] bg-[#333] mt-2 mb-6 relative overflow-hidden"><div className="absolute top-0 left-0 w-1/4 h-full bg-[#00FF66] opacity-20 animate-glitch-h" /></div>

              <div className="bg-[#111] border border-[#222] overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#222]">
                      <th className="p-4 text-left font-mono text-[10px] uppercase tracking-widest text-[#6B6B6B]">Duration</th>
                      <th className="p-4 text-center font-mono text-[10px] uppercase tracking-widest text-[#6B6B6B]">Boost</th>
                      <th className="p-4 text-center font-mono text-[10px] uppercase tracking-widest text-[#6B6B6B]">Effective per 1000 GDN</th>
                      <th className="p-4 text-center font-mono text-[10px] uppercase tracking-widest text-[#6B6B6B]">Early Exit Penalty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {LOCK_OPTIONS.map((opt, i) => (
                      <tr key={opt.months} className={`${i < LOCK_OPTIONS.length - 1 ? 'border-b border-[#222]' : ''} ${lockMonths === opt.months ? 'bg-[#00FF66]/5' : ''}`}>
                        <td className="p-4 font-mono text-sm text-white">{opt.months} months</td>
                        <td className="p-4 text-center font-mono text-sm text-[#00FF66]">{opt.boost}</td>
                        <td className="p-4 text-center font-mono text-sm text-white">{(1000 * opt.boostBps / 10000).toLocaleString()} GDN</td>
                        <td className="p-4 text-center font-mono text-sm text-yellow-400">up to 10%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* LOYALTY RANKS — Comparison Table */}
            <div className="mb-8">
              <h2 className="text-[#6B6B6B] font-mono text-xs uppercase tracking-widest flex items-center gap-2 mb-2">
                <span className="text-[#00FF66]">&gt;</span> LOYALTY RANKS
              </h2>
              <div className="w-full h-[1px] bg-[#333] mt-2 mb-6 relative overflow-hidden"><div className="absolute top-0 left-0 w-1/4 h-full bg-[#00FF66] opacity-20 animate-glitch-h" /></div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <div className="bg-[#111] border border-[#222]">
                  <div className="grid grid-cols-6 border-b border-[#222]">
                    <div className="p-4 font-mono text-[10px] uppercase tracking-widest text-[#6B6B6B]">PERK</div>
                    {TIER_LABELS.map((label, idx) => (
                      <div key={label} className={`p-4 text-center border-l border-[#222] ${idx === tierIdx ? 'bg-[#00FF66]/5' : ''}`}>
                        <div className="text-2xl mb-1">{TIER_EMOJIS[idx]}</div>
                        <div className="font-mono text-xs text-white font-bold">{label}</div>
                        {idx === tierIdx && (
                          <div className="mt-2 font-mono text-[9px] bg-[#00FF66] text-black px-2 py-0.5 inline-block uppercase tracking-wider font-bold">Current</div>
                        )}
                      </div>
                    ))}
                  </div>

                  {PERKS_TABLE.map((perk, pi) => (
                    <div key={perk.label} className={`grid grid-cols-6 ${pi < PERKS_TABLE.length - 1 ? 'border-b border-[#222]' : ''}`}>
                      <div className="p-3 flex items-center gap-2 font-mono text-xs text-[#6B6B6B]">
                        <span className="text-[#6B6B6B]">{perk.icon}</span>
                        {perk.label}
                      </div>
                      {perk.values.map((val, vi) => (
                        <div key={vi} className={`p-3 text-center border-l border-[#222] font-mono text-xs flex items-center justify-center ${vi === tierIdx ? 'bg-[#00FF66]/5' : ''}`}>
                          {typeof val === 'boolean' ? (
                            val ? <Check className="w-4 h-4 text-[#00FF66]" /> : <X className="w-4 h-4 text-[#333]" />
                          ) : (
                            <span className={`${vi > 0 && perk.label.includes('fee') ? 'text-[#00FF66]' : 'text-white'}`}>{val}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {TIER_LABELS.map((label, idx) => {
                  const isCurrent = idx === tierIdx;
                  const isLocked = idx > tierIdx;
                  return (
                    <div key={label} className={`bg-[#111] border p-4 transition-all ${isCurrent ? 'border-[#00FF66] shadow-[0_0_20px_rgba(0,255,102,0.08)]' : 'border-[#222]'} ${isLocked ? 'opacity-60' : ''}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{TIER_EMOJIS[idx]}</span>
                          <div>
                            <span className="font-mono text-sm text-white font-bold">{label}</span>
                          </div>
                        </div>
                        {isCurrent && <span className="bg-[#00FF66] text-black font-mono text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider">Current</span>}
                        {isLocked && <Lock className="w-3 h-3 text-[#6B6B6B]" />}
                        {idx < tierIdx && <Check className="w-4 h-4 text-[#00FF66]" />}
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
                <HowItWorksCard delay={0} step="01" title="Stake $GDN" desc="Deposit $GDN tokens with a lock period (3–12 months). Longer locks earn higher boost multipliers." icon={<Zap className="w-6 h-6" />} />
                <HowItWorksCard delay={150} step="02" title="Earn & Climb" desc="Earn GDN rewards proportional to your effective stake. Your loyalty tier determines fee discounts across the protocol." icon={<TrendingUp className="w-6 h-6" />} />
                <HowItWorksCard delay={300} step="03" title="Claim or Compound" desc="Claim pending rewards anytime. Unstake after lock expires with no penalty, or early unstake with up to 10% slash." icon={<Gift className="w-6 h-6" />} />
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

      <MobileNav />

      <style jsx global>{`
        @keyframes glitch-h { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(100%); } }
        .animate-glitch-h { animation: glitch-h 3s linear infinite; }
        @keyframes fade-in-up { from { opacity: 0; transform: translate(-50%, 10px); } to { opacity: 1; transform: translate(-50%, 0); } }
        .animate-fade-in-up { animation: fade-in-up 0.3s ease-out; }
      `}</style>
    </div>
  );
}
