'use client'

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import ConnectButton from '@/components/ConnectButton';
import Navbar from '@/components/Navbar';
import MobileNav from '@/components/MobileNav';
import { useAccount } from 'wagmi';
import { formatUnits, type Address } from 'viem';
import { useVault } from '@/hooks/useVault';
import { useStaking } from '@/hooks/useStaking';
import { usePriceFeed } from '@/hooks/usePriceFeed';
import { Check, Flame, ArrowUpRight, ArrowRight, Wallet, Zap } from 'lucide-react';
import { CONTRACTS } from '@/config/contracts';

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

// --- COMPONENTS ---

const SectionHeader = ({ title }: { title: string }) => {
  const [ref, isVisible] = useScrollReveal();
  return (
    <div ref={ref} className={`mb-6 transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="flex items-center gap-4">
        <h2 className="text-[#6B6B6B] font-mono text-xs uppercase tracking-widest flex items-center gap-2">
          <span className="text-[#00FF66]">&gt;</span> {title}
        </h2>
      </div>
      <div className="w-full h-[1px] bg-[#333] mt-2 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1/4 h-full bg-[#00FF66] opacity-20 animate-glitch-h" />
      </div>
    </div>
  );
};

const StatCard = ({ label, value, sub, color, index, isLoading }: { label: string; value: string; sub?: string; color?: string; index: number; isLoading?: boolean }) => {
  const [animRef, isVisible] = useScrollReveal({ delay: index * 100 });
  return (
    <div
      ref={animRef}
      className={`bg-[#111] border border-[#333] p-4 md:p-6 flex flex-col justify-between hover:border-[#6B6B6B] transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
    >
      <div className="font-mono text-[10px] md:text-xs text-[#6B6B6B] uppercase tracking-widest mb-4">{label}</div>
      <div>
        <div className={`font-sans font-bold text-xl md:text-2xl ${color || 'text-white'}`}>
          {isLoading ? <span className="animate-pulse text-[#333]">---</span> : value}
        </div>
        {sub && (
          <div className={`font-mono text-[10px] md:text-xs mt-1 ${color || 'text-[#6B6B6B]'}`}>
            {isLoading ? '' : sub}
          </div>
        )}
      </div>
    </div>
  );
};

// Vault position component
const VAULT_CONFIG = [
  { name: 'Crypto Vault', address: CONTRACTS.CryptoVault as Address, slug: 'crypto' },
  { name: 'Sport Vault', address: CONTRACTS.SportVault as Address, slug: 'sport' },
  { name: 'Finance Vault', address: CONTRACTS.FinanceVault as Address, slug: 'finance' },
  { name: 'Politic Vault', address: CONTRACTS.PoliticVault as Address, slug: 'politic' },
];

function useVaultPosition(vaultAddress: Address) {
  const vault = useVault(vaultAddress);
  return vault;
}

const VaultPositionRow = ({ vaultConfig, index }: { vaultConfig: typeof VAULT_CONFIG[0]; index: number }) => {
  const [ref, isVisible] = useScrollReveal({ delay: index * 150 });
  const vault = useVaultPosition(vaultConfig.address);

  const shares = vault.userShares;
  const hasPosition = shares !== undefined && shares > BigInt(0);
  // userPosition returns [depositedAmount, shares]
  const depositedAmount = vault.userPosition?.[0];
  const currentValue = vault.sharePrice && shares
    ? (Number(shares) * Number(vault.sharePrice)) / 1e6 / 1e6 // sharePrice is 6 decimals, shares 6 decimals
    : 0;
  const depositedNum = depositedAmount ? parseFloat(formatUnits(depositedAmount, 6)) : 0;
  // Use sharePrice to compute current value from shares
  const sharesNum = shares ? parseFloat(formatUnits(shares, 6)) : 0;
  const sharePriceNum = vault.sharePrice ? parseFloat(formatUnits(vault.sharePrice, 6)) : 1;
  const currentValueNum = sharesNum * sharePriceNum;
  const pnl = currentValueNum - depositedNum;
  const pnlPct = depositedNum > 0 ? ((pnl / depositedNum) * 100) : 0;

  if (!hasPosition) return null;

  return (
    <div
      ref={ref}
      className={`bg-[#111] md:bg-transparent border border-[#333] md:border-b md:border-x-0 md:border-t-0 p-4 md:py-4 md:px-4 hover:bg-[#111] transition-all duration-300 md:grid md:grid-cols-12 md:gap-4 md:items-center ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}
    >
      <div className="col-span-3 mb-4 md:mb-0">
        <div className="font-bold text-white mb-1 flex items-center justify-between md:justify-start">
          {vaultConfig.name}
          <span className={`md:hidden font-mono text-xs ${pnl >= 0 ? 'text-[#00FF66]' : 'text-[#FF3B3B]'}`}>{pnl >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%</span>
        </div>
      </div>
      <div className="col-span-2 md:text-right flex justify-between md:block font-mono text-sm text-[#6B6B6B] md:text-white mb-2 md:mb-0">
        <span className="md:hidden text-xs uppercase tracking-widest">Deposited</span>
        ${depositedNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      <div className="col-span-2 md:text-right flex justify-between md:block font-mono text-sm text-white mb-2 md:mb-0">
        <span className="md:hidden text-[#6B6B6B] text-xs uppercase tracking-widest">Current</span>
        ${currentValueNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      <div className={`col-span-2 md:text-right flex justify-between md:block font-mono text-sm mb-4 md:mb-0 ${pnl >= 0 ? 'text-[#00FF66]' : 'text-[#FF3B3B]'}`}>
        <span className="md:hidden text-[#6B6B6B] text-xs uppercase tracking-widest">PNL</span>
        <div>
          {pnl >= 0 ? '+' : ''}${pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          <div className="text-[10px] hidden md:block">{pnl >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%</div>
        </div>
      </div>
      <div className="col-span-3 md:text-right mt-4 md:mt-0">
        <Link href={`/vaults/${vaultConfig.slug}`} className="w-full md:w-auto text-xs font-mono text-[#6B6B6B] hover:text-[#00FF66] transition-colors uppercase tracking-widest flex justify-center md:justify-end items-center gap-1 group">
          [Manage <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />]
        </Link>
      </div>
    </div>
  );
};

// Activity item
const ActivityItem = ({ item, index }: { item: any; index: number }) => {
  const [ref, isVisible] = useScrollReveal({ delay: index * 100 });
  return (
    <div
      ref={ref}
      className={`flex justify-between p-3 hover:bg-[#222] cursor-pointer transition-all duration-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}
    >
      <div className="flex gap-3 items-start">
        <div className="mt-0.5">{item.icon}</div>
        <span className="text-[#E0E0E0]">{item.text}</span>
      </div>
      <div className="text-[#6B6B6B] whitespace-nowrap ml-4">{item.time}</div>
    </div>
  );
};

// Performance Chart (mock)
const PerformanceChart = ({ data }: { data: { date: string; value: number; change: string }[] }) => {
  const [hoveredPoint, setHoveredPoint] = useState<any>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);

  useEffect(() => {
    const updateWidth = () => {
      if (chartRef.current) setWidth(chartRef.current.clientWidth);
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const height = 300;
  const padding = { top: 20, right: 20, bottom: 30, left: 60 };
  const minVal = Math.min(...data.map(d => d.value)) * 0.95;
  const maxVal = Math.max(...data.map(d => d.value)) * 1.05;
  const getX = (index: number) => padding.left + (index / (data.length - 1)) * (width - padding.left - padding.right);
  const getY = (val: number) => height - padding.bottom - ((val - minVal) / (maxVal - minVal)) * (height - padding.top - padding.bottom);
  const pathD = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.value)}`).join(' ');
  const areaD = `${pathD} L ${getX(data.length - 1)} ${height - padding.bottom} L ${getX(0)} ${height - padding.bottom} Z`;

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!chartRef.current) return;
    const rect = chartRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const chartWidth = rect.width - padding.left - padding.right;
    const relativeX = Math.max(0, Math.min(x - padding.left, chartWidth));
    const index = Math.round((relativeX / chartWidth) * (data.length - 1));
    if (index >= 0 && index < data.length) {
      setHoveredPoint({ ...data[index], x: getX(index), y: getY(data[index].value) });
    }
  };

  return (
    <div className="relative w-full h-[300px]" ref={chartRef} onMouseMove={handleMouseMove} onMouseLeave={() => setHoveredPoint(null)}>
      <svg className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00FF66" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#00FF66" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
          const val = minVal + (maxVal - minVal) * ratio;
          const y = height - padding.bottom - ratio * (height - padding.top - padding.bottom);
          return (
            <g key={ratio}>
              <line x1={padding.left - 5} y1={y} x2="100%" y2={y} stroke="#222" strokeWidth="1" strokeDasharray="2,2" />
              <text x={padding.left - 10} y={y + 4} fill="#6B6B6B" fontSize="10" fontFamily="monospace" textAnchor="end">${(val / 1000).toFixed(1)}K</text>
            </g>
          );
        })}
        <path d={areaD} fill="url(#chartGradient)" />
        <path d={pathD} fill="none" stroke="#00FF66" strokeWidth="2" strokeLinejoin="round" />
        {hoveredPoint && (
          <g>
            <line x1={hoveredPoint.x} y1={padding.top} x2={hoveredPoint.x} y2={height - padding.bottom} stroke="#6B6B6B" strokeWidth="1" strokeDasharray="4,4" />
            <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="4" fill="#0A0A0A" stroke="#00FF66" strokeWidth="2" />
          </g>
        )}
      </svg>
      {hoveredPoint && (
        <div
          className="absolute pointer-events-none bg-[#111] border border-[#333] p-3 shadow-[0_0_15px_rgba(0,255,102,0.1)] z-10"
          style={{
            left: Math.min(hoveredPoint.x + 15, width - 150),
            top: Math.max(padding.top, hoveredPoint.y - 60)
          }}
        >
          <div className="text-[#6B6B6B] font-mono text-[10px] mb-1">{hoveredPoint.date}</div>
          <div className="text-white font-mono font-bold text-sm">${hoveredPoint.value.toLocaleString()}</div>
          <div className="text-[#00FF66] font-mono text-[10px] mt-1">{hoveredPoint.change}</div>
        </div>
      )}
    </div>
  );
};

// Helper
function formatNumber(n: number, decimals = 2): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

// --- MAIN ---

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const [chartPeriod, setChartPeriod] = useState('30D');

  // Vault hooks
  const cryptoVault = useVault(CONTRACTS.CryptoVault as Address);
  const sportVault = useVault(CONTRACTS.SportVault as Address);
  const financeVault = useVault(CONTRACTS.FinanceVault as Address);
  const politicVault = useVault(CONTRACTS.PoliticVault as Address);

  // Staking
  const staking = useStaking();

  // Price
  const { price: rawPrice } = usePriceFeed();
  const gdnPrice = rawPrice ? parseFloat(formatUnits(rawPrice, 8)) : 0;

  // Compute portfolio value from all vaults
  const vaults = [cryptoVault, sportVault, financeVault, politicVault];
  const vaultNames = ['Crypto Vault', 'Sport Vault', 'Finance Vault', 'Politic Vault'];

  let totalCurrentValue = 0;
  let totalDeposited = 0;

  vaults.forEach((v) => {
    const shares = v.userShares;
    const position = v.userPosition; // [depositedAmount, shares]
    if (shares && shares > BigInt(0) && v.sharePrice) {
      const sharesNum = parseFloat(formatUnits(shares, 6));
      const sharePriceNum = parseFloat(formatUnits(v.sharePrice, 6));
      totalCurrentValue += sharesNum * sharePriceNum;
    }
    if (position && position[0] > BigInt(0)) {
      totalDeposited += parseFloat(formatUnits(position[0], 6));
    }
  });

  // Staked GDN value
  const stakedAmount = staking.stakedAmount;
  const stakedNum = stakedAmount ? parseFloat(formatUnits(stakedAmount, 18)) : 0;
  const stakedValue = stakedNum * gdnPrice;
  const pendingRewardsNum = staking.pendingRewards ? parseFloat(formatUnits(staking.pendingRewards, 18)) : 0;

  const totalPortfolioValue = totalCurrentValue + stakedValue;
  const totalPnl = totalCurrentValue - totalDeposited;
  const totalPnlPct = totalDeposited > 0 ? ((totalPnl / totalDeposited) * 100) : 0;

  const hasAnyPosition = vaults.some(v => v.userShares && v.userShares > BigInt(0));
  const isLoadingVaults = vaults.some(v => v.isLoading);

  // Mock chart data
  const mockChartData = Array.from({ length: 30 }, (_, i) => ({
    date: `Day ${i + 1}`,
    value: 10000 + (i * 80) + (Math.sin(i) * 400) + (Math.random() * 200),
    change: `+${(Math.random() * 2).toFixed(1)}%`
  }));

  // Mock activity (needs backend indexer)
  const activityFeed = [
    { type: 'info', icon: <Check className="w-4 h-4 text-[#6B6B6B]" />, text: 'Activity feed requires backend indexer', time: '—' },
  ];

  // Lock time remaining
  const lockEnd = staking.lockEnd;
  const now = BigInt(Math.floor(Date.now() / 1000));
  const lockRemaining = lockEnd && lockEnd > now ? Number(lockEnd - now) : 0;
  const lockDays = Math.ceil(lockRemaining / 86400);
  const boostPct = staking.boostBps ? (staking.boostBps / 100) : 0;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-[#00FF66] selection:text-black pb-24 md:pb-0">
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Space+Grotesk:wght@700&display=swap');
        .font-sans { font-family: 'Space Grotesk', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        @keyframes glitch-h { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(100%); } }
        .animate-glitch-h { animation: glitch-h 3s linear infinite; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0A0A0A; }
        ::-webkit-scrollbar-thumb { background: #333; }
        ::-webkit-scrollbar-thumb:hover { background: #00FF66; }
      `}} />

      <Navbar />
      <MobileNav />

      <main className="max-w-5xl mx-auto px-4 md:px-6 pt-24 pb-12 md:pb-24">
        {isConnected ? (
          <>
            {/* SECTION 1: PORTFOLIO OVERVIEW */}
            <SectionHeader title="PORTFOLIO OVERVIEW" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
              <StatCard label="PORTFOLIO VALUE" value={`$${formatNumber(totalPortfolioValue)}`} sub={`Vaults + Staked GDN`} index={0} isLoading={isLoadingVaults} />
              <StatCard label="VAULT PNL" value={`${totalPnl >= 0 ? '+' : ''}$${formatNumber(totalPnl)}`} sub={totalDeposited > 0 ? `${totalPnl >= 0 ? '+' : ''}${totalPnlPct.toFixed(1)}%` : 'No deposits'} color={totalPnl >= 0 ? 'text-[#00FF66]' : 'text-[#FF3B3B]'} index={1} isLoading={isLoadingVaults} />
              <StatCard label="STAKED GDN" value={`${formatNumber(stakedNum, 0)} GDN`} sub={stakedValue > 0 ? `≈$${formatNumber(stakedValue)}` : 'Not staking'} index={2} isLoading={staking.isLoading} />
              <StatCard label="PENDING REWARDS" value={`${formatNumber(pendingRewardsNum, 2)} GDN`} sub={pendingRewardsNum > 0 ? `≈$${formatNumber(pendingRewardsNum * gdnPrice)}` : 'No rewards yet'} color="text-[#00FF66]" index={3} isLoading={staking.isLoading} />
            </div>

            {/* SECTION 2: ACTIVE POSITIONS */}
            <SectionHeader title="ACTIVE POSITIONS" />
            <div className="mb-16">
              {hasAnyPosition ? (
                <>
                  <div className="hidden md:grid grid-cols-12 gap-4 border-b border-[#333] pb-2 mb-2 font-mono text-[10px] text-[#6B6B6B] uppercase tracking-widest px-4">
                    <div className="col-span-3">VAULT</div>
                    <div className="col-span-2 text-right">DEPOSITED</div>
                    <div className="col-span-2 text-right">CURRENT VALUE</div>
                    <div className="col-span-2 text-right">PNL</div>
                    <div className="col-span-3 text-right">ACTION</div>
                  </div>
                  <div className="flex flex-col gap-4 md:gap-0">
                    {VAULT_CONFIG.map((vc, i) => (
                      <VaultPositionRow key={vc.slug} vaultConfig={vc} index={i} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="bg-[#111] border border-[#333] p-8 text-center">
                  <div className="font-mono text-sm text-[#6B6B6B] mb-4">No active vault positions</div>
                  <Link href="/vaults" className="inline-flex items-center gap-2 bg-[#00FF66] text-black font-mono text-sm font-bold px-6 py-3 hover:bg-[#00DD55] transition-colors">
                    Explore Vaults <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}

              {/* Staking position */}
              {stakedNum > 0 && (
                <div className="mt-4 bg-[#111] border border-[#333] p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Zap className="w-4 h-4 text-[#00FF66]" />
                    <span className="font-mono text-xs text-[#6B6B6B] uppercase tracking-widest">Staking Position</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-sm">
                    <div>
                      <div className="text-[#6B6B6B] text-[10px] uppercase mb-1">Staked</div>
                      <div className="text-white">{formatNumber(stakedNum, 2)} GDN</div>
                    </div>
                    <div>
                      <div className="text-[#6B6B6B] text-[10px] uppercase mb-1">Lock Remaining</div>
                      <div className="text-white">{lockDays > 0 ? `${lockDays} days` : 'Unlocked'}</div>
                    </div>
                    <div>
                      <div className="text-[#6B6B6B] text-[10px] uppercase mb-1">Boost</div>
                      <div className="text-[#00FF66]">{boostPct > 0 ? `${boostPct}%` : 'None'}</div>
                    </div>
                    <div>
                      <div className="text-[#6B6B6B] text-[10px] uppercase mb-1">Pending Rewards</div>
                      <div className="text-[#00FF66]">{formatNumber(pendingRewardsNum, 4)} GDN</div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Link href="/stake" className="text-xs font-mono text-[#6B6B6B] hover:text-[#00FF66] transition-colors uppercase tracking-widest flex items-center gap-1 group">
                      [Manage Stake <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />]
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* LOWER GRID: RECENT ACTIVITY & PERFORMANCE */}
            <div className="grid lg:grid-cols-2 gap-16">
              {/* SECTION 3: RECENT ACTIVITY (mock — needs indexer) */}
              <div>
                <SectionHeader title="RECENT ACTIVITY" />
                <div className="bg-[#111] border border-[#333] p-1 font-mono text-xs overflow-hidden">
                  {activityFeed.map((item, i) => (
                    <ActivityItem key={i} item={item} index={i} />
                  ))}
                  <div className="p-3 text-[#6B6B6B] text-center italic">
                    Activity history requires a backend indexer
                  </div>
                </div>
              </div>

              {/* SECTION 4: PORTFOLIO PERFORMANCE (mock — needs historical data) */}
              <div>
                <SectionHeader title="PORTFOLIO PERFORMANCE" />
                <div className="bg-[#111] border border-[#333] p-4">
                  <div className="flex justify-between items-center mb-6">
                    <span className="font-mono text-[10px] text-[#6B6B6B] italic">Mock data</span>
                    <div className="flex gap-2 font-mono text-[10px] uppercase tracking-widest">
                      {['7D', '30D', '90D', 'ALL'].map(period => (
                        <button key={period} onClick={() => setChartPeriod(period)} className={`px-3 py-1 transition-colors ${chartPeriod === period ? 'bg-[#333] text-white' : 'text-[#6B6B6B] hover:text-white'}`}>
                          [{period}]
                        </button>
                      ))}
                    </div>
                  </div>
                  <PerformanceChart data={mockChartData} />
                </div>
              </div>
            </div>
          </>
        ) : (
          /* NOT CONNECTED STATE */
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-16 h-16 border border-[#333] bg-[#111] rounded-full flex items-center justify-center mb-6">
              <Wallet className="w-6 h-6 text-[#6B6B6B]" />
            </div>
            <h2 className="font-mono text-sm text-[#6B6B6B] uppercase tracking-widest mb-4">
              &gt; CONNECT YOUR WALLET
            </h2>
            <p className="text-[#E0E0E0] max-w-sm mb-8">
              Connect your wallet to view your portfolio, vault positions, and staking rewards.
            </p>
            <ConnectButton />
          </div>
        )}
      </main>
    </div>
  );
}
