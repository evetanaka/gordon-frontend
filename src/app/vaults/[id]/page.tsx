'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  ChevronDown, ExternalLink, Copy, Power, Activity, ArrowUpRight, ArrowLeft, ArrowRight,
  LayoutDashboard, Layers, Trophy, Coins, Check, Clock, AlertTriangle, Zap
} from 'lucide-react';
import { DepositModal } from '../../../components/DepositModal';
import { WithdrawModal } from '../../../components/WithdrawModal';

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
      const ease = 1 - Math.pow(1 - pct, 5);
      setCount(start + (end - start) * ease);
      if (pct < 1) requestAnimationFrame(animate);
      else setCount(end);
    };
    requestAnimationFrame(animate);
  }, [isVisible, end, duration, start]);
  const formatted = count.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return [ref, `${prefix}${formatted}${suffix}`] as const;
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

// --- MOCK DATA ---

const VAULTS: Record<string, any> = {
  alpha: {
    id: 'alpha', name: 'Alpha Vault', subtitle: 'Top 50 Traders · Diversified', status: 'live',
    tags: ['DIVERSIFIED', 'AUTO-COMPOUND', 'BLUE CHIP'],
    apy30d: 47.2, apyAllTime: 89.4, tvl: 2400000, depositors: 342,
    maxDrawdown: -12.3, sharpeRatio: 2.41, winRate: 74.8, activeBets: 18, riskLevel: 2,
    strategy: {
      name: "Alpha Vault", version: "1.2.0", tracking: "top_50_wallets",
      criteria: { min_win_rate: 0.65, min_roi_90d: 1.5, min_volume_30d: "$50K", min_history: "60_days" },
      execution: { max_position_size: 0.05, max_single_market: 0.15, rebalance_interval: "4h", slippage_tolerance: 0.02 },
      risk: { stop_loss: -0.15, max_drawdown: -0.20, circuit_breaker: true },
      fees: { performance: 0.20, management: 0, deposit: 0, withdrawal: 0 },
      compound: "auto"
    },
    userPosition: { deposited: 8000, currentValue: 9847, pnl: 1847, roi: 23.1, change24h: 2.4, since: '14 days ago', shares: '7,892 gALPHA' },
    positions: [
      { market: 'Trump wins 2026', side: 'YES', size: 420000, source: '0x71C...49A2', pnl: 12.4 },
      { market: 'ETH > $5K by June', side: 'NO', size: 180000, source: '0x4B2...11F8', pnl: 8.1 },
      { market: 'Fed cuts rates May', side: 'YES', size: 95000, source: '0x99A...CC42', pnl: 3.2 },
      { market: 'BTC > $150K Q2', side: 'YES', size: 74000, source: '0x71C...49A2', pnl: -2.1 },
      { market: 'SOL flips ETH', side: 'NO', size: 62000, source: '0x3D1...7E90', pnl: 5.7 },
      { market: 'Vitalik resigns', side: 'NO', size: 41000, source: '0x4B2...11F8', pnl: 18.3 },
      { market: 'US recession 2026', side: 'YES', size: 38000, source: '0x99A...CC42', pnl: 1.4 },
      { market: 'OpenAI IPO Q2', side: 'YES', size: 29000, source: '0xF82...3A01', pnl: -0.8 },
      { market: 'Apple buys Disney', side: 'NO', size: 22000, source: '0x71C...49A2', pnl: 4.2 },
      { market: 'Bitcoin ETF 2x inflows', side: 'YES', size: 18000, source: '0x3D1...7E90', pnl: 6.1 },
    ],
    trades: [
      { time: '2m ago', action: 'BUY', side: 'YES', market: 'Trump wins 2026', source: '0x71C...', amount: 42000 },
      { time: '15m ago', action: 'SELL', side: 'NO', market: 'ETH > $5K by June', source: '0x4B2...', amount: 18000 },
      { time: '1h ago', action: 'BUY', side: 'YES', market: 'Fed cuts rates May', source: '0x99A...', amount: 12000 },
      { time: '3h ago', action: 'BUY', side: 'NO', market: 'SOL flips ETH', source: '0x3D1...', amount: 8400 },
      { time: '6h ago', action: 'SELL', side: 'YES', market: 'BTC > $150K Q2', source: '0x71C...', amount: 22000 },
    ],
    wallets: [
      { address: '0x71C7...49A2', rank: 1, winRate: 84.2, roi90d: 247, followedSince: '47 days', signalShare: 32, volume: '$2.1M', topMarkets: ['Trump wins', 'ETH > $5K', 'Fed rates'] },
      { address: '0x4B27...11F8', rank: 2, winRate: 79.1, roi90d: 189, followedSince: '35 days', signalShare: 24, volume: '$1.6M', topMarkets: ['Vitalik resigns', 'ETH > $5K'] },
      { address: '0x99A3...CC42', rank: 3, winRate: 77.8, roi90d: 156, followedSince: '28 days', signalShare: 18, volume: '$980K', topMarkets: ['Fed rates', 'US recession'] },
    ],
  },
  degen: {
    id: 'degen', name: 'Degen Vault', subtitle: 'Top 5 Whales · High Conviction', status: 'live',
    tags: ['HIGH RISK', 'WHALE TRACK', 'CONCENTRATED'],
    apy30d: 89.1, apyAllTime: 214.7, tvl: 890000, depositors: 89,
    maxDrawdown: -38.2, sharpeRatio: 1.62, winRate: 68.4, activeBets: 7, riskLevel: 4,
    strategy: {
      name: "Degen Vault", version: "2.0.1", tracking: "top_5_whales",
      criteria: { min_win_rate: 0.60, min_roi_90d: 3.0, min_volume_30d: "$500K", min_history: "90_days" },
      execution: { max_position_size: 0.20, max_single_market: 0.40, rebalance_interval: "1h", slippage_tolerance: 0.05 },
      risk: { stop_loss: -0.30, max_drawdown: -0.45, circuit_breaker: true },
      fees: { performance: 0.20, management: 0, deposit: 0, withdrawal: 0 },
      compound: "auto"
    },
    userPosition: { deposited: 4400, currentValue: 5400, pnl: 1000, roi: 22.7, change24h: -1.2, since: '7 days ago', shares: '4,180 gDEGEN' },
    positions: [
      { market: 'BTC > $200K 2026', side: 'YES', size: 280000, source: '0xA1F...88D3', pnl: 28.4 },
      { market: 'ETH flippening', side: 'YES', size: 190000, source: '0xB3C...22E1', pnl: -8.7 },
      { market: 'Solana > $500', side: 'YES', size: 140000, source: '0xA1F...88D3', pnl: 15.2 },
      { market: 'Fed emergency cut', side: 'NO', size: 95000, source: '0xD4E...9F27', pnl: 6.1 },
      { market: 'DOGE > $1', side: 'YES', size: 72000, source: '0xB3C...22E1', pnl: -12.3 },
    ],
    trades: [
      { time: '5m ago', action: 'BUY', side: 'YES', market: 'BTC > $200K 2026', source: '0xA1F...', amount: 85000 },
      { time: '42m ago', action: 'SELL', side: 'YES', market: 'ETH flippening', source: '0xB3C...', amount: 44000 },
      { time: '2h ago', action: 'BUY', side: 'NO', market: 'Fed emergency cut', source: '0xD4E...', amount: 32000 },
      { time: '8h ago', action: 'BUY', side: 'YES', market: 'DOGE > $1', source: '0xB3C...', amount: 72000 },
    ],
    wallets: [
      { address: '0xA1F9...88D3', rank: 1, winRate: 72.4, roi90d: 412, followedSince: '62 days', signalShare: 38, volume: '$8.4M', topMarkets: ['BTC > $200K', 'Solana > $500'] },
      { address: '0xB3C2...22E1', rank: 2, winRate: 69.8, roi90d: 287, followedSince: '45 days', signalShare: 28, volume: '$5.1M', topMarkets: ['ETH flippening', 'DOGE > $1'] },
      { address: '0xD4E7...9F27', rank: 3, winRate: 71.2, roi90d: 198, followedSince: '30 days', signalShare: 22, volume: '$3.2M', topMarkets: ['Fed emergency cut', 'Rate hike'] },
    ],
  },
  stable: {
    id: 'stable', name: 'Stable Vault', subtitle: 'Market Neutral · Low Volatility', status: 'soon',
    tags: ['LOW RISK', 'DELTA NEUTRAL', 'STABLE'],
    apy30d: 12.5, apyAllTime: 0, tvl: 0, depositors: 0,
    maxDrawdown: 0, sharpeRatio: 0, winRate: 0, activeBets: 0, riskLevel: 1,
    strategy: {
      name: "Stable Vault", version: "0.1.0-beta", tracking: "top_100_delta_neutral",
      criteria: { min_win_rate: 0.70, max_volatility: 0.05, strategy_type: "market_neutral" },
      execution: { max_position_size: 0.02, hedge_ratio: 0.95, rebalance_interval: "2h" },
      risk: { stop_loss: -0.05, max_drawdown: -0.08, circuit_breaker: true },
      fees: { performance: 0.15, management: 0, deposit: 0, withdrawal: 0 },
      compound: "auto", status: "coming_soon"
    },
    userPosition: null, positions: [], trades: [], wallets: [],
  },
  momentum: {
    id: 'momentum', name: 'Momentum Vault', subtitle: 'Trend Following · Multi-Market', status: 'soon',
    tags: ['TREND', 'MULTI-MARKET', 'MOMENTUM'],
    apy30d: 63.8, apyAllTime: 0, tvl: 0, depositors: 0,
    maxDrawdown: 0, sharpeRatio: 0, winRate: 0, activeBets: 0, riskLevel: 3,
    strategy: {
      name: "Momentum Vault", version: "0.2.0-beta", tracking: "top_20_trend_followers",
      criteria: { min_win_rate: 0.60, momentum_window: "7d", min_roi_30d: 0.5 },
      execution: { max_position_size: 0.08, trend_confirmation: "2_sources", rebalance_interval: "6h" },
      risk: { stop_loss: -0.20, max_drawdown: -0.30, circuit_breaker: true },
      fees: { performance: 0.20, management: 0, deposit: 0, withdrawal: 0 },
      compound: "auto", status: "coming_soon"
    },
    userPosition: null, positions: [], trades: [], wallets: [],
  },
};

// Generate mock chart data
const genChartData = (base: number, volatility: number, trend: number, days: number) =>
  Array.from({ length: days }, (_, i) => Math.round(base + trend * i + Math.sin(i * 0.5) * volatility + (Math.random() - 0.4) * volatility * 0.5));

// --- MAIN ---

export default function VaultDetailPage({ params }: { params: { id: string } }) {
  const vault = VAULTS[params.id];

  const [isConnected, setIsConnected] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [chartPeriod, setChartPeriod] = useState('30D');
  const [showAllPositions, setShowAllPositions] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(dropdownRef, () => setDropdownOpen(false));

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

  // Chart data
  const days = chartPeriod === '7D' ? 7 : chartPeriod === '30D' ? 30 : chartPeriod === '90D' ? 90 : 180;
  const vaultChart = genChartData(10000, 400, 80, days);
  const benchChart = genChartData(10000, 200, 30, days);

  if (!vault) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="font-mono text-[#6B6B6B] text-xs uppercase tracking-widest mb-4">&gt; VAULT NOT FOUND</div>
          <Link href="/vaults" className="text-[#00FF66] font-mono text-sm hover:underline">← Back to Vaults</Link>
        </div>
      </div>
    );
  }

  const isSoon = vault.status === 'soon';
  const hasPosition = isConnected && vault.userPosition;
  const visiblePositions = showAllPositions ? vault.positions : vault.positions.slice(0, 8);
  const medals = ['🥇', '🥈', '🥉'];

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

      {/* NAVBAR */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#333]' : 'bg-transparent border-b border-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-mono font-bold text-xl tracking-tighter text-white cursor-pointer">
            GORDON<span className="text-[#00FF66]">.fi</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Vaults', href: '/vaults' },
              { label: 'Leaderboard', href: '/leaderboard' },
              { label: 'Stake', href: '/stake' },
              { label: '$GDN', href: '/token' },
            ].map(link => (
              <Link key={link.label} href={link.href} className={`font-mono text-xs uppercase tracking-widest relative group transition-colors ${link.label === 'Vaults' ? 'text-white' : 'text-[#6B6B6B] hover:text-[#00FF66]'}`}>
                {link.label}
                <span className={`absolute -bottom-1 left-0 h-[1px] transition-all duration-300 ${link.label === 'Vaults' ? 'w-full bg-white' : 'w-0 bg-[#00FF66] group-hover:w-full'}`} />
              </Link>
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
                    <button className="flex items-center gap-2 px-4 py-3 text-[#6B6B6B] hover:text-white hover:bg-[#222] text-left transition-colors"><Copy className="w-3 h-3" /> Copy Address</button>
                    <button className="flex items-center justify-between px-4 py-3 text-[#6B6B6B] hover:text-white hover:bg-[#222] text-left border-t border-[#222] transition-colors"><span className="flex items-center gap-2"><ExternalLink className="w-3 h-3" /> Etherscan</span><ArrowUpRight className="w-3 h-3" /></button>
                    <button className="flex items-center gap-2 px-4 py-3 text-[#6B6B6B] hover:text-white hover:bg-[#222] text-left border-t border-[#222] transition-colors"><Activity className="w-3 h-3" /> Switch Network</button>
                    <button onClick={() => { setIsConnected(false); setDropdownOpen(false); }} className="flex items-center gap-2 px-4 py-3 text-[#FF3B3B] hover:bg-[#FF3B3B]/10 text-left border-t border-[#222] transition-colors"><Power className="w-3 h-3" /> Disconnect</button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => setIsConnected(true)} className="bg-[#00FF66] text-black font-mono font-bold text-xs px-4 py-2 uppercase tracking-wider hover:bg-white transition-colors">Connect</button>
            )}
          </div>
        </div>
      </nav>

      {/* MOBILE BOTTOM NAV */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#0A0A0A] border-t border-[#333] z-50 flex justify-around items-center h-16 pb-safe">
        <Link href="/dashboard" className="flex flex-col items-center gap-1 text-[#6B6B6B]"><LayoutDashboard className="w-5 h-5" /><span className="font-mono text-[10px] tracking-widest uppercase">Dash</span></Link>
        <Link href="/vaults" className="flex flex-col items-center gap-1 text-white"><Layers className="w-5 h-5" /><span className="font-mono text-[10px] tracking-widest uppercase">Vaults</span></Link>
        <Link href="/stake" className="flex flex-col items-center gap-1 text-[#6B6B6B]"><Zap className="w-5 h-5" /><span className="font-mono text-[10px] tracking-widest uppercase">Stake</span></Link>
        <Link href="/token" className="flex flex-col items-center gap-1 text-[#6B6B6B]"><Coins className="w-5 h-5" /><span className="font-mono text-[10px] tracking-widest uppercase">$GDN</span></Link>
      </div>

      {/* MAIN */}
      <main className="max-w-5xl mx-auto px-4 md:px-6 pt-24 pb-12 md:pb-24">

        {/* BACK LINK */}
        <Link href="/vaults" className="inline-flex items-center gap-2 text-[#6B6B6B] hover:text-[#00FF66] font-mono text-xs uppercase tracking-widest mb-8 transition-colors">
          <ArrowLeft className="w-3 h-3" /> Back to Vaults
        </Link>

        {/* HERO HEADER */}
        <div className={`mb-8 ${isSoon ? 'opacity-70' : ''}`}>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-sans font-bold text-2xl md:text-3xl text-white">{vault.name}</h1>
                {isSoon ? (
                  <span className="font-mono text-[10px] px-2 py-0.5 bg-[#333] text-[#6B6B6B] uppercase tracking-widest">SOON</span>
                ) : (
                  <span className="font-mono text-[10px] px-2 py-0.5 bg-[#00FF66]/10 text-[#00FF66] uppercase tracking-widest flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-pulse" /> LIVE
                  </span>
                )}
              </div>
              <div className="font-mono text-xs text-[#6B6B6B] uppercase tracking-widest mb-3">{vault.subtitle}</div>
              <div className="flex flex-wrap gap-1.5">
                {vault.tags.map((tag: string) => (
                  <span key={tag} className="font-mono text-[9px] px-2 py-0.5 border border-[#333] text-[#6B6B6B] uppercase tracking-widest">{tag}</span>
                ))}
              </div>
            </div>
            {!isSoon && (
              <div className="text-left md:text-right">
                <div className="font-sans font-bold text-4xl text-[#00FF66]">{vault.apy30d}%</div>
                <div className="font-mono text-[10px] text-[#6B6B6B] uppercase tracking-widest">30D APY</div>
              </div>
            )}
          </div>
        </div>

        {/* SOON STATE */}
        {isSoon ? (
          <>
            <div className="bg-[#111] border border-[#333] p-8 text-center mb-12">
              <Clock className="w-8 h-8 text-[#6B6B6B] mx-auto mb-4" />
              <div className="font-mono text-xs text-[#6B6B6B] uppercase tracking-widest mb-2">Coming Soon</div>
              <p className="text-[#E0E0E0] text-sm max-w-md mx-auto mb-6">This vault is currently in development. Join the waitlist to be notified when it goes live.</p>
              <button onClick={() => showToast('Added to waitlist')} className="bg-[#00FF66] text-black font-mono font-bold text-xs px-6 py-3 uppercase tracking-wider hover:bg-white transition-colors">
                Join Waitlist
              </button>
            </div>

            <SectionHeader title="STRATEGY (PREVIEW)" />
            <div className="mb-12">
              <JsonTerminal vaultSlug={vault.id} data={vault.strategy} />
            </div>
          </>
        ) : (
          <>
            {/* YOUR POSITION / CONNECT CTA */}
            {hasPosition ? (
              <div className="bg-[#111] border border-[#333] border-l-2 border-l-[#00FF66] p-5 mb-8">
                <div className="font-mono text-[10px] text-[#00FF66] uppercase tracking-widest mb-4">YOUR POSITION</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="font-mono text-[9px] text-[#6B6B6B] uppercase tracking-widest mb-1">Deposited</div>
                    <div className="font-mono text-lg text-white">${vault.userPosition.deposited.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="font-mono text-[9px] text-[#6B6B6B] uppercase tracking-widest mb-1">Current Value</div>
                    <div className="font-mono text-lg text-white">${vault.userPosition.currentValue.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="font-mono text-[9px] text-[#6B6B6B] uppercase tracking-widest mb-1">PNL</div>
                    <div className={`font-mono text-lg ${vault.userPosition.pnl >= 0 ? 'text-[#00FF66]' : 'text-[#FF3B3B]'}`}>
                      {vault.userPosition.pnl >= 0 ? '+' : ''}${vault.userPosition.pnl.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-[9px] text-[#6B6B6B] uppercase tracking-widest mb-1">ROI</div>
                    <div className={`font-mono text-lg ${vault.userPosition.roi >= 0 ? 'text-[#00FF66]' : 'text-[#FF3B3B]'}`}>
                      +{vault.userPosition.roi}%
                    </div>
                    <div className={`font-mono text-[10px] ${vault.userPosition.change24h >= 0 ? 'text-[#00FF66]' : 'text-[#FF3B3B]'}`}>
                      {vault.userPosition.change24h >= 0 ? '▲' : '▼'} {Math.abs(vault.userPosition.change24h)}% (24h)
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-[#6B6B6B] font-mono text-[10px] mb-4">
                  <span>Since: {vault.userPosition.since}</span>
                  <span>·</span>
                  <span>Shares: {vault.userPosition.shares}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 max-w-xs">
                  <button onClick={() => setDepositOpen(true)} className="py-2.5 bg-[#00FF66] text-black font-mono font-bold text-xs uppercase tracking-wider hover:bg-white transition-colors">Deposit More</button>
                  <button onClick={() => setWithdrawOpen(true)} className="py-2.5 border border-[#333] text-white font-mono text-xs uppercase tracking-widest hover:border-[#00FF66] hover:text-[#00FF66] transition-colors">Withdraw</button>
                </div>
              </div>
            ) : isConnected ? (
              <div className="bg-[#111] border border-[#333] p-6 mb-8 text-center">
                <div className="font-mono text-xs text-[#6B6B6B] uppercase tracking-widest mb-3">No Position Yet</div>
                <button onClick={() => setDepositOpen(true)} className="bg-[#00FF66] text-black font-mono font-bold text-xs px-6 py-3 uppercase tracking-wider hover:bg-white transition-colors inline-flex items-center gap-2">
                  Deposit <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="bg-[#111] border border-[#333] p-6 mb-8 text-center">
                <div className="font-mono text-xs text-[#6B6B6B] uppercase tracking-widest mb-3">Connect wallet to deposit</div>
                <button onClick={() => setIsConnected(true)} className="bg-[#00FF66] text-black font-mono font-bold text-xs px-6 py-3 uppercase tracking-wider hover:bg-white transition-colors">
                  Connect Wallet
                </button>
              </div>
            )}

            {/* VAULT STATS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
              {[
                { label: 'Total TVL', value: `$${(vault.tvl / 1000000).toFixed(1)}M` },
                { label: 'Depositors', value: vault.depositors.toString() },
                { label: '30D APY', value: `+${vault.apy30d}%`, color: 'text-[#00FF66]' },
                { label: 'All-time APY', value: `+${vault.apyAllTime}%`, color: 'text-[#00FF66]' },
                { label: 'Max Drawdown', value: `${vault.maxDrawdown}%`, color: 'text-[#FF3B3B]' },
                { label: 'Sharpe Ratio', value: vault.sharpeRatio.toFixed(2) },
                { label: 'Win Rate', value: `${vault.winRate}%` },
                { label: 'Active Bets', value: vault.activeBets.toString() },
              ].map((stat, i) => (
                <div key={stat.label} className="bg-[#111] border border-[#333] p-4 hover:border-[#6B6B6B] transition-colors">
                  <div className="font-mono text-[9px] text-[#6B6B6B] uppercase tracking-widest mb-2">{stat.label}</div>
                  <div className={`font-sans font-bold text-lg ${stat.color || 'text-white'}`}>{stat.value}</div>
                </div>
              ))}
            </div>

            {/* STRATEGY */}
            <SectionHeader title="STRATEGY" />
            <div className="mb-12">
              <JsonTerminal vaultSlug={vault.id} data={vault.strategy} />
            </div>

            {/* PERFORMANCE */}
            <SectionHeader title="PERFORMANCE" />
            <div className="bg-[#111] border border-[#333] p-4 mb-12">
              <div className="flex justify-end gap-2 mb-4 font-mono text-[10px] uppercase tracking-widest">
                {['7D', '30D', '90D', 'ALL'].map(p => (
                  <button key={p} onClick={() => setChartPeriod(p)} className={`px-3 py-1 transition-colors ${chartPeriod === p ? 'bg-[#333] text-white' : 'text-[#6B6B6B] hover:text-white'}`}>
                    [{p}]
                  </button>
                ))}
              </div>
              <PerformanceChart data={vaultChart} benchmarkData={benchChart} />
            </div>

            {/* CURRENT POSITIONS */}
            <SectionHeader title="CURRENT POSITIONS" />
            <div className="mb-12">
              {/* Desktop table */}
              <div className="hidden md:block bg-[#111] border border-[#333]">
                <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-[#333] font-mono text-[10px] text-[#6B6B6B] uppercase tracking-widest">
                  <div className="col-span-4">Market</div>
                  <div className="col-span-1">Side</div>
                  <div className="col-span-2 text-right">Size</div>
                  <div className="col-span-3">Source</div>
                  <div className="col-span-2 text-right">PNL</div>
                </div>
                {visiblePositions.map((pos: any, i: number) => (
                  <div key={i} className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-[#222] hover:bg-[#222]/50 transition-colors items-center">
                    <div className="col-span-4 text-white text-sm">&ldquo;{pos.market}&rdquo;</div>
                    <div className="col-span-1">
                      <span className={`font-mono text-[10px] px-1.5 py-0.5 ${pos.side === 'YES' ? 'bg-[#00FF66]/10 text-[#00FF66]' : 'bg-[#FF3B3B]/10 text-[#FF3B3B]'}`}>{pos.side}</span>
                    </div>
                    <div className="col-span-2 text-right font-mono text-sm text-white">${(pos.size / 1000).toFixed(0)}K</div>
                    <div className="col-span-3">
                      <button onClick={() => { navigator.clipboard.writeText(pos.source); showToast('Address copied'); }} className="font-mono text-xs text-[#6B6B6B] hover:text-[#00FF66] transition-colors">{pos.source}</button>
                    </div>
                    <div className={`col-span-2 text-right font-mono text-sm ${pos.pnl >= 0 ? 'text-[#00FF66]' : 'text-[#FF3B3B]'}`}>
                      {pos.pnl >= 0 ? '+' : ''}{pos.pnl}%
                    </div>
                  </div>
                ))}
              </div>
              {/* Mobile cards */}
              <div className="md:hidden flex flex-col gap-3">
                {visiblePositions.map((pos: any, i: number) => (
                  <div key={i} className="bg-[#111] border border-[#333] p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-white text-sm">&ldquo;{pos.market}&rdquo;</div>
                      <div className={`font-mono text-sm font-bold ${pos.pnl >= 0 ? 'text-[#00FF66]' : 'text-[#FF3B3B]'}`}>
                        {pos.pnl >= 0 ? '+' : ''}{pos.pnl}%
                      </div>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-xs text-[#6B6B6B]">
                      <span className={`px-1.5 py-0.5 ${pos.side === 'YES' ? 'bg-[#00FF66]/10 text-[#00FF66]' : 'bg-[#FF3B3B]/10 text-[#FF3B3B]'}`}>{pos.side}</span>
                      <span>${(pos.size / 1000).toFixed(0)}K</span>
                      <span>·</span>
                      <span>{pos.source}</span>
                    </div>
                  </div>
                ))}
              </div>
              {vault.positions.length > 8 && (
                <div className="text-center mt-4">
                  <button onClick={() => setShowAllPositions(!showAllPositions)} className="font-mono text-xs text-[#6B6B6B] hover:text-[#00FF66] uppercase tracking-widest transition-colors">
                    [{showAllPositions ? 'Show Less' : `Load More (${vault.positions.length - 8} remaining)`}]
                  </button>
                </div>
              )}
            </div>

            {/* RECENT TRADES */}
            <SectionHeader title="RECENT TRADES" />
            <div className="bg-[#111] border border-[#333] mb-12">
              <div className="px-4 py-2 border-b border-[#333] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse" />
                <span className="font-mono text-[10px] text-[#6B6B6B] uppercase tracking-widest">Live · updates every 30s</span>
              </div>
              {vault.trades.map((trade: any, i: number) => {
                const isRecent = trade.time.includes('m ago') && parseInt(trade.time) < 5;
                return (
                  <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-[#222] hover:bg-[#222]/50 transition-colors font-mono text-xs">
                    <div className="flex items-center gap-2 w-20 shrink-0">
                      <span className={`w-1.5 h-1.5 rounded-full ${isRecent ? 'bg-[#00FF66] animate-pulse' : 'bg-[#333]'}`} />
                      <span className="text-[#6B6B6B]">{trade.time}</span>
                    </div>
                    <div className="w-20 shrink-0">
                      <span className={trade.action === 'BUY' ? 'text-[#00FF66]' : 'text-[#FF3B3B]'}>{trade.action}</span>
                      {' '}
                      <span className={trade.side === 'YES' ? 'text-[#00FF66]' : 'text-[#FF3B3B]'}>{trade.side}</span>
                    </div>
                    <div className="flex-1 text-white truncate">&ldquo;{trade.market}&rdquo;</div>
                    <div className="text-[#6B6B6B] hidden md:block w-20 shrink-0">{trade.source}</div>
                    <div className="text-white w-16 shrink-0 text-right">${(trade.amount / 1000).toFixed(0)}K</div>
                  </div>
                );
              })}
            </div>

            {/* TOP TRACKED WALLETS */}
            <SectionHeader title="TOP TRACKED WALLETS" />
            <div className="flex flex-col gap-4 mb-8">
              {vault.wallets.map((wallet: any, i: number) => (
                <div key={i} className="bg-[#111] border border-[#333] p-5 hover:border-[#6B6B6B] transition-colors">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{medals[i] || `#${wallet.rank}`}</span>
                      <span className="font-mono text-sm text-white">{wallet.address}</span>
                    </div>
                    <button onClick={() => showToast('Coming soon')} className="font-mono text-[10px] text-[#6B6B6B] hover:text-[#00FF66] uppercase tracking-widest transition-colors flex items-center gap-1">
                      View <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                    <div>
                      <div className="font-mono text-[9px] text-[#6B6B6B] uppercase tracking-widest mb-1">Win Rate</div>
                      <div className="font-mono text-sm text-white">{wallet.winRate}%</div>
                    </div>
                    <div>
                      <div className="font-mono text-[9px] text-[#6B6B6B] uppercase tracking-widest mb-1">ROI 90D</div>
                      <div className="font-mono text-sm text-[#00FF66]">+{wallet.roi90d}%</div>
                    </div>
                    <div>
                      <div className="font-mono text-[9px] text-[#6B6B6B] uppercase tracking-widest mb-1">Followed</div>
                      <div className="font-mono text-sm text-white">{wallet.followedSince}</div>
                    </div>
                    <div>
                      <div className="font-mono text-[9px] text-[#6B6B6B] uppercase tracking-widest mb-1">Signals</div>
                      <div className="font-mono text-sm text-white">{wallet.signalShare}%</div>
                    </div>
                    <div>
                      <div className="font-mono text-[9px] text-[#6B6B6B] uppercase tracking-widest mb-1">Volume</div>
                      <div className="font-mono text-sm text-white">{wallet.volume}</div>
                    </div>
                  </div>
                  {/* Signal share bar */}
                  <div className="mb-3">
                    <div className="w-full h-1.5 bg-[#222] overflow-hidden">
                      <div className="h-full bg-[#00FF66]" style={{ width: `${wallet.signalShare}%` }} />
                    </div>
                    <div className="font-mono text-[9px] text-[#6B6B6B] mt-1">{wallet.signalShare}% of vault signals</div>
                  </div>
                  {/* Top markets */}
                  <div className="flex flex-wrap gap-1.5">
                    {wallet.topMarkets.map((m: string) => (
                      <span key={m} className="font-mono text-[9px] px-2 py-0.5 border border-[#333] text-[#6B6B6B]">{m}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mb-12">
              <button onClick={() => showToast('Coming soon')} className="font-mono text-xs text-[#6B6B6B] hover:text-[#00FF66] uppercase tracking-widest transition-colors">
                [View All {vault.id === 'alpha' ? '50' : '5'} Tracked Wallets]
              </button>
            </div>

            {/* RISK DISCLAIMER */}
            <div className="bg-[#111] border border-[#333] border-l-2 border-l-yellow-500 p-4 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
              <p className="font-mono text-xs text-[#6B6B6B] leading-relaxed">
                Past performance does not guarantee future results. Prediction markets are volatile and carry significant risk. Never deposit more than you can afford to lose. Gordon.fi does not provide financial advice.
              </p>
            </div>
          </>
        )}
      </main>

      <Toast message={toastMessage} visible={toastVisible} />
      <DepositModal isOpen={depositOpen} onClose={() => setDepositOpen(false)} vaultId={vault.id} onSuccess={() => showToast('Deposit successful!')} />
      <WithdrawModal isOpen={withdrawOpen} onClose={() => setWithdrawOpen(false)} vaultId={vault.id} onSuccess={() => showToast('Withdrawal successful!')} />
    </div>
  );
}
