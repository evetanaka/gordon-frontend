'use client'

import { useReadContract } from 'wagmi'
import { type Address } from 'viem'
import USDCABI from '@/config/abis/USDC.json'
import { CONTRACTS } from '@/config/contracts'

const TREASURY_SAFE = CONTRACTS.Treasury as Address
const USDC_ADDRESS = CONTRACTS.USDC as Address

/**
 * Treasury is a Gnosis Safe on mainnet, not a deployed Treasury contract.
 * We read USDC balance of the safe and return simplified data.
 * Burns/buybacks are not tracked on-chain yet — return 0.
 */
export function useTreasury() {
  const treasuryBalance = useReadContract({
    address: USDC_ADDRESS,
    abi: USDCABI,
    functionName: 'balanceOf',
    args: [TREASURY_SAFE],
  })

  return {
    treasuryUsdcBalance: treasuryBalance.data as bigint | undefined,
    // These are not available on-chain yet (Gnosis Safe has no such methods)
    stats: undefined,
    pendingFees: undefined,
    buybackRatioBps: undefined,
    rewardRatioBps: undefined,
    totalGdnBurned: undefined,
    totalGdnDistributed: undefined,
    totalBuybacks: undefined,
    isLoading: treasuryBalance.isLoading,
    error: treasuryBalance.error,
  }
}
