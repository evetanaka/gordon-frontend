'use client'

import { useReadContract, useWriteContract, useAccount } from 'wagmi'
import { type Address, parseUnits } from 'viem'
import GDNTokenABI from '@/config/abis/GDNToken.json'
import MockUSDCABI from '@/config/abis/MockUSDC.json'
import { CONTRACTS } from '@/config/contracts'

export function useToken(token: 'GDN' | 'USDC') {
  const { address } = useAccount()
  const { writeContract, isPending: isWritePending } = useWriteContract()

  const tokenAddress = (token === 'GDN' ? CONTRACTS.GDNToken : CONTRACTS.MockUSDC) as Address
  const abi = token === 'GDN' ? GDNTokenABI : MockUSDCABI
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

  const getAllowance = (spender: Address) => useReadContract({
    address: tokenAddress,
    abi,
    functionName: 'allowance',
    args: address ? [address, spender] : undefined,
    query: { enabled: !!address },
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
    getAllowance,
    approve,
    decimals,
    tokenAddress,
    isLoading: balance.isLoading,
    isWritePending,
    error: balance.error,
  }
}
