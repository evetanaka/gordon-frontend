'use client'

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronDown, ExternalLink, Copy, Power, Activity, ArrowRight, Check, Flame, ArrowUpRight, LayoutDashboard, Layers, Trophy, Coins, Wallet, Zap } from 'lucide-react';

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

// --- COMPONENTS ---

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
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#222" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <g className="font-mono text-[10px] fill-[#6B6B6B]">
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
            const val = minVal + (maxVal - minVal) * ratio;
            const y = height - padding.bottom - ratio * (height - padding.top - padding.bottom);
            return (
              <g key={ratio}>
                <line x1={padding.left - 5} y1={y} x2="100%" y2={y} stroke="#222" strokeWidth="1" strokeDasharray="2,2" />
                <text x={padding.left - 10} y={y + 4} textAnchor="end">${(val / 1000).toFixed(1)}K</text>
              </g>
            );
          })}
          <text x={padding.left} y={height - 5} textAnchor="middle">D1</text>
          <text x={width / 2} y={height - 5} textAnchor="middle">D15</text>
          <text x={width - padding.right} y={height - 5} textAnchor="middle">D30</text>
        </g>
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

// Stats card (extracted to avoid hooks-in-map)
const StatCard = ({ label, value, valueRef, sub, color, index }: { label: string; value: string; valueRef: any; sub?: string; color?: string; index: number }) => {
  const [animRef, isVisible] = useScrollReveal({ delay: index * 100 });
  return (
    <div
      ref={animRef}
      className={`bg-[#111] border border-[#333] p-4 md:p-6 flex flex-col justify-between hover:border-[#6B6B6B] transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
    >
      <div className="font-mono text-[10px] md:text-xs text-[#6B6B6B] uppercase tracking-widest mb-4">{label}</div>
      <div>
        <div ref={valueRef} className={`font-sans font-bold text-xl md:text-2xl ${color || 'text-white'}`}>
          {value}
        </div>
        {sub && (
          <div className={`font-mono text-[10px] md:text-xs mt-1 ${color || 'text-[#6B6B6B]'}`}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
};

// Position row (extracted to avoid hooks-in-map)
const PositionRow = ({ pos, index }: { pos: any; index: number }) => {
  const [ref, isVisible] = useScrollReveal({ delay: index * 150 });
  return (
    <div
      ref={ref}
      className={`bg-[#111] md:bg-transparent border border-[#333] md:border-b md:border-x-0 md:border-t-0 p-4 md:py-4 md:px-4 hover:bg-[#111] transition-all duration-300 md:grid md:grid-cols-12 md:gap-4 md:items-center ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}
    >
      <div className="col-span-3 mb-4 md:mb-0">
        <div className="font-bold text-white mb-1 flex items-center justify-between md:justify-start">
          {pos.vault}
          <span className="md:hidden font-mono text-xs text-[#00FF66]">+{pos.pnlPct}%</span>
        </div>
        <div className="font-mono text-[10px] text-[#6B6B6B] border-l border-[#333] pl-2 ml-1">
          tracking {pos.tracked} wallets
        </div>
      </div>
      <div className="col-span-2 md:text-right flex justify-between md:block font-mono text-sm text-[#6B6B6B] md:text-white mb-2 md:mb-0">
        <span className="md:hidden text-xs uppercase tracking-widest">Deposited</span>
        ${pos.deposited.toLocaleString()}
      </div>
      <div className="col-span-2 md:text-right flex justify-between md:block font-mono text-sm text-white mb-2 md:mb-0">
        <span className="md:hidden text-[#6B6B6B] text-xs uppercase tracking-widest">Current</span>
        ${pos.current.toLocaleString()}
      </div>
      <div className="col-span-2 md:text-right flex justify-between md:block font-mono text-sm mb-4 md:mb-0 text-[#00FF66]">
        <span className="md:hidden text-[#6B6B6B] text-xs uppercase tracking-widest">PNL</span>
        <div>
          +${pos.pnl.toLocaleString()}
          <div className="text-[10px] hidden md:block">+{pos.pnlPct}%</div>
        </div>
      </div>
      <div className="col-span-2 md:text-center font-mono text-xs text-[#6B6B6B] hidden md:block">
        {pos.since}
      </div>
      <div className="col-span-1 md:text-right mt-4 md:mt-0">
        <Link href={`/vaults/${pos.id}`} className="w-full md:w-auto text-xs font-mono text-[#6B6B6B] hover:text-[#00FF66] transition-colors uppercase tracking-widest flex justify-center md:justify-end items-center gap-1 group">
          [Manage <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />]
        </Link>
      </div>
    </div>
  );
};

// Activity item (extracted to avoid hooks-in-map)
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

// --- MAIN ---

export default function Dashboard() {
  const [isConnected, setIsConnected] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [chartPeriod, setChartPeriod] = useState('30D');
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(dropdownRef, () => setDropdownOpen(false));

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [totalDepRef, totalDep] = useCountUp(12400, 2000, 0, 0, '$');
  const [pnlRef, pnl] = useCountUp(2847, 2000, 0, 0, '+$');
  const [roiRef, roi] = useCountUp(34.2, 2000, 0, 1, '+', '%');
  const [gdnRef, gdn] = useCountUp(142, 2000, 0, 0);

  const mockChartData = Array.from({ length: 30 }, (_, i) => ({
    date: `Day ${i + 1}`,
    value: 10000 + (i * 80) + (Math.sin(i) * 400) + (Math.random() * 200),
    change: `+${(Math.random() * 2).toFixed(1)}%`
  }));

  const activePositions = [
    { vault: 'Alpha Vault', id: 'alpha', tracked: 50, deposited: 8000, current: 9847, pnl: 1847, pnlPct: 23.1, since: '14 days' },
    { vault: 'Degen Vault', id: 'degen', tracked: 5, deposited: 4400, current: 5400, pnl: 1000, pnlPct: 22.7, since: '7 days' }
  ];

  const activityFeed = [
    { type: 'trade', icon: <Check className="w-4 h-4 text-[#00FF66]" />, text: 'Vault copied 0x71C...49A2 — YES on "Trump wins"', time: '2m ago' },
    { type: 'compound', icon: <Check className="w-4 h-4 text-[#00FF66]" />, text: 'Auto-compound: +$42.30 reinvested', time: '15m ago' },
    { type: 'burn', icon: <Flame className="w-4 h-4 text-[#00FF66]" />, text: '$GDN buyback: 12.4 GDN burned', time: '1h ago' },
    { type: 'deposit', icon: <ArrowUpRight className="w-4 h-4 text-white" />, text: 'Deposit $4,400 into Degen Vault', time: '7d ago' },
    { type: 'deposit', icon: <ArrowUpRight className="w-4 h-4 text-white" />, text: 'Deposit $8,000 into Alpha Vault', time: '14d ago' },
  ];

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

      {/* TOP NAVBAR */}
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
              <Link key={link.label} href={link.href} className={`font-mono text-xs uppercase tracking-widest relative group transition-colors ${link.label === 'Dashboard' ? 'text-white' : 'text-[#6B6B6B] hover:text-[#00FF66]'}`}>
                {link.label}
                <span className={`absolute -bottom-1 left-0 h-[1px] transition-all duration-300 ${link.label === 'Dashboard' ? 'w-full bg-white' : 'w-0 bg-[#00FF66] group-hover:w-full'}`} />
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
                  <span className="font-mono text-xs text-white">0x71C...49A2</span>
                  <ChevronDown className="w-3 h-3 text-[#6B6B6B] group-hover:text-[#00FF66] transition-colors" />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#111] border border-[#333] shadow-[0_0_20px_rgba(0,0,0,0.5)] flex flex-col font-mono text-xs z-50">
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
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* MOBILE BOTTOM NAV */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#0A0A0A] border-t border-[#333] z-50 flex justify-around items-center h-16 pb-safe">
        <Link href="/dashboard" className="flex flex-col items-center gap-1 text-white">
          <LayoutDashboard className="w-5 h-5" />
          <span className="font-mono text-[10px] tracking-widest uppercase">Dash</span>
        </Link>
        <Link href="/vaults" className="flex flex-col items-center gap-1 text-[#6B6B6B]">
          <Layers className="w-5 h-5" />
          <span className="font-mono text-[10px] tracking-widest uppercase">Vaults</span>
        </Link>
        <Link href="/stake" className="flex flex-col items-center gap-1 text-[#6B6B6B]">
          <Zap className="w-5 h-5" />
          <span className="font-mono text-[10px] tracking-widest uppercase">Stake</span>
        </Link>
        <Link href="/token" className="flex flex-col items-center gap-1 text-[#6B6B6B]">
          <Coins className="w-5 h-5" />
          <span className="font-mono text-[10px] tracking-widest uppercase">$GDN</span>
        </Link>
      </div>

      {/* MAIN CONTENT */}
      <main className="max-w-5xl mx-auto px-4 md:px-6 pt-24 pb-12 md:pb-24">
        {isConnected ? (
          <>
            {/* SECTION 1: PORTFOLIO OVERVIEW */}
            <SectionHeader title="PORTFOLIO OVERVIEW" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
              <StatCard label="TOTAL DEPOSITED" value={totalDep} valueRef={totalDepRef} index={0} />
              <StatCard label="30D PNL" value={pnl} valueRef={pnlRef} sub="+22.9%" color="text-[#00FF66]" index={1} />
              <StatCard label="ALL-TIME ROI" value={roi} valueRef={roiRef} color="text-[#00FF66]" index={2} />
              <StatCard label="$GDN EARNED" value={`${gdn} GDN`} valueRef={gdnRef} sub="≈$119" index={3} />
            </div>

            {/* SECTION 2: ACTIVE POSITIONS */}
            <SectionHeader title="ACTIVE POSITIONS" />
            <div className="mb-16">
              <div className="hidden md:grid grid-cols-12 gap-4 border-b border-[#333] pb-2 mb-2 font-mono text-[10px] text-[#6B6B6B] uppercase tracking-widest px-4">
                <div className="col-span-3">VAULT</div>
                <div className="col-span-2 text-right">DEPOSITED</div>
                <div className="col-span-2 text-right">CURRENT VALUE</div>
                <div className="col-span-2 text-right">PNL</div>
                <div className="col-span-2 text-center">SINCE</div>
                <div className="col-span-1 text-right">ACTION</div>
              </div>
              <div className="flex flex-col gap-4 md:gap-0">
                {activePositions.map((pos, i) => (
                  <PositionRow key={pos.vault} pos={pos} index={i} />
                ))}
              </div>
            </div>

            {/* LOWER GRID: RECENT ACTIVITY & PERFORMANCE */}
            <div className="grid lg:grid-cols-2 gap-16">
              {/* SECTION 3: RECENT ACTIVITY */}
              <div>
                <SectionHeader title="RECENT ACTIVITY" />
                <div className="bg-[#111] border border-[#333] p-1 font-mono text-xs overflow-hidden">
                  {activityFeed.map((item, i) => (
                    <ActivityItem key={i} item={item} index={i} />
                  ))}
                </div>
              </div>

              {/* SECTION 4: PORTFOLIO PERFORMANCE */}
              <div>
                <SectionHeader title="PORTFOLIO PERFORMANCE" />
                <div className="bg-[#111] border border-[#333] p-4">
                  <div className="flex justify-end gap-2 mb-6 font-mono text-[10px] uppercase tracking-widest">
                    {['7D', '30D', '90D', 'ALL'].map(period => (
                      <button key={period} onClick={() => setChartPeriod(period)} className={`px-3 py-1 transition-colors ${chartPeriod === period ? 'bg-[#333] text-white' : 'text-[#6B6B6B] hover:text-white'}`}>
                        [{period}]
                      </button>
                    ))}
                  </div>
                  <PerformanceChart data={mockChartData} />
                </div>
              </div>
            </div>
          </>
        ) : (
          /* EMPTY STATE */
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-16 h-16 border border-[#333] bg-[#111] rounded-full flex items-center justify-center mb-6">
              <Wallet className="w-6 h-6 text-[#6B6B6B]" />
            </div>
            <h2 className="font-mono text-sm text-[#6B6B6B] uppercase tracking-widest mb-4">
              &gt; NO POSITIONS YET
            </h2>
            <p className="text-[#E0E0E0] max-w-sm mb-8">
              Connect a wallet and deploy capital into a vault to start tracking alpha.
            </p>
            <button onClick={() => setIsConnected(true)} className="bg-[#00FF66] text-black font-mono font-bold text-sm px-6 py-3 uppercase tracking-wider hover:bg-white transition-colors shadow-[0_0_20px_rgba(0,255,102,0.1)] hover:shadow-[0_0_30px_rgba(0,255,102,0.2)]">
              Connect Wallet
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
