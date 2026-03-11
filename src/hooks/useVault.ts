'use client'

import { useReadContract, useWriteContract, useAccount } from 'wagmi'
import { type Address, parseUnits } from 'viem'
import VaultABI from '@/config/abis/GordonVaultETH.json'

export function useVault(vaultAddress: Address) {
  const { address } = useAccount()
  const { writeContract, isPending: isWritePending } = useWriteContract()

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
    userPosition: userPosition.data as [bigint, bigint] | undefined,
    depositFeeBps: depositFeeBps.data as bigint | undefined,
    withdrawFeeBps: withdrawFeeBps.data as bigint | undefined,
    deposit,
    withdraw,
    isLoading,
    isWritePending,
    error: totalAssets.error || sharePrice.error,
  }
}
