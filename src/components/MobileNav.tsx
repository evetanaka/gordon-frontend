'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Layers, Zap, Coins } from 'lucide-react'

const items = [
  { label: 'Dash', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Vaults', icon: Layers, href: '/vaults' },
  { label: 'Stake', icon: Zap, href: '/stake' },
  { label: '$GDN', icon: Coins, href: '/token' },
]

export default function MobileNav() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    if (href === '/vaults') return pathname.startsWith('/vaults')
    if (href === '/stake') return pathname === '/stake'
    if (href === '/token') return pathname === '/token'
    return false
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#0A0A0A] border-t border-[#333] z-50 flex justify-around items-center h-16 pb-safe">
      {items.map(item => {
        const active = isActive(item.href)
        const Icon = item.icon
        return (
          <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-1 ${active ? 'text-[#00FF66]' : 'text-[#6B6B6B]'}`}>
            <Icon className="w-5 h-5" />
            <span className="font-mono text-[10px] tracking-widest uppercase">{item.label}</span>
          </Link>
        )
      })}
    </div>
  )
}
