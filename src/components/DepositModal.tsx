'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown, ChevronUp, ExternalLink, ArrowRight, Check, Loader2, Zap } from 'lucide-react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { type Address, parseUnits, formatUnits } from 'viem';
import { useToken, useAllowance } from '@/hooks/useToken';
import { useVault } from '@/hooks/useVault';
import VaultABI from '@/config/abis/GordonVaultETH.json';
import MockUSDCABI from '@/config/abis/MockUSDC.json';
import { CONTRACTS } from '@/config/contracts';

// --- LOYALTY RANK SYSTEM (kept for UI — reads mock GDN staking for now) ---

interface LoyaltyRank {
  rank: 'none' | 'bronze' | 'silver' | 'gold' | 'platinum';
  label: string;
  emoji: string;
  feePercent: number;
  stakeRatio: number;
  nextRank: {
    rank: string;
    emoji: string;
    label: string;
    feePercent: number;
    gdnNeeded: number;
    usdcNeeded: number;
  } | null;
}

const RANK_TIERS = [
  { rank: 'none', label: 'Unranked', emoji: '—', feePercent: 1.0, minRatio: 0, minDeposit: 0 },
  { rank: 'bronze', label: 'Bronze', emoji: '🥉', feePercent: 0.75, minRatio: 0.01, minDeposit: 0 },
  { rank: 'silver', label: 'Silver', emoji: '🥈', feePercent: 0.50, minRatio: 0.05, minDeposit: 0 },
  { rank: 'gold', label: 'Gold', emoji: '🥇', feePercent: 0.25, minRatio: 0.10, minDeposit: 0 },
  { rank: 'platinum', label: 'Platinum', emoji: '💎', feePercent: 0.10, minRatio: 0.10, minDeposit: 500000 },
] as const;

const GDN_PRICE = 0.842;

export function calculateLoyaltyRank(gdnStaked: number, totalDeposited: number): LoyaltyRank {
  const gdnValue = gdnStaked * GDN_PRICE;
  const ratio = totalDeposited > 0 ? gdnValue / totalDeposited : 0;

  let currentIdx = 0;
  if (ratio >= 0.10 && totalDeposited >= 500000) currentIdx = 4;
  else if (ratio >= 0.10) currentIdx = 3;
  else if (ratio >= 0.05) currentIdx = 2;
  else if (ratio >= 0.01) currentIdx = 1;

  const current = RANK_TIERS[currentIdx];
  const next = currentIdx < 4 ? RANK_TIERS[currentIdx + 1] : null;

  let gdnNeeded = 0;
  let usdcNeeded = 0;
  if (next) {
    const requiredValue = next.minRatio * totalDeposited;
    gdnNeeded = Math.max(0, Math.ceil((requiredValue - gdnValue) / GDN_PRICE));
    if (next.minDeposit > 0) usdcNeeded = Math.max(0, next.minDeposit - totalDeposited);
  }

  return {
    rank: current.rank as any,
    label: current.label,
    emoji: current.emoji,
    feePercent: current.feePercent,
    stakeRatio: ratio,
    nextRank: next ? {
      rank: next.rank,
      emoji: next.emoji,
      label: next.label,
      feePercent: next.feePercent,
      gdnNeeded,
      usdcNeeded,
    } : null,
  };
}

// --- COMPONENT ---

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  vaultAddress: Address;
  vaultName: string;
  shareSymbol: string;
  onSuccess?: () => void;
}

export function DepositModal({ isOpen, onClose, vaultAddress, vaultName, shareSymbol, onSuccess }: DepositModalProps) {
  const { address, isConnected } = useAccount();
  const { balance: usdcBalance } = useToken('USDC');
  const { allowance, refetch: refetchAllowance } = useAllowance('USDC', vaultAddress);
  const vault = useVault(vaultAddress);

  // Separate write hooks for approve and deposit
  const { writeContract: writeApprove, isPending: isApprovePending, data: approveTxHash, error: approveError, reset: resetApprove } = useWriteContract();
  const { writeContract: writeDeposit, isPending: isDepositPending, data: depositTxHash, error: depositError, reset: resetDeposit } = useWriteContract();

  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } = useWaitForTransactionReceipt({ hash: approveTxHash });
  const { isLoading: isDepositConfirming, isSuccess: isDepositConfirmed } = useWaitForTransactionReceipt({ hash: depositTxHash });

  const [amount, setAmount] = useState('');
  const [rankExpanded, setRankExpanded] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mock loyalty rank (needs real staking data)
  const loyaltyRank = calculateLoyaltyRank(0, 0);

  // Derived values
  const usdcBalanceNum = usdcBalance ? parseFloat(formatUnits(usdcBalance, 6)) : 0;
  const numAmount = parseFloat(amount.replace(/,/g, '')) || 0;
  const amountBigInt = numAmount > 0 ? parseUnits(amount.replace(/,/g, ''), 6) : BigInt(0);
  const exceedsBalance = numAmount > usdcBalanceNum;
  const needsApproval = allowance !== undefined && amountBigInt > BigInt(0) && allowance < amountBigInt;
  const hasEnoughAllowance = allowance !== undefined && amountBigInt > BigInt(0) && allowance >= amountBigInt;
  const isValid = numAmount > 0 && !exceedsBalance && isConnected;

  // On-chain fee from vault
  const depositFeePct = vault.depositFeeBps ? Number(vault.depositFeeBps) / 100 : 0;
  const feeAmount = numAmount * (depositFeePct / 100);
  const netAmount = numAmount - feeAmount;
  const sharePrice = vault.sharePrice ? parseFloat(formatUnits(vault.sharePrice, 6)) : 1;
  const shares = sharePrice > 0 ? netAmount / sharePrice : 0;

  const formatNum = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 2 });

  // Refetch allowance when approve confirms
  useEffect(() => {
    if (isApproveConfirmed) {
      refetchAllowance();
    }
  }, [isApproveConfirmed, refetchAllowance]);

  // Call onSuccess when deposit confirms
  useEffect(() => {
    if (isDepositConfirmed) {
      onSuccess?.();
    }
  }, [isDepositConfirmed, onSuccess]);

  // Track errors
  useEffect(() => {
    if (approveError) setTxError(approveError.message?.includes('User rejected') ? 'Transaction rejected by user' : approveError.message?.slice(0, 100) || 'Approval failed');
    if (depositError) setTxError(depositError.message?.includes('User rejected') ? 'Transaction rejected by user' : depositError.message?.slice(0, 100) || 'Deposit failed');
  }, [approveError, depositError]);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      setAmount('');
      setTxError(null);
      resetApprove();
      resetDeposit();
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  useEffect(() => {
    if (visible && inputRef.current) inputRef.current.focus();
  }, [visible]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9.]/g, '');
    if (raw === '' || /^\d*\.?\d{0,6}$/.test(raw)) {
      setAmount(raw);
      setTxError(null);
    }
  };

  const handleQuickSelect = (pct: number) => {
    const val = pct === 1 ? usdcBalanceNum : Math.floor(usdcBalanceNum * pct * 100) / 100;
    setAmount(val.toString());
    setTxError(null);
  };

  const handleApprove = () => {
    setTxError(null);
    writeApprove({
      address: CONTRACTS.MockUSDC as Address,
      abi: MockUSDCABI,
      functionName: 'approve',
      args: [vaultAddress, amountBigInt],
    });
  };

  const handleDeposit = () => {
    setTxError(null);
    writeDeposit({
      address: vaultAddress,
      abi: VaultABI,
      functionName: 'deposit',
      args: [amountBigInt],
    });
  };

  const handlePrimaryCTA = () => {
    if (!isValid) return;
    if (needsApproval) handleApprove();
    else handleDeposit();
  };

  const close = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  if (!mounted) return null;

  const isProcessing = isApprovePending || isApproveConfirming || isDepositPending || isDepositConfirming;

  // Determine step status
  const approveComplete = hasEnoughAllowance || isApproveConfirmed;
  const depositComplete = isDepositConfirmed;

  const progressPct = loyaltyRank.rank === 'none' ? 0
    : loyaltyRank.rank === 'bronze' ? 25
    : loyaltyRank.rank === 'silver' ? 50
    : loyaltyRank.rank === 'gold' ? 75
    : 100;

  const modal = (
    <div className={`fixed inset-0 z-[200] flex items-end md:items-center justify-center transition-all duration-300 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={close} />

      <div className={`relative w-full md:max-w-lg bg-[#111] border border-[#333] md:border max-h-[90vh] overflow-y-auto transition-all duration-300 ${visible ? 'translate-y-0 md:scale-100' : 'translate-y-full md:translate-y-0 md:scale-95'}`}>

        {depositComplete ? (
          /* SUCCESS STATE */
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center">
              <svg viewBox="0 0 52 52" className="w-16 h-16">
                <circle cx="26" cy="26" r="25" fill="none" stroke="#00FF66" strokeWidth="2" strokeDasharray="157" strokeDashoffset="157" style={{ animation: 'draw-circle 0.6s ease-in-out forwards' }} />
                <path d="M14 27l7 7 16-16" fill="none" stroke="#00FF66" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="40" strokeDashoffset="40" style={{ animation: 'draw-check 0.4s ease-in-out 0.4s forwards' }} />
              </svg>
            </div>
            <div className="font-mono text-xs text-[#00FF66] uppercase tracking-widest mb-2">Deposit Successful</div>
            <div className="font-sans font-bold text-2xl text-white mb-1">{formatNum(numAmount)} USDC</div>
            <div className="text-[#6B6B6B] font-mono text-xs mb-6">deposited into {vaultName}</div>

            {depositTxHash && (
              <div className="bg-[#0A0A0A] border border-[#333] px-4 py-3 my-6 flex items-center justify-between">
                <span className="font-mono text-xs text-[#6B6B6B]">Tx: {depositTxHash.slice(0, 6)}...{depositTxHash.slice(-4)}</span>
                <a href={`https://sepolia.etherscan.io/tx/${depositTxHash}`} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] text-[#6B6B6B] hover:text-[#00FF66] flex items-center gap-1 uppercase tracking-widest transition-colors">
                  Etherscan <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button onClick={close} className="py-3 bg-[#00FF66] text-black font-mono font-bold text-xs uppercase tracking-wider hover:bg-white transition-colors">Done</button>
              <button onClick={close} className="py-3 border border-[#333] text-white font-mono text-xs uppercase tracking-widest hover:border-[#00FF66] transition-colors">Close</button>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#333]">
              <div>
                <div className="font-mono text-xs text-[#6B6B6B] uppercase tracking-widest mb-1">Deposit into</div>
                <div className="font-sans font-bold text-lg text-white">{vaultName}</div>
              </div>
              <button onClick={close} className="w-8 h-8 flex items-center justify-center text-[#6B6B6B] hover:text-white transition-colors"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-5 space-y-5">
              {/* Network */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono text-xs text-[#6B6B6B]">
                  Network: <span className="text-white flex items-center gap-1.5">Sepolia <span className="w-2 h-2 rounded-full bg-[#00FF66]" /></span>
                </div>
              </div>

              {/* Amount Input */}
              <div className={`bg-[#0A0A0A] border p-4 transition-colors ${exceedsBalance ? 'border-[#FF3B3B]' : 'border-[#333] focus-within:border-[#00FF66]'}`}>
                <div className="flex items-center justify-between mb-1">
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={amount}
                    onChange={handleAmountChange}
                    disabled={isProcessing}
                    className="bg-transparent font-sans font-bold text-3xl text-white outline-none w-full placeholder-[#333]"
                  />
                  <div className="text-right shrink-0 ml-4">
                    <div className="font-mono text-sm text-white">USDC</div>
                    <div className="font-mono text-[10px] text-[#6B6B6B]">Balance: ${formatNum(usdcBalanceNum)}</div>
                  </div>
                </div>
                {exceedsBalance && <div className="font-mono text-[10px] text-[#FF3B3B] mt-1">Insufficient balance</div>}
                <div className="flex gap-2 mt-3">
                  {[0.25, 0.5, 0.75, 1].map(pct => {
                    const label = pct === 1 ? 'MAX' : `${pct * 100}%`;
                    const targetVal = pct === 1 ? usdcBalanceNum : Math.floor(usdcBalanceNum * pct * 100) / 100;
                    const isActive = Math.abs(numAmount - targetVal) < 0.01;
                    return (
                      <button
                        key={pct}
                        onClick={() => handleQuickSelect(pct)}
                        disabled={isProcessing}
                        className={`flex-1 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors ${isActive ? 'bg-[#00FF66] text-black' : 'bg-[#222] text-[#6B6B6B] hover:text-white'}`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Loyalty Rank */}
              <div className="bg-[#0A0A0A] border border-[#333]">
                <button
                  onClick={() => setRankExpanded(!rankExpanded)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{loyaltyRank.emoji}</span>
                    <div>
                      <div className="font-mono text-xs text-white uppercase tracking-widest">{loyaltyRank.label} Rank</div>
                      <div className="font-mono text-[10px] text-[#6B6B6B]">Deposit fee: {depositFeePct.toFixed(2)}% (on-chain)</div>
                    </div>
                  </div>
                  {rankExpanded ? <ChevronUp className="w-4 h-4 text-[#6B6B6B]" /> : <ChevronDown className="w-4 h-4 text-[#6B6B6B]" />}
                </button>

                {rankExpanded && (
                  <div className="px-4 pb-4 space-y-4">
                    <div>
                      <div className="relative w-full h-1.5 bg-[#222] mb-3">
                        <div className="absolute top-0 left-0 h-full bg-[#00FF66] transition-all duration-700 ease-out" style={{ width: `${progressPct}%` }} />
                        {[0, 25, 50, 75, 100].map((pos, i) => (
                          <div key={i} className={`absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 ${pos <= progressPct ? 'bg-[#00FF66] border-[#00FF66]' : 'bg-[#222] border-[#333]'} ${pos === progressPct ? 'animate-pulse shadow-[0_0_8px_rgba(0,255,102,0.5)]' : ''}`} style={{ left: `${pos}%`, transform: `translate(-50%, -50%)` }} />
                        ))}
                      </div>
                      <div className="flex justify-between font-mono text-[9px] text-[#6B6B6B] uppercase tracking-widest">
                        <span>🥉 Bronze</span>
                        <span>🥈 Silver</span>
                        <span>🥇 Gold</span>
                        <span>💎 Platinum</span>
                      </div>
                    </div>

                    {loyaltyRank.nextRank && (
                      <div className="bg-[#111] border border-[#333] p-3 flex items-center justify-between gap-3">
                        <div className="font-mono text-[10px] text-[#6B6B6B]">
                          <Zap className="w-3 h-3 text-[#FFD700] inline mr-1" />
                          Stake <span className="text-white">$GDN</span> to unlock fee discounts
                        </div>
                        <button className="font-mono text-[10px] text-[#00FF66] hover:text-white uppercase tracking-widest whitespace-nowrap transition-colors flex items-center gap-1">
                          Stake <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Summary */}
              {numAmount > 0 && !exceedsBalance && (
                <div className="space-y-0 border border-[#333]">
                  {[
                    { label: 'You deposit', value: `${formatNum(numAmount)} USDC`, color: 'text-white' },
                    { label: `Deposit fee (${depositFeePct.toFixed(2)}%)`, value: `-${formatNum(feeAmount)} USDC`, color: 'text-[#FFD700]' },
                    { label: 'Net deposited', value: `${formatNum(netAmount)} USDC`, color: 'text-white font-bold' },
                    { label: 'Est. shares', value: `~${formatNum(shares)} ${shareSymbol}`, color: 'text-[#6B6B6B]' },
                    { label: 'Performance fee', value: '20% on profits only', color: 'text-[#6B6B6B]' },
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between items-center px-4 py-2.5 border-b border-[#222] last:border-b-0 animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                      <span className="font-mono text-xs text-[#6B6B6B]">{row.label}</span>
                      <span className={`font-mono text-xs ${row.color}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Error display */}
              {txError && (
                <div className="bg-[#FF3B3B]/10 border border-[#FF3B3B]/30 p-3 font-mono text-xs text-[#FF3B3B]">
                  {txError}
                </div>
              )}

              {/* Transaction Steps */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1">
                    <div className={`w-5 h-5 flex items-center justify-center text-[10px] font-mono font-bold ${approveComplete ? 'bg-[#00FF66] text-black' : (isApprovePending || isApproveConfirming) ? 'bg-[#00FF66]/50 text-black animate-pulse' : 'bg-[#333] text-[#6B6B6B]'}`}>
                      {approveComplete ? <Check className="w-3 h-3" /> : '1'}
                    </div>
                    <span className="font-mono text-[10px] text-[#6B6B6B] uppercase tracking-widest hidden md:inline">Approve</span>
                  </div>
                  <div className={`flex-1 h-[1px] ${approveComplete ? 'bg-[#00FF66]' : 'bg-[#333]'}`} />
                  <div className="flex items-center gap-1">
                    <div className={`w-5 h-5 flex items-center justify-center text-[10px] font-mono font-bold ${depositComplete ? 'bg-[#00FF66] text-black' : (isDepositPending || isDepositConfirming) ? 'bg-[#00FF66]/50 text-black animate-pulse' : approveComplete ? 'bg-[#333] text-white' : 'bg-[#333] text-[#6B6B6B]'}`}>
                      {depositComplete ? <Check className="w-3 h-3" /> : '2'}
                    </div>
                    <span className="font-mono text-[10px] text-[#6B6B6B] uppercase tracking-widest hidden md:inline">Deposit</span>
                  </div>
                </div>

                <button
                  onClick={handlePrimaryCTA}
                  disabled={!isValid || isProcessing}
                  className={`w-full py-3.5 font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    !isValid ? 'bg-[#333] text-[#6B6B6B] cursor-not-allowed'
                    : isProcessing ? 'bg-[#00FF66]/50 text-black border border-[#00FF66] animate-pulse cursor-wait'
                    : 'bg-[#00FF66] text-black hover:bg-white'
                  }`}
                >
                  {(isApprovePending || isApproveConfirming) && <><Loader2 className="w-4 h-4 animate-spin" /> {isApprovePending ? 'Confirm in Wallet...' : 'Approving...'}</>}
                  {(isDepositPending || isDepositConfirming) && <><Loader2 className="w-4 h-4 animate-spin" /> {isDepositPending ? 'Confirm in Wallet...' : 'Depositing...'}</>}
                  {!isProcessing && needsApproval && isValid && 'Approve USDC'}
                  {!isProcessing && hasEnoughAllowance && isValid && `Deposit ${formatNum(numAmount)} USDC`}
                  {!isProcessing && !isValid && (numAmount === 0 ? 'Enter Amount' : !isConnected ? 'Connect Wallet' : 'Insufficient Balance')}
                </button>

                <div className="font-mono text-[10px] text-[#6B6B6B] text-center mt-2">
                  {!isProcessing && needsApproval && 'Step 1: Approve the vault to spend your USDC'}
                  {!isProcessing && hasEnoughAllowance && `Step 2: Confirm deposit of ${formatNum(numAmount)} USDC`}
                  {(isApprovePending) && 'Please confirm in your wallet...'}
                  {(isApproveConfirming) && 'Waiting for on-chain confirmation...'}
                  {(isDepositPending) && 'Please confirm in your wallet...'}
                  {(isDepositConfirming) && 'Confirming transaction on-chain...'}
                </div>
              </div>

              <div className="font-mono text-[10px] text-[#6B6B6B] text-center pt-2 border-t border-[#222]">
                By depositing, you agree to the vault terms. Past performance ≠ future results.
              </div>
            </div>
          </>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes draw-circle { to { stroke-dashoffset: 0; } }
        @keyframes draw-check { to { stroke-dashoffset: 0; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.3s ease forwards; opacity: 0; }
      `}} />
    </div>
  );

  return createPortal(modal, document.body);
}
