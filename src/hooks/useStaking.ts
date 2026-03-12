'use client'

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { type Address, parseUnits } from 'viem'
import StakingABI from '@/config/abis/GDNStaking.json'
import { CONTRACTS } from '@/config/contracts'

const STAKING = CONTRACTS.GDNStaking as Address

export function useStaking() {
  const { address } = useAccount()

  const {
    writeContract,
    data: txHash,
    isPending: isWritePending,
    reset: resetWrite,
    error: writeError,
  } = useWriteContract()

  const { isLoading: isTxConfirming, isSuccess: isTxConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  // --- Reads ---

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

  const totalEffectiveStaked = useReadContract({
    address: STAKING,
    abi: StakingABI,
    functionName: 'totalEffectiveStaked',
  })

  const pendingRewards = useReadContract({
    address: STAKING,
    abi: StakingABI,
    functionName: 'pendingRewards',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const isStakingRead = useReadContract({
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

  // --- Writes ---

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

  // Parse stake info tuple: (amount, effectiveAmount, lockStart, lockEnd, boostBps, rewardDebt)
  const stakeData = stakeInfo.data as
    | [bigint, bigint, bigint, bigint, number, bigint]
    | undefined

  const refetchAll = () => {
    stakeInfo.refetch()
    loyaltyTier.refetch()
    totalEffectiveStaked.refetch()
    pendingRewards.refetch()
    isStakingRead.refetch()
    timeUntilUnlock.refetch()
  }

  return {
    // Parsed stake fields
    stakedAmount: stakeData?.[0],
    effectiveAmount: stakeData?.[1],
    lockStart: stakeData?.[2],
    lockEnd: stakeData?.[3],
    boostBps: stakeData?.[4],
    rewardDebt: stakeData?.[5],

    loyaltyTier: loyaltyTier.data as number | undefined,
    totalEffectiveStaked: totalEffectiveStaked.data as bigint | undefined,
    pendingRewards: pendingRewards.data as bigint | undefined,
    isUserStaking: isStakingRead.data as boolean | undefined,
    timeUntilUnlock: timeUntilUnlock.data as bigint | undefined,

    // Write actions
    stake,
    unstake,
    claimRewards,

    // Tx state
    txHash,
    isWritePending,
    isTxConfirming,
    isTxConfirmed,
    writeError,
    resetWrite,
    refetchAll,

    isLoading: stakeInfo.isLoading,
    error: stakeInfo.error,
  }
}
