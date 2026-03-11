'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  ChevronDown, ExternalLink, Copy, Power, ArrowRight,
  LayoutDashboard, Layers, Coins, Check, TrendingUp,
  Flame, X, ArrowUpRight, Zap, Users
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
    <div ref={ref} className={`mb-6 transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="flex items-center gap-4">
        <h2 className="text-[#6B6B6B] font-mono text-xs uppercase tracking-widest flex items-center gap-2">
          <span className="text-[#00FF66]">&gt;</span> {title}
        </h2>
      </div>
      <div className="w-full h-[1px] bg-[#333] mt-2 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1/4 h-full bg-[#00FF66] opacity-20 animate-glitch-h" />
      </div>
      {subtitle && <p className="font-mono text-xs text-[#6B6B6B] mt-3">{subtitle}</p>}
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
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [chartPeriod, setChartPeriod] = useState('ALL');
  const walletRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Staking state

  useOnClickOutside(walletRef, () => setWalletOpen(false));
  useOnClickOutside(menuRef, () => setMobileMenuOpen(false));
  useEffect(() => { const h = () => setScrolled(window.scrollY > 20); window.addEventListener("scroll", h); return () => window.removeEventListener("scroll", h); }, []);

  const showToast = (msg: string) => {
    setToast({ visible: true, message: msg });
    setTimeout(() => setToast({ visible: false, message: '' }), 3000);
  };

  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); showToast('Copied to clipboard'); };


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

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Toast message={toast.message} visible={toast.visible} />

      {/* NAVBAR */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#333]' : 'bg-transparent border-b border-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-mono font-bold text-xl tracking-tighter text-white">GORDON<span className="text-[#00FF66]">.fi</span></Link>
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(l => (
              <a key={l.href} href={l.href} className={`font-mono text-xs uppercase tracking-widest transition-colors ${l.href === '/token' ? 'text-[#00FF66]' : 'text-[#6B6B6B] hover:text-white'}`}>{l.label}</a>
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

        {/* 1. HEADER */}
        <SectionHeader title="$GDN TOKEN" subtitle="The deflationary engine behind Gordon.fi" />

        {/* 2. TOKEN METRICS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
          <MetricCard index={0} label="PRICE" value={`$${TOKEN_DATA.price}`} sub={`+${TOKEN_DATA.priceChange24h}% 24h`} />
          <MetricCard index={1} label="MARKET CAP" value="$84.2M" sub={`#${TOKEN_DATA.marketCapRank} rank`} />
          <MetricCard index={2} label="24H VOLUME" value="$3.2M" sub={`+${TOKEN_DATA.volumeChange}% vs 7d avg`} />
          <MetricCard index={3} label="TOTAL BURNED" value="1,420,000 GDN" sub={`${TOKEN_DATA.burnPercent}% of supply`} />
          <MetricCard index={4} label="CIRCULATING" value="98,580,000" sub="98.58%" />
          <MetricCard index={5} label="TOTAL SUPPLY" value="100,000,000" sub="Fixed cap" />
        </div>

        {/* 3. PRICE CHART */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-mono text-xs text-[#6B6B6B] uppercase tracking-widest flex items-center gap-2"><span className="text-[#00FF66]">&gt;</span> PRICE CHART</h3>
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
        <div className="mb-8">
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
        <div className="mb-8">
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

        {/* 6. STAKE CTA */}
        <div className="mb-8">
          <div className="bg-[#111] border border-[#222] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#00FF66]/10 border border-[#00FF66]/20 flex items-center justify-center">
                <Zap className="w-6 h-6 text-[#00FF66]" />
              </div>
              <div>
                <h3 className="font-mono text-lg text-white mb-1">Stake $GDN · Reduce Fees</h3>
                <p className="font-mono text-xs text-[#6B6B6B]">Stake to climb Loyalty Ranks (up to 90% fee reduction), unlock governance, early vault access & more.</p>
              </div>
            </div>
            <Link href="/stake" className="bg-[#00FF66] text-black font-mono text-sm font-bold px-8 py-3 hover:bg-[#00DD55] transition-colors flex items-center gap-2 shrink-0">
              Stake Now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* 7. TRADE $GDN */}
        <div className="mb-8">
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
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#0A0A0A] border-t border-[#333] z-50 flex justify-around items-center h-16 pb-safe">
        <Link href="/dashboard" className="flex flex-col items-center gap-1 text-[#6B6B6B]"><LayoutDashboard className="w-5 h-5" /><span className="font-mono text-[10px] tracking-widest uppercase">Dash</span></Link>
        <Link href="/vaults" className="flex flex-col items-center gap-1 text-[#6B6B6B]"><Layers className="w-5 h-5" /><span className="font-mono text-[10px] tracking-widest uppercase">Vaults</span></Link>
        <Link href="/stake" className="flex flex-col items-center gap-1 text-[#6B6B6B]"><Zap className="w-5 h-5" /><span className="font-mono text-[10px] tracking-widest uppercase">Stake</span></Link>
        <Link href="/token" className="flex flex-col items-center gap-1 text-[#00FF66]"><Coins className="w-5 h-5" /><span className="font-mono text-[10px] tracking-widest uppercase">$GDN</span></Link>
      </div>

      {/* Keyframe for burn log animation */}
      <style jsx global>{`
        @keyframes glitch-h { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(100%); } }
        .animate-glitch-h { animation: glitch-h 3s linear infinite; }
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
