'use client'

import { useReadContract, useWriteContract, useAccount } from 'wagmi'
import { type Address, parseUnits } from 'viem'
import GDNTokenABI from '@/config/abis/GDNToken.json'
import USDCABI from '@/config/abis/USDC.json'
import { CONTRACTS } from '@/config/contracts'

export function useAllowance(token: 'GDN' | 'USDC', spender: Address | undefined) {
  const { address } = useAccount()
  const tokenAddress = (token === 'GDN' ? CONTRACTS.GDNToken : CONTRACTS.USDC) as Address
  const abi = token === 'GDN' ? GDNTokenABI : USDCABI

  const result = useReadContract({
    address: tokenAddress,
    abi,
    functionName: 'allowance',
    args: address && spender ? [address, spender] : undefined,
    query: { enabled: !!address && !!spender },
  })

  return { allowance: result.data as bigint | undefined, ...result }
}

export function useToken(token: 'GDN' | 'USDC') {
  const { address } = useAccount()
  const { writeContract, isPending: isWritePending } = useWriteContract()

  const tokenAddress = (token === 'GDN' ? CONTRACTS.GDNToken : CONTRACTS.USDC) as Address
  const abi = token === 'GDN' ? GDNTokenABI : USDCABI
  const decimals = token === 'GDN' ? 18 : 6

  const balance = useReadContract({
    address: tokenAddress,
    abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const totalSupply = useReadContract({
    address: tokenAddress,
    abi,
    functionName: 'totalSupply',
    query: { enabled: token === 'GDN' },
  })

  const approve = (spender: Address, amount: string) => {
    writeContract({
      address: tokenAddress,
      abi,
      functionName: 'approve',
      args: [spender, parseUnits(amount, decimals)],
    })
  }

  return {
    balance: balance.data as bigint | undefined,
    totalSupply: totalSupply.data as bigint | undefined,
    approve,
    decimals,
    tokenAddress,
    isLoading: balance.isLoading,
    isWritePending,
    error: balance.error,
  }
}
