'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown, ChevronUp, ExternalLink, Check, Loader2, Zap, Flame, AlertTriangle, ArrowRight } from 'lucide-react';
import { calculateLoyaltyRank } from './DepositModal';

// --- WITHDRAWAL FEE FROM RANK ---

const BASE_WITHDRAW_FEE = 0.5; // 0.5%

function getWithdrawFee(depositFeePercent: number): number {
  // Same discount ratio as deposit: rank gives X% off base
  // deposit base=1%, withdraw base=0.5%, same ratio
  const ratio = depositFeePercent / 1.0;
  return BASE_WITHDRAW_FEE * ratio;
}

// --- MOCK DATA ---

const GDN_PRICE = 0.842;

const VAULT_POSITIONS: Record<string, any> = {
  alpha: {
    name: 'Alpha Vault', shareSymbol: 'gALPHA', sharePrice: 1.2478,
    shares: 7892, deposited: 8000, currentValue: 9847,
    grossProfit: 2309, perfFeePaid: 462, netProfit: 1847, roi: 23.1, since: '14 days ago',
  },
  degen: {
    name: 'Degen Vault', shareSymbol: 'gDEGEN', sharePrice: 1.2919,
    shares: 4180, deposited: 4400, currentValue: 5400,
    grossProfit: 1250, perfFeePaid: 250, netProfit: 1000, roi: 22.7, since: '7 days ago',
  },
};

const MOCK_USER = {
  gdnStaked: 772,
  totalDeposited: 12400,
};

// --- COMPONENT ---

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  vaultId: string;
  onSuccess?: () => void;
}

export function WithdrawModal({ isOpen, onClose, vaultId, onSuccess }: WithdrawModalProps) {
  type Step = 'input' | 'processing' | 'success';
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<Step>('input');
  const [inputMode, setInputMode] = useState<'shares' | 'usdc'>('shares');
  const [feeInfoOpen, setFeeInfoOpen] = useState(false);
  const [rankExpanded, setRankExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pos = VAULT_POSITIONS[vaultId];
  const loyaltyRank = calculateLoyaltyRank(MOCK_USER.gdnStaked, MOCK_USER.totalDeposited);
  const withdrawFeePercent = getWithdrawFee(loyaltyRank.feePercent);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      setAmount('');
      setStep('input');
      setInputMode('shares');
      setFeeInfoOpen(false);
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  useEffect(() => {
    if (visible && inputRef.current) inputRef.current.focus();
  }, [visible]);

  if (!mounted || !pos) return null;

  const numAmount = parseFloat(amount.replace(/,/g, '')) || 0;
  const sharesAmount = inputMode === 'shares' ? numAmount : numAmount / pos.sharePrice;
  const usdcValue = inputMode === 'usdc' ? numAmount : numAmount * pos.sharePrice;
  const maxShares = pos.shares;
  const maxUsdc = pos.currentValue;
  const exceeds = inputMode === 'shares' ? numAmount > maxShares : numAmount > maxUsdc;
  const isMax = inputMode === 'shares' ? numAmount === maxShares : numAmount === maxUsdc;
  const isValid = numAmount > 0 && !exceeds;

  const feeAmount = usdcValue * (withdrawFeePercent / 100);
  const netReceive = usdcValue - feeAmount;

  const formatNum = (n: number, dec = 2) => n.toLocaleString('en-US', { maximumFractionDigits: dec });

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9.]/g, '');
    if (raw === '' || /^\d*\.?\d{0,2}$/.test(raw)) setAmount(raw);
  };

  const handleQuickSelect = (pct: number) => {
    const max = inputMode === 'shares' ? maxShares : maxUsdc;
    const val = pct === 1 ? max : Math.floor(max * pct * 100) / 100;
    setAmount(val.toString());
  };

  const handleWithdraw = () => {
    if (!isValid) return;
    setStep('processing');
    setTimeout(() => {
      setStep('success');
      onSuccess?.();
    }, 3000);
  };

  const close = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  // Rank progress
  const progressPct = loyaltyRank.rank === 'none' ? 0
    : loyaltyRank.rank === 'bronze' ? 25
    : loyaltyRank.rank === 'silver' ? 50
    : loyaltyRank.rank === 'gold' ? 75 : 100;

  const isProcessing = step === 'processing';

  const modal = (
    <div className={`fixed inset-0 z-[200] flex items-end md:items-center justify-center transition-all duration-300 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={close} />

      <div className={`relative w-full md:max-w-lg bg-[#111] border border-[#333] md:border max-h-[90vh] overflow-y-auto transition-all duration-300 ${visible ? 'translate-y-0 md:scale-100' : 'translate-y-full md:translate-y-0 md:scale-95'}`}>

        {(step as string) === 'success' ? (
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
            <div className="text-[#6B6B6B] font-mono text-[10px] mb-6">{formatNum(sharesAmount, 0)} {pos.shareSymbol} shares redeemed</div>

            <div className="bg-[#0A0A0A] border border-[#333] px-4 py-3 mb-4 flex items-center justify-between">
              <span className="font-mono text-xs text-[#6B6B6B]">Tx: 0x8b3e...2d71</span>
              <button className="font-mono text-[10px] text-[#6B6B6B] hover:text-[#00FF66] flex items-center gap-1 uppercase tracking-widest transition-colors">
                Etherscan <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="bg-[#FFD700]/5 border border-[#FFD700]/20 px-4 py-3 mb-6 flex items-center gap-2 justify-center">
              <Flame className="w-4 h-4 text-[#FFD700]" />
              <span className="font-mono text-xs text-[#FFD700]">${formatNum(feeAmount)} withdrawal fee → $GDN buyback & burn</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <a href={`/vaults/${vaultId}`} className="py-3 bg-[#00FF66] text-black font-mono font-bold text-xs uppercase tracking-wider hover:bg-white transition-colors text-center">Back to Vault</a>
              <button onClick={close} className="py-3 border border-[#333] text-white font-mono text-xs uppercase tracking-widest hover:border-[#00FF66] transition-colors">Close</button>
            </div>
          </div>
        ) : (
          /* INPUT */
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#333]">
              <div>
                <div className="font-mono text-xs text-[#6B6B6B] uppercase tracking-widest mb-1">Withdraw from</div>
                <div className="font-sans font-bold text-lg text-white">{pos.name}</div>
              </div>
              <button onClick={close} className="w-8 h-8 flex items-center justify-center text-[#6B6B6B] hover:text-white transition-colors"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-5 space-y-5">

              {/* Position Card */}
              <div className="bg-[#0A0A0A] border border-[#333] p-4">
                <div className="font-mono text-[9px] text-[#6B6B6B] uppercase tracking-widest mb-3">YOUR POSITION</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div>
                    <div className="font-mono text-[9px] text-[#6B6B6B] uppercase tracking-widest mb-1">Deposited</div>
                    <div className="font-mono text-sm text-white">${formatNum(pos.deposited, 0)}</div>
                  </div>
                  <div>
                    <div className="font-mono text-[9px] text-[#6B6B6B] uppercase tracking-widest mb-1">Current Value</div>
                    <div className="font-mono text-sm text-white">${formatNum(pos.currentValue, 0)}</div>
                  </div>
                  <div>
                    <div className="font-mono text-[9px] text-[#6B6B6B] uppercase tracking-widest mb-1">PNL</div>
                    <div className={`font-mono text-sm ${pos.netProfit >= 0 ? 'text-[#00FF66]' : 'text-[#FF3B3B]'}`}>
                      {pos.netProfit >= 0 ? '+' : ''}${formatNum(pos.netProfit, 0)}
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-[9px] text-[#6B6B6B] uppercase tracking-widest mb-1">ROI</div>
                    <div className={`font-mono text-sm ${pos.roi >= 0 ? 'text-[#00FF66]' : 'text-[#FF3B3B]'}`}>+{pos.roi}%</div>
                  </div>
                </div>
                <div className="font-mono text-[10px] text-[#6B6B6B]">
                  {formatNum(pos.shares, 0)} {pos.shareSymbol} · Since {pos.since}
                </div>
              </div>

              {/* Amount Input */}
              <div>
                {/* Toggle */}
                <div className="flex gap-2 mb-3">
                  {(['shares', 'usdc'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => { setInputMode(mode); setAmount(''); }}
                      className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors ${inputMode === mode ? 'bg-[#333] text-white' : 'text-[#6B6B6B] hover:text-white bg-[#111] border border-[#333]'}`}
                    >
                      {mode === 'shares' ? `Shares (${pos.shareSymbol})` : 'USDC Value'}
                    </button>
                  ))}
                </div>

                <div className={`bg-[#0A0A0A] border p-4 transition-colors ${exceeds ? 'border-[#FF3B3B]' : 'border-[#333] focus-within:border-[#00FF66]'}`}>
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
                      <div className="font-mono text-sm text-white">{inputMode === 'shares' ? pos.shareSymbol : 'USDC'}</div>
                      <div className="font-mono text-[10px] text-[#6B6B6B]">
                        {inputMode === 'shares'
                          ? `≈ $${numAmount > 0 ? formatNum(usdcValue) : '0'}`
                          : `≈ ${numAmount > 0 ? formatNum(sharesAmount, 0) : '0'} ${pos.shareSymbol}`
                        }
                      </div>
                      <div className="font-mono text-[10px] text-[#6B6B6B]">
                        Max: {inputMode === 'shares' ? formatNum(maxShares, 0) : `$${formatNum(maxUsdc)}`}
                      </div>
                    </div>
                  </div>
                  {exceeds && <div className="font-mono text-[10px] text-[#FF3B3B] mt-1">Exceeds available {inputMode === 'shares' ? 'shares' : 'balance'}</div>}
                  <div className="flex gap-2 mt-3">
                    {[0.25, 0.5, 0.75, 1].map(pct => {
                      const label = pct === 1 ? 'MAX' : `${pct * 100}%`;
                      const max = inputMode === 'shares' ? maxShares : maxUsdc;
                      const targetVal = pct === 1 ? max : Math.floor(max * pct * 100) / 100;
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
              </div>

              {/* Full withdrawal warning */}
              {isMax && isValid && (
                <div className="bg-[#FF3B3B]/5 border border-[#FF3B3B]/20 p-3 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#FF3B3B] shrink-0 mt-0.5" />
                  <span className="font-mono text-[10px] text-[#FF3B3B]">This will close your entire position in {pos.name}.</span>
                </div>
              )}

              {/* Loyalty Rank */}
              <div className="bg-[#0A0A0A] border border-[#333]">
                <button onClick={() => setRankExpanded(!rankExpanded)} className="w-full flex items-center justify-between p-4 text-left">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{loyaltyRank.emoji}</span>
                    <div>
                      <div className="font-mono text-xs text-white uppercase tracking-widest">{loyaltyRank.label} Rank</div>
                      <div className="font-mono text-[10px] text-[#6B6B6B]">
                        Withdraw fee: {withdrawFeePercent.toFixed(3)}%
                        {loyaltyRank.rank !== 'none' && <span className="text-[#00FF66] ml-1">-{Math.round((1 - withdrawFeePercent / BASE_WITHDRAW_FEE) * 100)}% off</span>}
                      </div>
                    </div>
                  </div>
                  {rankExpanded ? <ChevronUp className="w-4 h-4 text-[#6B6B6B]" /> : <ChevronDown className="w-4 h-4 text-[#6B6B6B]" />}
                </button>
                {rankExpanded && (
                  <div className="px-4 pb-4 space-y-3">
                    <div>
                      <div className="relative w-full h-1.5 bg-[#222] mb-3">
                        <div className="absolute top-0 left-0 h-full bg-[#00FF66] transition-all duration-700 ease-out" style={{ width: `${progressPct}%` }} />
                        {[0, 25, 50, 75, 100].map((p, i) => (
                          <div key={i} className={`absolute top-1/2 w-2.5 h-2.5 rounded-full border-2 ${p <= progressPct ? 'bg-[#00FF66] border-[#00FF66]' : 'bg-[#222] border-[#333]'} ${p === progressPct ? 'animate-pulse shadow-[0_0_8px_rgba(0,255,102,0.5)]' : ''}`} style={{ left: `${p}%`, transform: 'translate(-50%, -50%)' }} />
                        ))}
                      </div>
                      <div className="flex justify-between font-mono text-[9px] text-[#6B6B6B] uppercase tracking-widest">
                        <span className={loyaltyRank.rank === 'bronze' ? 'text-[#00FF66]' : ''}>🥉 0.375%</span>
                        <span className={loyaltyRank.rank === 'silver' ? 'text-[#00FF66]' : ''}>🥈 0.25%</span>
                        <span className={loyaltyRank.rank === 'gold' ? 'text-[#00FF66]' : ''}>🥇 0.125%</span>
                        <span className={loyaltyRank.rank === 'platinum' ? 'text-[#00FF66]' : ''}>💎 0.05%</span>
                      </div>
                    </div>
                    {loyaltyRank.nextRank && (
                      <div className="bg-[#111] border border-[#333] p-3 flex items-center justify-between gap-3">
                        <div className="font-mono text-[10px] text-[#6B6B6B]">
                          <Zap className="w-3 h-3 text-[#FFD700] inline mr-1" />
                          Stake <span className="text-white">{formatNum(loyaltyRank.nextRank.gdnNeeded, 0)} $GDN</span> to reach {loyaltyRank.nextRank.emoji} → lower fees
                        </div>
                        <button className="font-mono text-[10px] text-[#00FF66] hover:text-white uppercase tracking-widest whitespace-nowrap transition-colors flex items-center gap-1">
                          Stake <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Fee Breakdown */}
              <div className="border border-[#00FF66]/20 bg-[#00FF66]/[0.03]">
                <button onClick={() => setFeeInfoOpen(!feeInfoOpen)} className="w-full flex items-center justify-between p-4 text-left">
                  <span className="font-mono text-xs text-[#00FF66] flex items-center gap-2">
                    💡 Performance Fee Info
                  </span>
                  {feeInfoOpen ? <ChevronUp className="w-4 h-4 text-[#00FF66]" /> : <ChevronDown className="w-4 h-4 text-[#00FF66]" />}
                </button>
                {feeInfoOpen && (
                  <div className="px-4 pb-4 space-y-2 font-mono text-xs">
                    <p className="text-[#6B6B6B] leading-relaxed">
                      The 20% performance fee has <span className="text-white">already been deducted</span> from your profits during vault management. Your current value (${formatNum(pos.currentValue)}) is net of all performance fees.
                    </p>
                    <div className="bg-[#0A0A0A] border border-[#333] p-3 space-y-1">
                      <div className="flex justify-between"><span className="text-[#6B6B6B]">Gross profit</span><span className="text-white">+${formatNum(pos.grossProfit)}</span></div>
                      <div className="flex justify-between"><span className="text-[#6B6B6B]">20% perf fee</span><span className="text-[#FFD700]">-${formatNum(pos.perfFeePaid)}</span></div>
                      <div className="h-[1px] bg-[#333] my-1" />
                      <div className="flex justify-between"><span className="text-[#6B6B6B]">Net profit (yours)</span><span className="text-[#00FF66]">+${formatNum(pos.netProfit)}</span></div>
                    </div>
                    <div className="flex items-center gap-2 text-[#FFD700]">
                      <Flame className="w-3 h-3" />
                      <span>${formatNum(pos.perfFeePaid)} used to buy back & burn $GDN</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Summary */}
              {numAmount > 0 && !exceeds && (
                <div className="space-y-0 border border-[#333]">
                  {[
                    { label: 'Shares redeemed', value: `${formatNum(sharesAmount, 0)} ${pos.shareSymbol}`, color: 'text-white' },
                    { label: 'Gross value', value: `$${formatNum(usdcValue)}`, color: 'text-white' },
                    { label: `Withdrawal fee (${withdrawFeePercent.toFixed(2)}%)`, value: `-$${formatNum(feeAmount)}`, color: 'text-[#FFD700]' },
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
                  {[
                    { label: 'Performance fee (20%)', value: 'Already deducted ✓', color: 'text-[#00FF66]' },
                    { label: 'Processing', value: 'Instant', color: 'text-[#6B6B6B]' },
                  ].map((row, i) => (
                    <div key={`extra-${i}`} className="flex justify-between items-center px-4 py-2.5 border-t border-[#222] animate-fade-in-up" style={{ animationDelay: `${(i + 4) * 50}ms` }}>
                      <span className="font-mono text-xs text-[#6B6B6B]">{row.label}</span>
                      <span className={`font-mono text-xs ${row.color}`}>{row.value}</span>
                    </div>
                  ))}
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
                {isProcessing
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Withdrawing...</>
                  : isValid
                  ? `Withdraw ${formatNum(netReceive)} USDC`
                  : numAmount === 0 ? 'Enter Amount' : 'Exceeds Available'
                }
              </button>

              <div className="font-mono text-[10px] text-[#6B6B6B] text-center">
                Funds will arrive in your wallet instantly.
              </div>

              {/* Rank warning */}
              {(loyaltyRank.rank === 'gold' || loyaltyRank.rank === 'platinum') && isValid && (
                <div className="flex items-start gap-2 pt-2 border-t border-[#222]">
                  <AlertTriangle className="w-3 h-3 text-yellow-500 shrink-0 mt-0.5" />
                  <span className="font-mono text-[10px] text-[#6B6B6B]">Withdrawing reduces your TVL contribution and may affect your Platinum rank eligibility.</span>
                </div>
              )}
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
