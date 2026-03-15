'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import ConnectButton from '@/components/ConnectButton';
import Navbar from '@/components/Navbar';
import MobileNav from '@/components/MobileNav';
import {
  ChevronDown, ExternalLink, Copy, Power, Activity, ArrowUpRight, ArrowLeft, ArrowRight,
  LayoutDashboard, Layers, Trophy, Coins, Check, Clock, AlertTriangle, Zap
} from 'lucide-react';
import { DepositModal } from '../../../components/DepositModal';
import { WithdrawModal } from '../../../components/WithdrawModal';
import { useVault, useConvertToAssets } from '@/hooks/useVault';
import { useToken } from '@/hooks/useToken';
import { useAccount } from 'wagmi';
import { type Address, formatUnits } from 'viem';
import { usePublicVault } from '@/hooks/usePublicData';

// --- HOOKS ---

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

const useOnClickOutside = (ref: React.RefObject<any>, handler: (e: any) => void) => {
  useEffect(() => {
    const listener = (e: any) => { if (!ref.current || ref.current.contains(e.target)) return; handler(e); };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => { document.removeEventListener('mousedown', listener); document.removeEventListener('touchstart', listener); };
  }, [ref, handler]);
};

// --- COMPONENTS ---

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

const RiskBar = ({ level }: { level: number }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map(i => (
      <div key={i} className={`h-1.5 w-3 ${i <= level ? (level <= 2 ? 'bg-[#00FF66]' : level <= 3 ? 'bg-yellow-500' : 'bg-[#FF3B3B]') : 'bg-[#333]'}`} />
    ))}
  </div>
);

// --- PERFORMANCE CHART ---

const PerformanceChart = ({ data, benchmarkData }: { data: number[]; benchmarkData: number[] }) => {
  const [hoveredPoint, setHoveredPoint] = useState<any>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);
  useEffect(() => {
    const update = () => { if (chartRef.current) setWidth(chartRef.current.clientWidth); };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const height = 280;
  const pad = { top: 20, right: 20, bottom: 30, left: 60 };
  const allVals = [...data, ...benchmarkData];
  const minV = Math.min(...allVals) * 0.95;
  const maxV = Math.max(...allVals) * 1.05;
  const getX = (i: number) => pad.left + (i / (data.length - 1)) * (width - pad.left - pad.right);
  const getY = (v: number) => height - pad.bottom - ((v - minV) / (maxV - minV)) * (height - pad.top - pad.bottom);

  const pathD = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d)}`).join(' ');
  const areaD = `${pathD} L ${getX(data.length - 1)} ${height - pad.bottom} L ${getX(0)} ${height - pad.bottom} Z`;
  const benchPath = benchmarkData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d)}`).join(' ');

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!chartRef.current) return;
    const rect = chartRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const cw = rect.width - pad.left - pad.right;
    const rx = Math.max(0, Math.min(x - pad.left, cw));
    const idx = Math.round((rx / cw) * (data.length - 1));
    if (idx >= 0 && idx < data.length) {
      setHoveredPoint({ x: getX(idx), y: getY(data[idx]), value: data[idx], bench: benchmarkData[idx], day: idx + 1 });
    }
  };

  return (
    <div className="relative w-full h-[280px]" ref={chartRef} onMouseMove={handleMouseMove} onMouseLeave={() => setHoveredPoint(null)}>
      <svg className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="vaultGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00FF66" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#00FF66" stopOpacity="0" />
          </linearGradient>
          <pattern id="gridP" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#222" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#gridP)" />
        <g className="font-mono text-[10px] fill-[#6B6B6B]">
          {[0, 0.25, 0.5, 0.75, 1].map(r => {
            const val = minV + (maxV - minV) * r;
            const y = height - pad.bottom - r * (height - pad.top - pad.bottom);
            return (
              <g key={r}>
                <line x1={pad.left - 5} y1={y} x2="100%" y2={y} stroke="#222" strokeWidth="1" strokeDasharray="2,2" />
                <text x={pad.left - 10} y={y + 4} textAnchor="end">${(val / 1000).toFixed(1)}K</text>
              </g>
            );
          })}
        </g>
        <path d={benchPath} fill="none" stroke="#6B6B6B" strokeWidth="1.5" strokeDasharray="6,4" opacity="0.5" />
        <path d={areaD} fill="url(#vaultGrad)" />
        <path d={pathD} fill="none" stroke="#00FF66" strokeWidth="2" strokeLinejoin="round" />
        {hoveredPoint && (
          <g>
            <line x1={hoveredPoint.x} y1={pad.top} x2={hoveredPoint.x} y2={height - pad.bottom} stroke="#6B6B6B" strokeWidth="1" strokeDasharray="4,4" />
            <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="4" fill="#0A0A0A" stroke="#00FF66" strokeWidth="2" />
          </g>
        )}
      </svg>
      {hoveredPoint && (
        <div className="absolute pointer-events-none bg-[#111] border border-[#333] p-3 shadow-[0_0_15px_rgba(0,255,102,0.1)] z-10" style={{ left: Math.min(hoveredPoint.x + 15, width - 160), top: Math.max(pad.top, hoveredPoint.y - 70) }}>
          <div className="text-[#6B6B6B] font-mono text-[10px] mb-1">Day {hoveredPoint.day}</div>
          <div className="text-[#00FF66] font-mono font-bold text-sm">${hoveredPoint.value.toLocaleString()}</div>
          <div className="text-[#6B6B6B] font-mono text-[10px] mt-1">Benchmark: ${hoveredPoint.bench.toLocaleString()}</div>
        </div>
      )}
      <div className="absolute top-2 right-2 flex gap-4 font-mono text-[10px] text-[#6B6B6B]">
        <span className="flex items-center gap-1"><span className="w-3 h-[2px] bg-[#00FF66] inline-block" /> Vault</span>
        <span className="flex items-center gap-1"><span className="w-3 h-[2px] bg-[#6B6B6B] inline-block border-dashed" style={{borderBottom: '1.5px dashed #6B6B6B', height: 0}} /> Benchmark</span>
      </div>
    </div>
  );
};

// --- JSON SYNTAX HIGHLIGHTER ---

const JsonTerminal = ({ vaultSlug, data }: { vaultSlug: string; data: Record<string, any> }) => {
  const renderJson = (obj: any, indent: number = 0): React.ReactNode[] => {
    const lines: React.ReactNode[] = [];
    const pad = '  '.repeat(indent);
    const entries = Object.entries(obj);
    entries.forEach(([key, value], i) => {
      const comma = i < entries.length - 1 ? ',' : '';
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        lines.push(<div key={`${indent}-${key}-open`}>{pad}  <span className="text-[#6B6B6B]">&quot;{key}&quot;</span>: {'{'}</div>);
        lines.push(...renderJson(value, indent + 1));
        lines.push(<div key={`${indent}-${key}-close`}>{pad}  {'}'}{comma}</div>);
      } else if (typeof value === 'string') {
        lines.push(<div key={`${indent}-${key}`}>{pad}  <span className="text-[#6B6B6B]">&quot;{key}&quot;</span>: <span className="text-[#00FF66]">&quot;{value}&quot;</span>{comma}</div>);
      } else if (typeof value === 'number') {
        lines.push(<div key={`${indent}-${key}`}>{pad}  <span className="text-[#6B6B6B]">&quot;{key}&quot;</span>: <span className="text-white">{value}</span>{comma}</div>);
      } else if (typeof value === 'boolean') {
        lines.push(<div key={`${indent}-${key}`}>{pad}  <span className="text-[#6B6B6B]">&quot;{key}&quot;</span>: <span className="text-[#FFD700]">{value.toString()}</span>{comma}</div>);
      }
    });
    return lines;
  };

  return (
    <div className="bg-[#0A0A0A] border border-[#333] p-5 font-mono text-xs md:text-sm overflow-x-auto">
      <div className="flex gap-2 mb-4 border-b border-[#333] pb-2">
        <div className="w-3 h-3 bg-[#333]" />
        <div className="w-3 h-3 bg-[#333]" />
        <div className="w-3 h-3 bg-[#00FF66]/50" />
        <span className="text-[#6B6B6B] text-[10px] ml-2 tracking-widest uppercase">strategy.json</span>
      </div>
      <div className="text-[#00FF66] mb-2">gordon@{vaultSlug}-vault:~$ <span className="text-white">cat strategy.json</span></div>
      <div className="text-[#E0E0E0]">
        <div>{'{'}</div>
        {renderJson(data)}
        <div>{'}'}</div>
      </div>
      <div className="mt-2 text-[#00FF66]">gordon@{vaultSlug}-vault:~$ <span className="inline-block w-2 h-4 bg-[#00FF66] animate-pulse align-middle" /></div>
    </div>
  );
};

// --- MOCK STRATEGY DATA (needs backend) ---

const STRATEGY_DATA: Record<string, any> = {
  crypto: {
    name: "Crypto Vault", version: "1.0.0", tracking: "top_50_crypto_traders",
    criteria: { min_win_rate: 0.65, min_roi_90d: 1.5, min_volume_30d: "$50K" },
    execution: { max_position_size: 0.05, rebalance_interval: "4h" },
    risk: { stop_loss: -0.15, max_drawdown: -0.20, circuit_breaker: true },
    fees: { performance: 0.20, deposit: "on-chain", withdrawal: "on-chain" },
  },
  sport: {
    name: "Sport Vault", version: "1.0.0", tracking: "sports_prediction_markets",
    criteria: { min_win_rate: 0.60, focus: "major_leagues" },
    execution: { max_position_size: 0.08, rebalance_interval: "6h" },
    risk: { stop_loss: -0.20, max_drawdown: -0.25, circuit_breaker: true },
    fees: { performance: 0.20, deposit: "on-chain", withdrawal: "on-chain" },
  },
  finance: {
    name: "Finance Vault", version: "1.0.0", tracking: "macro_financial_markets",
    criteria: { min_win_rate: 0.70, strategy_type: "macro_neutral" },
    execution: { max_position_size: 0.04, rebalance_interval: "2h" },
    risk: { stop_loss: -0.10, max_drawdown: -0.15, circuit_breaker: true },
    fees: { performance: 0.20, deposit: "on-chain", withdrawal: "on-chain" },
  },
  politic: {
    name: "Politic Vault", version: "1.0.0", tracking: "political_prediction_markets",
    criteria: { min_win_rate: 0.55, high_conviction: true },
    execution: { max_position_size: 0.15, rebalance_interval: "12h" },
    risk: { stop_loss: -0.30, max_drawdown: -0.40, circuit_breaker: true },
    fees: { performance: 0.20, deposit: "on-chain", withdrawal: "on-chain" },
  },
};

// Generate mock chart data
const genChartData = (base: number, volatility: number, trend: number, days: number) =>
  Array.from({ length: days }, (_, i) => Math.round(base + trend * i + Math.sin(i * 0.5) * volatility + (Math.random() - 0.4) * volatility * 0.5));

// --- MAIN ---

export default function VaultDetailPage({ params }: { params: { id: string } }) {
  const { data: vaultApiData, isLoading: apiLoading } = usePublicVault(params.id);
  const { address, isConnected } = useAccount();

  // Build config from API data
  const vaultConfig = vaultApiData ? {
    address: (vaultApiData.ethAddress || '0x0000000000000000000000000000000000000000') as Address,
    name: vaultApiData.name,
    subtitle: vaultApiData.description || vaultApiData.categories?.join(' · ') || '',
    tags: (vaultApiData.categories || []).map((c: string) => c.toUpperCase()),
    riskLevel: 2,
    shareSymbol: `g${params.id.toUpperCase().slice(0, 6)}`,
  } : null;
  const vaultAddress = vaultConfig?.address || ('0x0000000000000000000000000000000000000000' as Address);
  const vault = useVault(vaultAddress);
  const { balance: usdcBalance } = useToken('USDC');
  const userAssetsValue = useConvertToAssets(vaultAddress, vault.userShares);

  const [chartPeriod, setChartPeriod] = useState('30D');
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  }, []);

  // Chart data (mock — needs backend)
  const days = chartPeriod === '7D' ? 7 : chartPeriod === '30D' ? 30 : chartPeriod === '90D' ? 90 : 180;
  const vaultChart = genChartData(10000, 400, 80, days);
  const benchChart = genChartData(10000, 200, 30, days);

  if (apiLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="font-mono text-[#6B6B6B] text-xs uppercase tracking-widest animate-pulse">&gt; LOADING VAULT...</div>
      </div>
    );
  }

  if (!vaultConfig) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="font-mono text-[#6B6B6B] text-xs uppercase tracking-widest mb-4">&gt; VAULT NOT FOUND</div>
          <Link href="/vaults" className="text-[#00FF66] font-mono text-sm hover:underline">← Back to Vaults</Link>
        </div>
      </div>
    );
  }

  // Format on-chain values
  const tvl = vault.totalAssets ? parseFloat(formatUnits(vault.totalAssets, 6)) : 0;
  const userSharesNum = vault.userShares ? parseFloat(formatUnits(vault.userShares, 6)) : 0;
  const userValueNum = userAssetsValue ? parseFloat(formatUnits(userAssetsValue, 6)) : 0;
  const usdcBalanceNum = usdcBalance ? parseFloat(formatUnits(usdcBalance, 6)) : 0;
  const depositFeePct = vault.depositFeeBps ? Number(vault.depositFeeBps) / 100 : 0;
  const withdrawFeePct = vault.withdrawFeeBps ? Number(vault.withdrawFeeBps) / 100 : 0;
  const sharePriceNum = vault.sharePrice ? parseFloat(formatUnits(vault.sharePrice, 6)) : 1;
  const hasPosition = isConnected && userSharesNum > 0;

  const formatUSD = (n: number) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(2)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
    return `$${n.toFixed(2)}`;
  };

  const handleDepositSuccess = () => {
    showToast('Deposit successful!');
    vault.refetchUserShares();
    vault.refetchTotalAssets();
    vault.refetchUserPosition();
  };

  const handleWithdrawSuccess = () => {
    showToast('Withdrawal successful!');
    vault.refetchUserShares();
    vault.refetchTotalAssets();
    vault.refetchUserPosition();
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-[#00FF66] selection:text-black pb-24 md:pb-12">
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Space+Grotesk:wght@700&display=swap');
        .font-sans { font-family: 'Space Grotesk', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
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

        {/* BACK LINK */}
        <Link href="/vaults" className="inline-flex items-center gap-2 text-[#6B6B6B] hover:text-[#00FF66] font-mono text-xs uppercase tracking-widest mb-8 transition-colors">
          <ArrowLeft className="w-3 h-3" /> Back to Vaults
        </Link>

        {/* HERO HEADER */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-sans font-bold text-2xl md:text-3xl text-white">{vaultConfig.name}</h1>
                <span className="font-mono text-[10px] px-2 py-0.5 bg-[#00FF66]/10 text-[#00FF66] uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-pulse" /> LIVE
                </span>
              </div>
              <div className="font-mono text-xs text-[#6B6B6B] uppercase tracking-widest mb-3">{vaultConfig.subtitle}</div>
              <div className="flex flex-wrap gap-1.5">
                {vaultConfig.tags.map((tag: string) => (
                  <span key={tag} className="font-mono text-[9px] px-2 py-0.5 border border-[#333] text-[#6B6B6B] uppercase tracking-widest">{tag}</span>
                ))}
              </div>
            </div>
            <div className="text-left md:text-right">
              <div className="font-mono text-[10px] text-[#6B6B6B] uppercase tracking-widest mb-1">Share Price</div>
              <div className="font-sans font-bold text-2xl text-[#00FF66]">${sharePriceNum.toFixed(4)}</div>
            </div>
          </div>
        </div>

        {/* YOUR POSITION / CONNECT CTA */}
        {hasPosition ? (
          <div className="bg-[#111] border border-[#333] border-l-2 border-l-[#00FF66] p-5 mb-8">
            <div className="font-mono text-[10px] text-[#00FF66] uppercase tracking-widest mb-4">YOUR POSITION</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <div className="font-mono text-[9px] text-[#6B6B6B] uppercase tracking-widest mb-1">Shares</div>
                <div className="font-mono text-lg text-white">{userSharesNum.toFixed(2)}</div>
              </div>
              <div>
                <div className="font-mono text-[9px] text-[#6B6B6B] uppercase tracking-widest mb-1">Value (USDC)</div>
                <div className="font-mono text-lg text-white">{formatUSD(userValueNum)}</div>
              </div>
              <div>
                <div className="font-mono text-[9px] text-[#6B6B6B] uppercase tracking-widest mb-1">USDC Balance</div>
                <div className="font-mono text-lg text-white">{formatUSD(usdcBalanceNum)}</div>
              </div>
              <div>
                <div className="font-mono text-[9px] text-[#6B6B6B] uppercase tracking-widest mb-1">Risk Level</div>
                <RiskBar level={vaultConfig.riskLevel} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 max-w-xs">
              <button onClick={() => setDepositOpen(true)} className="py-2.5 bg-[#00FF66] text-black font-mono font-bold text-xs uppercase tracking-wider hover:bg-white transition-colors">Deposit More</button>
              <button onClick={() => setWithdrawOpen(true)} className="py-2.5 border border-[#333] text-white font-mono text-xs uppercase tracking-widest hover:border-[#00FF66] hover:text-[#00FF66] transition-colors">Withdraw</button>
            </div>
          </div>
        ) : isConnected ? (
          <div className="bg-[#111] border border-[#333] p-6 mb-8 text-center">
            <div className="font-mono text-xs text-[#6B6B6B] uppercase tracking-widest mb-2">No Position Yet</div>
            {usdcBalanceNum > 0 && (
              <div className="font-mono text-[10px] text-[#6B6B6B] mb-3">Wallet: {formatUSD(usdcBalanceNum)} USDC</div>
            )}
            <button onClick={() => setDepositOpen(true)} className="bg-[#00FF66] text-black font-mono font-bold text-xs px-6 py-3 uppercase tracking-wider hover:bg-white transition-colors inline-flex items-center gap-2">
              Deposit <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="bg-[#111] border border-[#333] p-6 mb-8 text-center">
            <div className="font-mono text-xs text-[#6B6B6B] uppercase tracking-widest mb-3">Connect wallet to deposit</div>
            <ConnectButton />
          </div>
        )}

        {/* VAULT STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
          {[
            { label: 'Total TVL', value: formatUSD(tvl) },
            { label: 'Share Price', value: `$${sharePriceNum.toFixed(4)}` },
            { label: 'Deposit Fee', value: `${depositFeePct.toFixed(2)}%` },
            { label: 'Withdrawal Fee', value: `${withdrawFeePct.toFixed(2)}%` },
            { label: 'Risk Level', value: `${vaultConfig.riskLevel}/5` },
            { label: 'Vault Contract', value: `${vaultAddress.slice(0, 6)}...${vaultAddress.slice(-4)}`, color: 'text-[#6B6B6B]' },
            { label: '30D APY', value: 'TBD', color: 'text-[#6B6B6B]' },
            { label: 'All-time APY', value: 'TBD', color: 'text-[#6B6B6B]' },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#111] border border-[#333] p-4 hover:border-[#6B6B6B] transition-colors">
              <div className="font-mono text-[9px] text-[#6B6B6B] uppercase tracking-widest mb-2">{stat.label}</div>
              <div className={`font-sans font-bold text-lg ${stat.color || 'text-white'}`}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* STRATEGY */}
        <SectionHeader title="STRATEGY" />
        <div className="mb-12">
          <JsonTerminal vaultSlug={params.id} data={STRATEGY_DATA[params.id] || {}} />
        </div>

        {/* PERFORMANCE (mock) */}
        <SectionHeader title="PERFORMANCE" />
        <div className="bg-[#111] border border-[#333] p-4 mb-12">
          <div className="flex items-center justify-between mb-4">
            <div className="font-mono text-[10px] text-[#6B6B6B] uppercase tracking-widest">Mock data — backend needed</div>
            <div className="flex gap-2 font-mono text-[10px] uppercase tracking-widest">
              {['7D', '30D', '90D', 'ALL'].map(p => (
                <button key={p} onClick={() => setChartPeriod(p)} className={`px-3 py-1 transition-colors ${chartPeriod === p ? 'bg-[#333] text-white' : 'text-[#6B6B6B] hover:text-white'}`}>
                  [{p}]
                </button>
              ))}
            </div>
          </div>
          <PerformanceChart data={vaultChart} benchmarkData={benchChart} />
        </div>

        {/* RISK DISCLAIMER */}
        <div className="bg-[#111] border border-[#333] border-l-2 border-l-yellow-500 p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
          <p className="font-mono text-xs text-[#6B6B6B] leading-relaxed">
            Past performance does not guarantee future results. Prediction markets are volatile and carry significant risk. Never deposit more than you can afford to lose. Gordon.fi does not provide financial advice.
          </p>
        </div>
      </main>

      <Toast message={toastMessage} visible={toastVisible} />
      <DepositModal isOpen={depositOpen} onClose={() => setDepositOpen(false)} vaultAddress={vaultAddress} vaultName={vaultConfig.name} shareSymbol={vaultConfig.shareSymbol} onSuccess={handleDepositSuccess} />
      <WithdrawModal isOpen={withdrawOpen} onClose={() => setWithdrawOpen(false)} vaultAddress={vaultAddress} vaultName={vaultConfig.name} shareSymbol={vaultConfig.shareSymbol} onSuccess={handleWithdrawSuccess} />
    </div>
  );
}
