'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowRight, ExternalLink, Activity, ChevronRight, Menu, X, Check } from 'lucide-react';

// --- CUSTOM HOOKS ---

const useScrollReveal = (options: any = {}) => {
  const ref = useRef<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        if (!options.persist) observer.unobserve(entry.target);
      }
    }, { threshold: options.threshold || 0.1, rootMargin: options.rootMargin || '0px' });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, isVisible] as const;
};

const useCountUp = (end: number, duration = 2000, start = 0, decimals = 0) => {
  const [count, setCount] = useState(start);
  const [ref, isVisible] = useScrollReveal({ threshold: 0.5 });
  const countRef = useRef(start);

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
      countRef.current = currentCount;
      if (percentage < 1) requestAnimationFrame(animate);
      else setCount(end);
    };
    requestAnimationFrame(animate);
  }, [isVisible, end, duration, start]);

  return [ref, count.toFixed(decimals)] as const;
};

// --- COMPONENTS ---

const ASCIIBackground = ({ theme = 'dark', isMobile }: { theme?: string; isMobile: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animationFrameId: number;
    let particles: { x: number; y: number; char: string; speed: number }[] = [];

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      initParticles();
    };

    const chars = ['0', '1', '$', '%', '#', '>', '_', '|'];

    const initParticles = () => {
      particles = [];
      const cols = Math.floor(canvas.width / 20);
      const rows = Math.floor(canvas.height / 20) + 1;
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          particles.push({
            x: i * 20,
            y: j * 20,
            char: chars[Math.floor(Math.random() * chars.length)],
            speed: 0.2 + Math.random() * 0.3
          });
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const isDark = theme === 'dark';
      const baseOpacity = isDark ? 0.06 : 0.03;
      ctx.font = '14px "JetBrains Mono", monospace';

      particles.forEach(p => {
        p.y -= isMobile ? p.speed * 0.5 : p.speed;
        if (p.y < -20) p.y = canvas.height + 20;

        const dx = p.x - mouseRef.current.x;
        const dy = p.y - mouseRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let opacity = baseOpacity;
        let color = isDark ? '255, 255, 255' : '0, 0, 0';

        if (isDark && !isMobile && dist < 150) {
          const intensity = 1 - (dist / 150);
          opacity = baseOpacity + (intensity * 0.8);
          color = '0, 255, 102';
        }

        ctx.fillStyle = `rgba(${color}, ${opacity})`;
        ctx.fillText(p.char, p.x, p.y);
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    resize();
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme, isMobile]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isMobile) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseLeave = () => {
    mouseRef.current = { x: -1000, y: -1000 };
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <canvas
        ref={canvasRef}
        className="w-full h-full pointer-events-auto"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
};

const GlitchDivider = ({ theme = 'light' }: { theme?: string }) => {
  const color = theme === 'dark' ? 'bg-[#333]' : 'bg-[#E0E0E0]';
  return (
    <div className={`w-full h-[1px] ${color} relative overflow-hidden group`}>
      <div className="absolute top-0 left-0 w-full h-full bg-[#00FF66] opacity-0 group-hover:opacity-100 transition-opacity duration-75 animate-glitch-h" />
    </div>
  );
};

const TiltCard = ({ children, className, isMobile }: { children: React.ReactNode; className?: string; isMobile: boolean }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isMobile || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;
    setStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
      transition: 'transform 0.1s ease-out'
    });
  }, [isMobile]);

  const handleMouseLeave = () => {
    if (isMobile) return;
    setStyle({
      transform: `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
      transition: 'transform 0.5s ease-out'
    });
  };

  return (
    <div
      ref={cardRef}
      className={`relative group ${className}`}
      style={style}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="absolute -inset-[1px] bg-[#00FF66] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none blur-[4px]" />
      <div className="relative h-full w-full bg-[#FAFAFA] border border-[#E0E0E0] group-hover:border-[#00FF66] transition-colors duration-300">
        {children}
      </div>
    </div>
  );
};

const HeroTerminal = ({ isMobile }: { isMobile: boolean }) => {
  const [lines, setLines] = useState<{ text: string; type?: string }[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);

  const script = [
    { text: '> init gordon.fi --mempool', delay: 800 },
    { text: '> scanning 4,209 polymarket wallets...', type: 'system', delay: 1200 },
    { text: '> 3 high-conviction alphas detected.', type: 'success', delay: 800 },
    { text: '> auto-deploying capital...', delay: 600 },
    { text: '> vault synced. printing gains.', type: 'success', delay: 4000 },
  ];

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const typeNext = () => {
      const currentScriptLine = script[currentLineIndex];
      if (!currentScriptLine) {
        timeout = setTimeout(() => {
          setLines([]);
          setCurrentLineIndex(0);
          setCurrentCharIndex(0);
        }, 5000);
        return;
      }

      if (currentScriptLine.type) {
        setLines(prev => [...prev, currentScriptLine]);
        setCurrentLineIndex(prev => prev + 1);
        setCurrentCharIndex(0);
        timeout = setTimeout(typeNext, currentScriptLine.delay);
        return;
      }

      if (currentCharIndex < currentScriptLine.text.length) {
        const partialText = currentScriptLine.text.slice(0, currentCharIndex + 1);
        setLines(prev => {
          const newLines = [...prev];
          newLines[currentLineIndex] = { text: partialText };
          return newLines;
        });
        setCurrentCharIndex(prev => prev + 1);
        timeout = setTimeout(typeNext, 30 + Math.random() * 40);
      } else {
        setCurrentLineIndex(prev => prev + 1);
        setCurrentCharIndex(0);
        timeout = setTimeout(typeNext, currentScriptLine.delay);
      }
    };

    timeout = setTimeout(typeNext, 500);
    return () => clearTimeout(timeout);
  }, [currentLineIndex, currentCharIndex]);

  return (
    <div className="w-full max-w-2xl bg-[#0A0A0A] border border-[#333] p-4 md:p-6 font-mono text-sm md:text-base relative shadow-[0_0_30px_rgba(0,255,102,0.05)]">
      <div className="flex gap-2 mb-4 border-b border-[#333] pb-2">
        <div className="w-3 h-3 bg-[#333]" />
        <div className="w-3 h-3 bg-[#333]" />
        <div className="w-3 h-3 bg-[#00FF66]/50" />
        <span className="text-[#6B6B6B] text-xs ml-2 tracking-widest uppercase">system_log.exe</span>
      </div>
      <div className="space-y-2 min-h-[140px]">
        {lines.map((line, i) => (
          <div key={i} className={`
            ${line.type === 'success' ? 'text-[#00FF66]' : ''}
            ${line.type === 'system' ? 'text-[#6B6B6B]' : 'text-white'}
          `}>
            {line.text}
            {line.type === 'success' && <Check className="inline w-4 h-4 ml-2" />}
          </div>
        ))}
        {currentLineIndex < script.length && !script[currentLineIndex]?.type && (
          <span className="inline-block w-2 h-4 bg-[#00FF66] animate-pulse ml-1 align-middle" />
        )}
      </div>
    </div>
  );
};

const HowItWorksCard = ({ item, index }: { item: { step: string; title: string; desc: string }; index: number }) => {
  const [ref, isVisible] = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`border border-[#E0E0E0] p-8 bg-white transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      <div className="text-6xl font-sans text-[#E0E0E0] mb-8">{item.step}</div>
      <h3 className="text-xl font-bold mb-4 font-mono uppercase tracking-wider">{item.title}</h3>
      <p className="text-[#6B6B6B] leading-relaxed">{item.desc}</p>
    </div>
  );
};

const LeaderboardRow = ({ row, index }: { row: any; index: number }) => {
  const [ref, isVisible] = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`grid grid-cols-6 gap-4 border-b border-[#222] py-6 font-mono text-sm items-center hover:bg-[#111] transition-all duration-500 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="col-span-1 text-[#6B6B6B]">#{row.rank}</div>
      <div className="col-span-2 flex items-center gap-2 group cursor-pointer relative">
        <span className="text-white group-hover:text-[#00FF66] transition-colors">{row.wallet}</span>
        <ExternalLink className="w-3 h-3 text-[#333] group-hover:text-[#00FF66]" />
        <div className="absolute left-0 -top-8 bg-[#333] text-white px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
          0x71C839...D849A2
        </div>
      </div>
      <div className="col-span-1 text-white">{row.win}</div>
      <div className="col-span-1 text-[#6B6B6B]">{row.pos}</div>
      <div className={`col-span-1 text-right font-bold ${row.pnlColor}`}>{row.pnl}</div>
    </div>
  );
};

// --- MAIN APP ---

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      document.documentElement.style.setProperty('--scroll-y', `${window.scrollY}px`);
    };
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const [tvlRef, tvl] = useCountUp(12.4, 2500, 0, 1);
  const [, wallets] = useCountUp(4209, 2000);
  const [, apy] = useCountUp(84.2, 2500, 0, 1);

  const howItWorksData = [
    { step: '01', title: 'TRACK', desc: 'Our indexers monitor Polymarket mempools 24/7, tracking historical win rates of thousands of addresses.' },
    { step: '02', title: 'DEPLOY', desc: 'When a top 1% wallet takes a position, Gordon instantly routes vault liquidity to copy the exact trade.' },
    { step: '03', title: 'EARN', desc: 'Profits are auto-compounded. 20% performance fee is used to market-buy and burn $GDN tokens.' }
  ];

  const leaderboardData = [
    { rank: 1, wallet: '0x71C...49A2', win: '82.4%', pos: 3, pnl: '+142.5K', pnlColor: 'text-[#00FF66]' },
    { rank: 2, wallet: '0x4B2...11F8', win: '78.9%', pos: 1, pnl: '+98.2K', pnlColor: 'text-[#00FF66]' },
    { rank: 3, wallet: '0x99A...CC42', win: '75.1%', pos: 5, pnl: '+76.4K', pnlColor: 'text-[#00FF66]' },
    { rank: 4, wallet: '0x1D3...8E2B', win: '71.0%', pos: 0, pnl: '+41.8K', pnlColor: 'text-[#00FF66]' },
    { rank: 5, wallet: '0x5F5...B319', win: '68.5%', pos: 2, pnl: '-12.4K', pnlColor: 'text-[#FF3B3B]' },
  ];

  return (
    <div className="min-h-screen bg-[#111] text-[#FAFAFA] font-sans selection:bg-[#00FF66] selection:text-black">
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Space+Grotesk:wght@700&display=swap');
        :root { --scroll-y: 0px; }
        .font-sans { font-family: 'Space Grotesk', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .parallax-hero { transform: translateY(calc(var(--scroll-y) * 0.3)); }
        @keyframes glitch-h {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-4px); }
          40% { transform: translateX(4px); }
          60% { transform: translateX(-2px); }
          80% { transform: translateX(2px); }
        }
        .animate-glitch-h { animation: glitch-h 0.2s linear infinite; }
        .clip-transition { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); transition: clip-path 0.5s ease; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #0A0A0A; }
        ::-webkit-scrollbar-thumb { background: #333; }
        ::-webkit-scrollbar-thumb:hover { background: #00FF66; }
      `}} />

      {/* SECTION 1: STICKY NAVBAR */}
      <nav className={`fixed top-0 left-0 w-full z-40 transition-all duration-300 ${scrolled ? 'bg-[#0A0A0A]/80 backdrop-blur-md border-b border-[#333]' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="font-mono font-bold text-2xl tracking-tighter text-white">
            GORDON<span className="text-[#00FF66]">.fi</span>
          </div>
          {!isMobile && (
            <div className="hidden md:flex items-center gap-8 font-mono text-sm tracking-widest uppercase">
              {['Vaults', 'Leaderboard', 'Docs', '$GDN'].map(link => (
                <a key={link} href="#" className="text-[#6B6B6B] hover:text-[#00FF66] relative group transition-colors">
                  {link}
                  <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-[#00FF66] transition-all duration-300 group-hover:w-full" />
                </a>
              ))}
            </div>
          )}
          <div className="flex items-center gap-4">
            {!isMobile ? (
              <button className="bg-[#00FF66] text-black font-mono font-bold text-sm px-6 py-3 uppercase tracking-wider hover:bg-white transition-colors group flex items-center gap-2">
                Launch App
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            ) : (
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-[#00FF66]">
                {mobileMenuOpen ? <X /> : <Menu />}
              </button>
            )}
          </div>
        </div>
        {isMobile && mobileMenuOpen && (
          <div className="absolute top-20 left-0 w-full bg-[#0A0A0A] border-b border-[#333] p-4 flex flex-col gap-4 font-mono uppercase tracking-widest text-sm z-50">
            {['Vaults', 'Leaderboard', 'Docs', '$GDN'].map(link => (
              <a key={link} href="#" className="text-[#6B6B6B] py-2 border-b border-[#222]">{link}</a>
            ))}
            <button className="bg-[#00FF66] text-black font-bold py-3 mt-4 w-full">LAUNCH APP -{'>'}</button>
          </div>
        )}
      </nav>

      {/* SECTION 2: HERO */}
      <section className="relative w-full min-h-screen bg-[#0A0A0A] flex items-center pt-20 overflow-hidden">
        <ASCIIBackground theme="dark" isMobile={isMobile} />
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 border border-[#333] bg-black/50 px-3 py-1 font-mono text-xs tracking-widest text-[#00FF66]">
              <Activity className="w-3 h-3 animate-pulse" />
              V2 PROTOCOL LIVE
            </div>
            <h1 className="text-5xl md:text-7xl leading-[1.1] text-white">
              TRACKING <span className="text-[#00FF66]">ALPHA.</span><br/>
              PRINTING GAINS.
            </h1>
            <p className="text-[#6B6B6B] font-mono text-lg max-w-md">
              Gordon tracks the most profitable Polymarket wallets and auto-copies their trades via decentralized vaults.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button className="bg-[#00FF66] text-black font-mono font-bold px-8 py-4 uppercase tracking-wider hover:bg-white transition-colors">
                Deposit Now
              </button>
              <button className="border border-[#333] text-white font-mono font-bold px-8 py-4 uppercase tracking-wider hover:border-[#00FF66] hover:text-[#00FF66] transition-colors flex justify-center items-center gap-2">
                Read Docs
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className={`${!isMobile ? 'parallax-hero' : ''}`}>
            <HeroTerminal isMobile={isMobile} />
            <div className="grid grid-cols-3 gap-4 mt-8" ref={tvlRef}>
              <div className="border border-[#333] bg-[#111] p-4">
                <div className="text-[#6B6B6B] font-mono text-xs mb-1 uppercase tracking-widest">Total Value Locked</div>
                <div className="text-2xl font-bold text-[#00FF66]">${tvl}M</div>
              </div>
              <div className="border border-[#333] bg-[#111] p-4">
                <div className="text-[#6B6B6B] font-mono text-xs mb-1 uppercase tracking-widest">Wallets Tracked</div>
                <div className="text-2xl font-bold text-white">{wallets}</div>
              </div>
              <div className="border border-[#333] bg-[#111] p-4">
                <div className="text-[#6B6B6B] font-mono text-xs mb-1 uppercase tracking-widest">Avg 30D APY</div>
                <div className="text-2xl font-bold text-[#00FF66]">+{apy}%</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: HOW IT WORKS */}
      <section className="relative w-full py-32 bg-[#FAFAFA] text-black clip-transition">
        <GlitchDivider theme="light" />
        <ASCIIBackground theme="light" isMobile={isMobile} />
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-end border-b border-[#E0E0E0] pb-8 mb-16">
            <div>
              <h2 className="text-4xl md:text-5xl">HOW IT WORKS</h2>
              <div className="text-[#6B6B6B] font-mono mt-4 uppercase tracking-widest">Automated degenerate behavior</div>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {howItWorksData.map((item, i) => (
              <HowItWorksCard key={item.step} item={item} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: LIVE LEADERBOARD */}
      <section className="relative w-full py-32 bg-[#0A0A0A] text-white">
        <GlitchDivider theme="dark" />
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
            <div>
              <h2 className="text-4xl md:text-5xl">LIVE LEADERBOARD</h2>
              <div className="flex items-center gap-2 text-[#00FF66] font-mono mt-4 text-sm tracking-widest uppercase relative">
                <div className="w-2 h-2 rounded-full bg-[#00FF66] animate-ping" />
                <div className="w-2 h-2 rounded-full bg-[#00FF66] absolute" />
                <span className="ml-4">Updated 3s ago</span>
              </div>
            </div>
            <button className="text-[#6B6B6B] font-mono text-sm hover:text-[#00FF66] uppercase tracking-widest flex items-center gap-1 group">
              View Full Data
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          <div className={`w-full ${isMobile ? 'overflow-x-auto pb-4' : ''}`}>
            <div className="min-w-[800px]">
              <div className="grid grid-cols-6 gap-4 border-b border-[#333] pb-4 font-mono text-xs text-[#6B6B6B] uppercase tracking-widest">
                <div className="col-span-1">Rank</div>
                <div className="col-span-2">Wallet</div>
                <div className="col-span-1">Win Rate</div>
                <div className="col-span-1">Open Pos.</div>
                <div className="col-span-1 text-right">30D PNL</div>
              </div>
              <div>
                {leaderboardData.map((row, i) => (
                  <LeaderboardRow key={row.rank} row={row} index={i} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: VAULTS */}
      <section className="relative w-full py-32 bg-[#FAFAFA] text-black">
        <GlitchDivider theme="light" />
        <ASCIIBackground theme="light" isMobile={isMobile} />
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl mb-4">DEPLOY CAPITAL</h2>
            <p className="text-[#6B6B6B] font-mono uppercase tracking-widest text-sm">Select your risk profile</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Alpha Vault */}
            <TiltCard className="h-full" isMobile={isMobile}>
              <div className="p-8 flex flex-col h-full">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-2xl font-bold font-mono uppercase">Alpha Vault</h3>
                    <div className="text-[#6B6B6B] font-mono text-xs mt-2">Tracks Top 50 Wallets</div>
                  </div>
                  <div className="bg-[#E0E0E0] px-3 py-1 font-mono text-xs font-bold uppercase">Moderate</div>
                </div>
                <div className="space-y-4 mb-8 flex-grow">
                  <div className="flex justify-between border-b border-[#E0E0E0] pb-2 font-mono text-sm">
                    <span className="text-[#6B6B6B] uppercase">Target APY</span>
                    <span className="font-bold text-[#00AA44]">~45%</span>
                  </div>
                  <div className="flex justify-between border-b border-[#E0E0E0] pb-2 font-mono text-sm">
                    <span className="text-[#6B6B6B] uppercase">TVL</span>
                    <span className="font-bold">$8.2M</span>
                  </div>
                  <div className="flex justify-between border-b border-[#E0E0E0] pb-2 font-mono text-sm">
                    <span className="text-[#6B6B6B] uppercase">Max Drawdown</span>
                    <span className="font-bold">-12%</span>
                  </div>
                  <div className="pt-2">
                    <div className="text-[#6B6B6B] font-mono text-xs uppercase mb-2">Risk Exposure</div>
                    <div className="flex gap-1">
                      <div className="h-2 w-full bg-black"></div>
                      <div className="h-2 w-full bg-black"></div>
                      <div className="h-2 w-full bg-[#E0E0E0]"></div>
                      <div className="h-2 w-full bg-[#E0E0E0]"></div>
                      <div className="h-2 w-full bg-[#E0E0E0]"></div>
                    </div>
                  </div>
                </div>
                <button className="w-full border border-black text-black font-mono font-bold py-4 uppercase tracking-wider hover:bg-[#00FF66] hover:border-[#00FF66] transition-colors">
                  Deposit USDC
                </button>
              </div>
            </TiltCard>

            {/* Degen Vault */}
            <TiltCard className="h-full" isMobile={isMobile}>
              <div className="p-8 flex flex-col h-full bg-[#111] text-white">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-2xl font-bold font-mono uppercase text-[#00FF66]">Degen Vault</h3>
                    <div className="text-[#6B6B6B] font-mono text-xs mt-2">Tracks Top 5 Wallets Only</div>
                  </div>
                  <div className="bg-[#FF3B3B]/20 text-[#FF3B3B] px-3 py-1 font-mono text-xs font-bold uppercase border border-[#FF3B3B]/50">High Risk</div>
                </div>
                <div className="space-y-4 mb-8 flex-grow">
                  <div className="flex justify-between border-b border-[#333] pb-2 font-mono text-sm">
                    <span className="text-[#6B6B6B] uppercase">Target APY</span>
                    <span className="font-bold text-[#00FF66]">~120%+</span>
                  </div>
                  <div className="flex justify-between border-b border-[#333] pb-2 font-mono text-sm">
                    <span className="text-[#6B6B6B] uppercase">TVL</span>
                    <span className="font-bold">$4.2M</span>
                  </div>
                  <div className="flex justify-between border-b border-[#333] pb-2 font-mono text-sm">
                    <span className="text-[#6B6B6B] uppercase">Max Drawdown</span>
                    <span className="font-bold text-[#FF3B3B]">-45%</span>
                  </div>
                  <div className="pt-2">
                    <div className="text-[#6B6B6B] font-mono text-xs uppercase mb-2">Risk Exposure</div>
                    <div className="flex gap-1">
                      <div className="h-2 w-full bg-[#FF3B3B]"></div>
                      <div className="h-2 w-full bg-[#FF3B3B]"></div>
                      <div className="h-2 w-full bg-[#FF3B3B]"></div>
                      <div className="h-2 w-full bg-[#FF3B3B]"></div>
                      <div className="h-2 w-full bg-[#FF3B3B]"></div>
                    </div>
                  </div>
                </div>
                <button className="w-full bg-[#00FF66] text-black font-mono font-bold py-4 uppercase tracking-wider hover:bg-white transition-colors">
                  Deposit USDC
                </button>
              </div>
            </TiltCard>
          </div>
        </div>
      </section>

      {/* SECTION 6: TOKENOMICS */}
      <section className="relative w-full py-32 bg-[#0A0A0A] text-white border-t border-[#333]">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div className="bg-black border border-[#333] p-6 font-mono text-sm overflow-x-auto relative">
            <div className="text-[#6B6B6B] mb-4">{'// tokenomics.json'}</div>
            <pre className="text-[#E0E0E0]">
{`{
  "ticker": "$GDN",
  "supply": 100000000,
  "mechanics": {
    "performance_fee": 0.20,
    "fee_usage": "market_buy",
    "destination": "burn_address"
  },
  "flywheel": "active"
}`}
            </pre>
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-black to-transparent pointer-events-none mix-blend-multiply" />
          </div>
          <div>
            <h2 className="text-4xl mb-6">THE <span className="text-[#00FF66]">$GDN</span> FLYWHEEL</h2>
            <p className="text-[#6B6B6B] font-mono mb-8 leading-relaxed">
              20% of all vault profits are automatically used to market-buy $GDN and burn it. As vaults grow, buy pressure increases. Deflationary by design.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-[#222] p-4">
                <div className="text-[#6B6B6B] font-mono text-xs uppercase mb-1">Price</div>
                <div className="text-xl font-bold font-mono">$0.842</div>
              </div>
              <div className="border border-[#222] p-4">
                <div className="text-[#6B6B6B] font-mono text-xs uppercase mb-1">Market Cap</div>
                <div className="text-xl font-bold font-mono">$84.2M</div>
              </div>
              <div className="border border-[#222] p-4">
                <div className="text-[#6B6B6B] font-mono text-xs uppercase mb-1">Total Buyback</div>
                <div className="text-xl font-bold font-mono text-[#00FF66]">$1.2M</div>
              </div>
              <div className="border border-[#222] p-4">
                <div className="text-[#6B6B6B] font-mono text-xs uppercase mb-1">Tokens Burned</div>
                <div className="text-xl font-bold font-mono">1.4%</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: FINAL CTA */}
      <section className="w-full py-40 bg-[#00FF66] text-black text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 font-mono text-xs flex flex-wrap gap-2 pointer-events-none select-none mix-blend-overlay">
          {Array.from({length: isMobile ? 200 : 1000}).map((_, i) => (
            <span key={i}>{['0', '1', '$'][Math.floor(Math.random()*3)]}</span>
          ))}
        </div>
        <div className="relative z-10">
          <h2 className="text-5xl md:text-7xl font-bold mb-8">
            STOP TRADING.<br/>START TRACKING.
          </h2>
          <button className="bg-black text-[#00FF66] font-mono font-bold text-lg px-10 py-5 uppercase tracking-wider hover:bg-white hover:text-black transition-colors shadow-[8px_8px_0px_#0A0A0A] hover:shadow-[4px_4px_0px_#0A0A0A] hover:translate-x-1 hover:translate-y-1">
            Launch App
          </button>
        </div>
      </section>

      {/* SECTION 8: FOOTER */}
      <footer className="w-full bg-[#0A0A0A] text-[#6B6B6B] py-12 border-t border-[#333] font-mono text-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="font-bold text-white text-xl tracking-tighter">
            GORDON<span className="text-[#00FF66]">.fi</span>
          </div>
          <div className="flex gap-6 uppercase tracking-widest">
            <a href="#" className="hover:text-[#00FF66]">Twitter</a>
            <a href="#" className="hover:text-[#00FF66]">Discord</a>
            <a href="#" className="hover:text-[#00FF66]">Github</a>
            <a href="#" className="hover:text-[#00FF66]">Docs</a>
          </div>
          <div>© 2026 Ki Foundation.</div>
        </div>
      </footer>
    </div>
  );
}
