'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'

export interface PublicVault {
  slug: string
  name: string
  chain: string | null
  ethAddress: string | null
  description: string | null
  category: string
  categories: string[]
  trackedWallets: number
  openPositions: number
  closedTrades: number
  totalPnl: number
}

export interface VaultDetail extends PublicVault {
  trackedWallets: any[]
  stats: { openPositions: number; closedTrades: number; totalPnl: number }
  mirror: string | null
}

export interface LeaderboardEntry {
  rank: number
  address: string
  score: number
  winRate: number
  trades: number
  pnl: number
  roi: number
  volume: number
  vaults: string[]
}

export function usePublicVaults() {
  const [data, setData] = useState<PublicVault[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    apiFetch<PublicVault[]>('/vaults')
      .then(setData)
      .catch(setError)
      .finally(() => setIsLoading(false))
  }, [])

  return { data, isLoading, error }
}

export function usePublicVault(slug: string) {
  const [data, setData] = useState<VaultDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!slug) return
    apiFetch<VaultDetail>(`/vaults/${slug}`)
      .then(setData)
      .catch(setError)
      .finally(() => setIsLoading(false))
  }, [slug])

  return { data, isLoading, error }
}

export function useLeaderboard(sort = 'score', limit = 50) {
  const [data, setData] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    apiFetch<LeaderboardEntry[]>('/leaderboard', { sort, limit: String(limit) })
      .then(setData)
      .catch(setError)
      .finally(() => setIsLoading(false))
  }, [sort, limit])

  return { data, isLoading, error }
}
