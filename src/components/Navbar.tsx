'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ConnectButton from '@/components/ConnectButton'
import { ArrowRight, Menu, X } from 'lucide-react'

interface NavbarProps {
  variant?: 'landing' | 'app'
}

const appLinks = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Vaults', href: '/vaults' },
  { label: 'Leaderboard', href: '/leaderboard' },
  { label: 'Stake', href: '/stake' },
  { label: '$GDN', href: '/token' },
]

const landingLinks = [
  { label: 'Vaults', href: '/vaults' },
  { label: 'Leaderboard', href: '/leaderboard' },
  { label: 'Docs', href: '#' },
  { label: '$GDN', href: '/token' },
]

export default function Navbar({ variant = 'app' }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > (variant === 'landing' ? 50 : 20))
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [variant])

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    if (href === '/vaults') return pathname.startsWith('/vaults')
    if (href === '/leaderboard') return pathname.startsWith('/leaderboard')
    if (href === '/stake') return pathname === '/stake'
    if (href === '/token') return pathname === '/token'
    return false
  }

  if (variant === 'landing') {
    return (
      <nav className={`fixed top-0 left-0 w-full z-40 transition-all duration-300 ${scrolled ? 'bg-[#0A0A0A]/80 backdrop-blur-md border-b border-[#333]' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="font-mono font-bold text-2xl tracking-tighter text-white">
            GORDON<span className="text-[#00FF66]">.fi</span>
          </div>
          {!isMobile && (
            <div className="hidden md:flex items-center gap-8 font-mono text-sm tracking-widest uppercase">
              {landingLinks.map(link => (
                <Link key={link.label} href={link.href} className="text-[#6B6B6B] hover:text-[#00FF66] relative group transition-colors">
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-[#00FF66] transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
            </div>
          )}
          <div className="flex items-center gap-4">
            {!isMobile ? (
              <div className="flex items-center gap-3">
                <ConnectButton />
                <Link href="/dashboard" className="bg-[#00FF66] text-black font-mono font-bold text-sm px-6 py-3 uppercase tracking-wider hover:bg-white transition-colors group flex items-center gap-2">
                  Launch App
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            ) : (
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-[#00FF66]">
                {mobileMenuOpen ? <X /> : <Menu />}
              </button>
            )}
          </div>
        </div>
        {isMobile && mobileMenuOpen && (
          <div className="absolute top-20 left-0 w-full bg-[#0A0A0A] border-b border-[#333] p-4 flex flex-col gap-4 font-mono uppercase tracking-widest text-sm z-50">
            {landingLinks.map(link => (
              <Link key={link.label} href={link.href} className="text-[#6B6B6B] py-2 border-b border-[#222]">{link.label}</Link>
            ))}
            <Link href="/dashboard" className="bg-[#00FF66] text-black font-bold py-3 mt-4 w-full block text-center">LAUNCH APP -{'>'}</Link>
          </div>
        )}
      </nav>
    )
  }

  // App variant
  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#333]' : 'bg-transparent border-b border-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-mono font-bold text-xl tracking-tighter text-white cursor-pointer">
          GORDON<span className="text-[#00FF66]">.fi</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {appLinks.map(link => {
            const active = isActive(link.href)
            return (
              <Link key={link.label} href={link.href} className={`font-mono text-xs uppercase tracking-widest relative group transition-colors ${active ? 'text-white' : 'text-[#6B6B6B] hover:text-[#00FF66]'}`}>
                {link.label}
                <span className={`absolute -bottom-1 left-0 h-[1px] transition-all duration-300 ${active ? 'w-full bg-white' : 'w-0 bg-[#00FF66] group-hover:w-full'}`} />
              </Link>
            )
          })}
        </div>
        <ConnectButton />
      </div>
    </nav>
  )
}
