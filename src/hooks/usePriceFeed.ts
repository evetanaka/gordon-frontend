'use client'

import { useReadContract } from 'wagmi'
import { type Address } from 'viem'
import PriceFeedABI from '@/config/abis/GDNPriceFeed.json'
import { CONTRACTS } from '@/config/contracts'

const PRICE_FEED = CONTRACTS.GDNPriceFeed as Address

export function usePriceFeed() {
  const price = useReadContract({
    address: PRICE_FEED,
    abi: PriceFeedABI,
    functionName: 'price',
  })

  const updatedAt = useReadContract({
    address: PRICE_FEED,
    abi: PriceFeedABI,
    functionName: 'updatedAt',
  })

  return {
    price: price.data as bigint | undefined,
    lastUpdate: updatedAt.data as bigint | undefined,
    isLoading: price.isLoading,
    error: price.error,
  }
}
