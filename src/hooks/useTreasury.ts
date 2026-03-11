'use client'

import { useReadContract } from 'wagmi'
import { type Address } from 'viem'
import TreasuryABI from '@/config/abis/Treasury.json'
import { CONTRACTS } from '@/config/contracts'

const TREASURY = CONTRACTS.Treasury as Address

export function useTreasury() {
  const stats = useReadContract({
    address: TREASURY,
    abi: TreasuryABI,
    functionName: 'stats',
  })

  const pendingFees = useReadContract({
    address: TREASURY,
    abi: TreasuryABI,
    functionName: 'pendingFees',
  })

  const buybackRatioBps = useReadContract({
    address: TREASURY,
    abi: TreasuryABI,
    functionName: 'buybackRatioBps',
  })

  const rewardRatioBps = useReadContract({
    address: TREASURY,
    abi: TreasuryABI,
    functionName: 'rewardRatioBps',
  })

  const totalGdnBurned = useReadContract({
    address: TREASURY,
    abi: TreasuryABI,
    functionName: 'totalGdnBurned',
  })

  const totalGdnDistributed = useReadContract({
    address: TREASURY,
    abi: TreasuryABI,
    functionName: 'totalGdnDistributed',
  })

  const totalBuybacks = useReadContract({
    address: TREASURY,
    abi: TreasuryABI,
    functionName: 'totalBuybacks',
  })

  return {
    stats: stats.data as [bigint, bigint, bigint, bigint, bigint] | undefined,
    pendingFees: pendingFees.data as bigint | undefined,
    buybackRatioBps: buybackRatioBps.data as bigint | undefined,
    rewardRatioBps: rewardRatioBps.data as bigint | undefined,
    totalGdnBurned: totalGdnBurned.data as bigint | undefined,
    totalGdnDistributed: totalGdnDistributed.data as bigint | undefined,
    totalBuybacks: totalBuybacks.data as bigint | undefined,
    isLoading: stats.isLoading,
    error: stats.error,
  }
}
