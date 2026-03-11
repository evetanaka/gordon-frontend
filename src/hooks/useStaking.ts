'use client'

import { useReadContract, useWriteContract, useAccount } from 'wagmi'
import { type Address, parseUnits } from 'viem'
import StakingABI from '@/config/abis/GDNStaking.json'
import { CONTRACTS } from '@/config/contracts'

const STAKING = CONTRACTS.GDNStaking as Address

export function useStaking() {
  const { address } = useAccount()
  const { writeContract, isPending: isWritePending } = useWriteContract()

  const stakeInfo = useReadContract({
    address: STAKING,
    abi: StakingABI,
    functionName: 'stakes',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const loyaltyTier = useReadContract({
    address: STAKING,
    abi: StakingABI,
    functionName: 'loyaltyTier',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const totalDeposited = useReadContract({
    address: STAKING,
    abi: StakingABI,
    functionName: 'totalDeposited',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const totalEffectiveStaked = useReadContract({
    address: STAKING,
    abi: StakingABI,
    functionName: 'totalEffectiveStaked',
  })

  const isStaking = useReadContract({
    address: STAKING,
    abi: StakingABI,
    functionName: 'isStaking',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const timeUntilUnlock = useReadContract({
    address: STAKING,
    abi: StakingABI,
    functionName: 'timeUntilUnlock',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const pendingRewards = useReadContract({
    address: STAKING,
    abi: StakingABI,
    functionName: 'pendingRewards',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const stake = (amount: string, lockMonths: number) => {
    writeContract({
      address: STAKING,
      abi: StakingABI,
      functionName: 'stake',
      args: [parseUnits(amount, 18), BigInt(lockMonths)],
    })
  }

  const unstake = () => {
    writeContract({
      address: STAKING,
      abi: StakingABI,
      functionName: 'unstake',
    })
  }

  const claimRewards = () => {
    writeContract({
      address: STAKING,
      abi: StakingABI,
      functionName: 'claimRewards',
    })
  }

  return {
    stakeInfo: stakeInfo.data as [bigint, bigint, bigint, bigint, number, bigint] | undefined,
    loyaltyTier: loyaltyTier.data as number | undefined,
    totalDeposited: totalDeposited.data as bigint | undefined,
    totalEffectiveStaked: totalEffectiveStaked.data as bigint | undefined,
    isStaking: isStaking.data as boolean | undefined,
    timeUntilUnlock: timeUntilUnlock.data as bigint | undefined,
    pendingRewards: pendingRewards.data as bigint | undefined,
    stake,
    unstake,
    claimRewards,
    isLoading: stakeInfo.isLoading,
    isWritePending,
    error: stakeInfo.error,
  }
}
