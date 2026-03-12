'use client'

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { type Address, parseUnits } from 'viem'
import VaultABI from '@/config/abis/GordonVaultETH.json'

export function useVault(vaultAddress: Address) {
  const { address } = useAccount()
  const { writeContract, isPending: isWritePending, data: txHash, error: writeError, reset } = useWriteContract()

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash })

  const totalAssets = useReadContract({
    address: vaultAddress,
    abi: VaultABI,
    functionName: 'totalAssets',
  })

  const totalShares = useReadContract({
    address: vaultAddress,
    abi: VaultABI,
    functionName: 'totalShares',
  })

  const sharePrice = useReadContract({
    address: vaultAddress,
    abi: VaultABI,
    functionName: 'sharePrice',
  })

  const freeAssets = useReadContract({
    address: vaultAddress,
    abi: VaultABI,
    functionName: 'freeAssets',
  })

  const name = useReadContract({
    address: vaultAddress,
    abi: VaultABI,
    functionName: 'name',
  })

  const userShares = useReadContract({
    address: vaultAddress,
    abi: VaultABI,
    functionName: 'shareBalanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const userPosition = useReadContract({
    address: vaultAddress,
    abi: VaultABI,
    functionName: 'userPosition',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const depositFeeBps = useReadContract({
    address: vaultAddress,
    abi: VaultABI,
    functionName: 'depositFeeBps',
    args: [BigInt(0)],
  })

  const withdrawFeeBps = useReadContract({
    address: vaultAddress,
    abi: VaultABI,
    functionName: 'withdrawFeeBps',
    args: [BigInt(0)],
  })

  const deposit = (amount: string) => {
    writeContract({
      address: vaultAddress,
      abi: VaultABI,
      functionName: 'deposit',
      args: [parseUnits(amount, 6)],
    })
  }

  const withdraw = (shares: bigint) => {
    writeContract({
      address: vaultAddress,
      abi: VaultABI,
      functionName: 'withdraw',
      args: [shares],
    })
  }

  const isLoading = totalAssets.isLoading || totalShares.isLoading || sharePrice.isLoading

  return {
    totalAssets: totalAssets.data as bigint | undefined,
    totalShares: totalShares.data as bigint | undefined,
    sharePrice: sharePrice.data as bigint | undefined,
    freeAssets: freeAssets.data as bigint | undefined,
    name: name.data as string | undefined,
    userShares: userShares.data as bigint | undefined,
    userPosition: userPosition.data as [bigint, bigint] | undefined,
    depositFeeBps: depositFeeBps.data as bigint | undefined,
    withdrawFeeBps: withdrawFeeBps.data as bigint | undefined,
    deposit,
    withdraw,
    isLoading,
    isWritePending,
    isConfirming,
    isConfirmed,
    txHash,
    writeError,
    reset,
    refetchUserShares: userShares.refetch,
    refetchTotalAssets: totalAssets.refetch,
    refetchUserPosition: userPosition.refetch,
    error: totalAssets.error || sharePrice.error,
  }
}

export function useConvertToAssets(vaultAddress: Address, shares: bigint | undefined) {
  const result = useReadContract({
    address: vaultAddress,
    abi: VaultABI,
    functionName: 'convertToAssets',
    args: shares ? [shares] : undefined,
    query: { enabled: !!shares && shares > BigInt(0) },
  })
  return result.data as bigint | undefined
}
