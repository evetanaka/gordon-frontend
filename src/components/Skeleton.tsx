'use client'

import React from 'react';

// Base shimmer block
export const Shimmer = ({ className = '', style }: { className?: string; style?: React.CSSProperties }) => (
  <div className={`bg-[#111] overflow-hidden relative ${className}`} style={style}>
    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-[#222] to-transparent" />
  </div>
);

// Navbar skeleton (shared across all pages)
export const NavSkeleton = () => (
  <div className="fixed top-0 w-full z-50 bg-[#0A0A0A] border-b border-[#333]">
    <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
      <Shimmer className="w-28 h-5" />
      <div className="hidden md:flex items-center gap-8">
        {[1, 2, 3, 4, 5].map(i => <Shimmer key={i} className="w-16 h-3" />)}
      </div>
      <Shimmer className="w-32 h-8" />
    </div>
  </div>
);

// Bottom nav skeleton
export const BottomNavSkeleton = () => (
  <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#0A0A0A] border-t border-[#333] z-50 flex justify-around items-center h-16 pb-safe">
    {[1, 2, 3, 4].map(i => (
      <div key={i} className="flex flex-col items-center gap-1">
        <Shimmer className="w-5 h-5" />
        <Shimmer className="w-8 h-2" />
      </div>
    ))}
  </div>
);

// Section header skeleton
export const SectionHeaderSkeleton = () => (
  <div className="mb-6">
    <Shimmer className="w-40 h-3 mb-2" />
    <div className="w-full h-[1px] bg-[#222]" />
  </div>
);

// Stats card skeleton
export const StatCardSkeleton = () => (
  <div className="bg-[#111] border border-[#222] p-4">
    <Shimmer className="w-16 h-2 mb-3" />
    <Shimmer className="w-24 h-6 mb-2" />
    <Shimmer className="w-20 h-2" />
  </div>
);

// Chart skeleton
export const ChartSkeleton = () => (
  <div className="bg-[#111] border border-[#222] p-4 h-[300px] flex items-end justify-between gap-1">
    {Array.from({ length: 30 }).map((_, i) => (
      <Shimmer key={i} className="flex-1" style={{ height: `${20 + Math.sin(i * 0.4) * 30 + Math.random() * 20}%` } as React.CSSProperties} />
    ))}
  </div>
);

// Table row skeleton
export const TableRowSkeleton = ({ cols = 6 }: { cols?: number }) => (
  <div className="flex items-center gap-4 px-4 py-3 border-b border-[#222]">
    {Array.from({ length: cols }).map((_, i) => (
      <Shimmer key={i} className={`h-3 ${i === 0 ? 'w-8' : i === 1 ? 'w-24' : 'w-16'}`} />
    ))}
  </div>
);

// Card skeleton (vault-style)
export const VaultCardSkeleton = () => (
  <div className="bg-[#111] border border-[#222]">
    <div className="p-5">
      <div className="flex justify-between mb-4">
        <div>
          <Shimmer className="w-32 h-5 mb-2" />
          <Shimmer className="w-48 h-2" />
        </div>
        <div className="text-right">
          <Shimmer className="w-16 h-7 mb-1" />
          <Shimmer className="w-10 h-2" />
        </div>
      </div>
      <div className="flex gap-1.5 mb-4">
        {[1, 2, 3].map(i => <Shimmer key={i} className="w-20 h-4" />)}
      </div>
      <Shimmer className="w-full h-3 mb-1" />
      <Shimmer className="w-3/4 h-3" />
    </div>
    <div className="px-5 py-3 border-t border-[#222] grid grid-cols-3 gap-4">
      {[1, 2, 3].map(i => (
        <div key={i}>
          <Shimmer className="w-10 h-2 mb-2" />
          <Shimmer className="w-16 h-4" />
        </div>
      ))}
    </div>
    <div className="p-5 pt-4">
      <Shimmer className="w-full h-10" />
    </div>
  </div>
);

// Staking position skeleton
export const StakePositionSkeleton = () => (
  <div className="bg-[#111] border border-[#222]">
    <div className="p-6 border-b border-[#222]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Shimmer className="w-16 h-16" />
          <div>
            <Shimmer className="w-12 h-2 mb-2" />
            <Shimmer className="w-20 h-5 mb-1" />
            <Shimmer className="w-24 h-2" />
          </div>
        </div>
        <div className="text-right">
          <Shimmer className="w-12 h-2 mb-2" />
          <Shimmer className="w-16 h-7" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i}>
            <Shimmer className="w-12 h-2 mb-2" />
            <Shimmer className="w-20 h-4" />
          </div>
        ))}
      </div>
    </div>
    <div className="p-6">
      <Shimmer className="w-full h-3 mb-3" />
      <Shimmer className="w-2/3 h-2" />
    </div>
  </div>
);

// Stake form skeleton
export const StakeFormSkeleton = () => (
  <div className="bg-[#111] border border-[#222]">
    <div className="flex border-b border-[#222]">
      <Shimmer className="flex-1 h-12" />
      <Shimmer className="flex-1 h-12" />
    </div>
    <div className="p-6">
      <div className="flex justify-between mb-2">
        <Shimmer className="w-16 h-2" />
        <Shimmer className="w-24 h-2" />
      </div>
      <Shimmer className="w-full h-14 mb-3" />
      <div className="grid grid-cols-4 gap-2 mb-5">
        {[1, 2, 3, 4].map(i => <Shimmer key={i} className="h-8" />)}
      </div>
      <Shimmer className="w-full h-12" />
    </div>
  </div>
);

// Leaderboard wallet card (mobile)
export const WalletCardSkeleton = () => (
  <div className="bg-[#111] border border-[#222] p-4">
    <div className="flex justify-between mb-3">
      <Shimmer className="w-28 h-4" />
      <Shimmer className="w-12 h-4" />
    </div>
    <div className="grid grid-cols-3 gap-3 mb-2">
      {[1, 2, 3].map(i => (
        <div key={i}>
          <Shimmer className="w-12 h-2 mb-1" />
          <Shimmer className="w-16 h-4" />
        </div>
      ))}
    </div>
    <Shimmer className="w-48 h-2" />
  </div>
);

// Burn log entry skeleton
export const BurnLogSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3, 4, 5].map(i => (
      <div key={i} className="border-b border-[#111] pb-3">
        <div className="flex items-center gap-3 mb-1">
          <Shimmer className="w-36 h-3" />
          <Shimmer className="w-8 h-3" />
          <Shimmer className="w-20 h-3" />
          <Shimmer className="w-16 h-3" />
        </div>
        <Shimmer className="w-48 h-2 ml-4" />
      </div>
    ))}
  </div>
);
