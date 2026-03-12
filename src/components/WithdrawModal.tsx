'use client'

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ExternalLink, Check, Loader2, AlertTriangle } from 'lucide-react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { type Address, formatUnits } from 'viem';
import { useVault, useConvertToAssets } from '@/hooks/useVault';
import VaultABI from '@/config/abis/GordonVaultETH.json';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  vaultAddress: Address;
  vaultName: string;
  shareSymbol: string;
  onSuccess?: () => void;
}

export function WithdrawModal({ isOpen, onClose, vaultAddress, vaultName, shareSymbol, onSuccess }: WithdrawModalProps) {
  const { address, isConnected } = useAccount();
  const vault = useVault(vaultAddress);

  const userShares = vault.userShares;
  const userSharesNum = userShares ? parseFloat(formatUnits(userShares, 6)) : 0;
  const userAssetsValue = useConvertToAssets(vaultAddress, userShares);
  const userValueNum = userAssetsValue ? parseFloat(formatUnits(userAssetsValue, 6)) : 0;

  const { writeContract, isPending: isWritePending, data: txHash, error: writeError, reset: resetWrite } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  const [percentage, setPercentage] = useState(0); // 0-100
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  const withdrawFeePct = vault.withdrawFeeBps ? Number(vault.withdrawFeeBps) / 100 : 0;

  // Calculate amounts from percentage
  const sharesToWithdraw = userShares && percentage > 0
    ? (userShares * BigInt(percentage)) / BigInt(100)
    : BigInt(0);
  const sharesToWithdrawNum = parseFloat(formatUnits(sharesToWithdraw, 6));

  const usdcValue = userValueNum * (percentage / 100);
  const feeAmount = usdcValue * (withdrawFeePct / 100);
  const netReceive = usdcValue - feeAmount;
  const isMax = percentage === 100;
  const isValid = percentage > 0 && isConnected && userSharesNum > 0;

  const formatNum = (n: number, dec = 2) => n.toLocaleString('en-US', { maximumFractionDigits: dec });

  // Track errors
  useEffect(() => {
    if (writeError) {
      setTxError(writeError.message?.includes('User rejected') ? 'Transaction rejected by user' : writeError.message?.slice(0, 100) || 'Withdrawal failed');
    }
  }, [writeError]);

  // Call onSuccess when confirmed
  useEffect(() => {
    if (isConfirmed) {
      onSuccess?.();
    }
  }, [isConfirmed, onSuccess]);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      setPercentage(0);
      setTxError(null);
      resetWrite();
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const handleWithdraw = () => {
    if (!isValid) return;
    setTxError(null);
    writeContract({
      address: vaultAddress,
      abi: VaultABI,
      functionName: 'withdraw',
      args: [sharesToWithdraw],
    });
  };

  const close = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  if (!mounted) return null;

  const isProcessing = isWritePending || isConfirming;

  const modal = (
    <div className={`fixed inset-0 z-[200] flex items-end md:items-center justify-center transition-all duration-300 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={close} />

      <div className={`relative w-full md:max-w-lg bg-[#111] border border-[#333] md:border max-h-[90vh] overflow-y-auto transition-all duration-300 ${visible ? 'translate-y-0 md:scale-100' : 'translate-y-full md:translate-y-0 md:scale-95'}`}>

        {isConfirmed ? (
          /* SUCCESS */
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center">
              <svg viewBox="0 0 52 52" className="w-16 h-16">
                <circle cx="26" cy="26" r="25" fill="none" stroke="#00FF66" strokeWidth="2" strokeDasharray="157" strokeDashoffset="157" style={{ animation: 'draw-circle 0.6s ease-in-out forwards' }} />
                <path d="M14 27l7 7 16-16" fill="none" stroke="#00FF66" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="40" strokeDashoffset="40" style={{ animation: 'draw-check 0.4s ease-in-out 0.4s forwards' }} />
              </svg>
            </div>
            <div className="font-mono text-xs text-[#00FF66] uppercase tracking-widest mb-2">Withdrawal Successful</div>
            <div className="font-sans font-bold text-2xl text-white mb-1">{formatNum(netReceive)} USDC</div>
            <div className="text-[#6B6B6B] font-mono text-xs mb-1">sent to your wallet</div>
            <div className="text-[#6B6B6B] font-mono text-[10px] mb-6">{formatNum(sharesToWithdrawNum, 2)} {shareSymbol} shares redeemed</div>

            {txHash && (
              <div className="bg-[#0A0A0A] border border-[#333] px-4 py-3 mb-6 flex items-center justify-between">
                <span className="font-mono text-xs text-[#6B6B6B]">Tx: {txHash.slice(0, 6)}...{txHash.slice(-4)}</span>
                <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] text-[#6B6B6B] hover:text-[#00FF66] flex items-center gap-1 uppercase tracking-widest transition-colors">
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
                <div className="font-mono text-xs text-[#6B6B6B] uppercase tracking-widest mb-1">Withdraw from</div>
                <div className="font-sans font-bold text-lg text-white">{vaultName}</div>
              </div>
              <button onClick={close} className="w-8 h-8 flex items-center justify-center text-[#6B6B6B] hover:text-white transition-colors"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-5 space-y-5">

              {/* Position Card */}
              <div className="bg-[#0A0A0A] border border-[#333] p-4">
                <div className="font-mono text-[9px] text-[#6B6B6B] uppercase tracking-widest mb-3">YOUR POSITION</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="font-mono text-[9px] text-[#6B6B6B] uppercase tracking-widest mb-1">Shares</div>
                    <div className="font-mono text-sm text-white">{formatNum(userSharesNum, 2)} {shareSymbol}</div>
                  </div>
                  <div>
                    <div className="font-mono text-[9px] text-[#6B6B6B] uppercase tracking-widest mb-1">Value</div>
                    <div className="font-mono text-sm text-white">${formatNum(userValueNum)}</div>
                  </div>
                </div>
              </div>

              {/* Percentage selector */}
              <div>
                <div className="font-mono text-[10px] text-[#6B6B6B] uppercase tracking-widest mb-3">Amount to withdraw</div>
                <div className="flex gap-2 mb-3">
                  {[25, 50, 75, 100].map(pct => (
                    <button
                      key={pct}
                      onClick={() => { setPercentage(pct); setTxError(null); }}
                      disabled={isProcessing}
                      className={`flex-1 py-2.5 font-mono text-xs uppercase tracking-widest transition-colors ${percentage === pct ? 'bg-[#00FF66] text-black font-bold' : 'bg-[#222] text-[#6B6B6B] hover:text-white'}`}
                    >
                      {pct === 100 ? 'MAX' : `${pct}%`}
                    </button>
                  ))}
                </div>
                {percentage > 0 && (
                  <div className="text-center font-mono text-sm text-white">
                    {formatNum(sharesToWithdrawNum, 2)} {shareSymbol} ≈ ${formatNum(usdcValue)}
                  </div>
                )}
              </div>

              {/* Full withdrawal warning */}
              {isMax && isValid && (
                <div className="bg-[#FF3B3B]/5 border border-[#FF3B3B]/20 p-3 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#FF3B3B] shrink-0 mt-0.5" />
                  <span className="font-mono text-[10px] text-[#FF3B3B]">This will close your entire position in {vaultName}.</span>
                </div>
              )}

              {/* Summary */}
              {percentage > 0 && (
                <div className="space-y-0 border border-[#333]">
                  {[
                    { label: 'Shares redeemed', value: `${formatNum(sharesToWithdrawNum, 2)} ${shareSymbol}`, color: 'text-white' },
                    { label: 'Gross value', value: `$${formatNum(usdcValue)}`, color: 'text-white' },
                    { label: `Withdrawal fee (${withdrawFeePct.toFixed(2)}%)`, value: `-$${formatNum(feeAmount)}`, color: 'text-[#FFD700]' },
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between items-center px-4 py-2.5 border-b border-[#222] animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                      <span className="font-mono text-xs text-[#6B6B6B]">{row.label}</span>
                      <span className={`font-mono text-xs ${row.color}`}>{row.value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center px-4 py-3 bg-[#0A0A0A] animate-fade-in-up" style={{ animationDelay: '150ms' }}>
                    <span className="font-mono text-xs text-white font-bold">You receive</span>
                    <span className="font-sans font-bold text-xl text-white">${formatNum(netReceive)} USDC</span>
                  </div>
                </div>
              )}

              {/* Error display */}
              {txError && (
                <div className="bg-[#FF3B3B]/10 border border-[#FF3B3B]/30 p-3 font-mono text-xs text-[#FF3B3B]">
                  {txError}
                </div>
              )}

              {/* CTA */}
              <button
                onClick={handleWithdraw}
                disabled={!isValid || isProcessing}
                className={`w-full py-3.5 font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  !isValid ? 'bg-[#333] text-[#6B6B6B] cursor-not-allowed'
                  : isProcessing ? 'bg-[#00FF66]/50 text-black border border-[#00FF66] animate-pulse cursor-wait'
                  : 'bg-[#00FF66] text-black hover:bg-white'
                }`}
              >
                {isWritePending && <><Loader2 className="w-4 h-4 animate-spin" /> Confirm in Wallet...</>}
                {isConfirming && <><Loader2 className="w-4 h-4 animate-spin" /> Withdrawing...</>}
                {!isProcessing && isValid && `Withdraw ${formatNum(netReceive)} USDC`}
                {!isProcessing && !isValid && (percentage === 0 ? 'Select Amount' : 'No Position')}
              </button>

              <div className="font-mono text-[10px] text-[#6B6B6B] text-center">
                {isWritePending ? 'Please confirm in your wallet...' : isConfirming ? 'Confirming on-chain...' : 'Funds will arrive in your wallet instantly.'}
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
