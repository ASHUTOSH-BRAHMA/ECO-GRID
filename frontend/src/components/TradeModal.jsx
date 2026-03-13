import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Wallet, AlertCircle, CheckCircle, Loader2, ExternalLink, ShieldCheck, Activity, Copy, Plus, Minus } from 'lucide-react';
import useBlockchain from '../hooks/useBlockchain';
import { apiUrl } from '../config';

// Premium Dark Theme Colors
const C = {
  bg: "#060810", bg2: "#0c0f1a", bg3: "#111525",
  border: "#1e2440", border2: "#2a3155",
  text: "#e8eaf6", text2: "#8892b0", text3: "#4a5568",
  green: "#00e5a0", red: "#ff4d6d", yellow: "#ffd166", blue: "#4d9fff"
};

const TradeModal = ({ isOpen, onClose, listing, onTradeComplete }) => {
  const {
    isConnected,
    walletAddress,
    tokenBalance,
    loading,
    error,
    isContractsConfigured,
    connect,
    buyEnergy,
    getDynamicPrice
  } = useBlockchain();

  const [amount, setAmount] = useState('1');
  const [estimatedPrice, setEstimatedPrice] = useState('0');
  const [txHash, setTxHash] = useState('');
  const [tradeStatus, setTradeStatus] = useState('idle'); // idle, confirming, success, error
  const [copied, setCopied] = useState(false);

  const incrementAmount = () => {
    const current = parseFloat(amount) || 0;
    setAmount(Math.min(999, (current + 0.1)).toFixed(1));
  };

  const decrementAmount = () => {
    const current = parseFloat(amount) || 0;
    if (current > 0.1) setAmount((current - 0.1).toFixed(1));
  };

  useEffect(() => {
    const fetchPrice = async () => {
      if (!isContractsConfigured || !isConnected) return;
      if (amount && parseFloat(amount) > 0) {
        try {
          const price = await getDynamicPrice(amount);
          setEstimatedPrice(price);
        } catch (err) { }
      }
    };
    fetchPrice();
  }, [amount, getDynamicPrice, isContractsConfigured, isConnected]);

  const handleTrade = async () => {
    if (!isConnected) {
      try {
        await connect();
      } catch (err) { return; }
    }

    setTradeStatus('confirming');
    try {
      const hash = await buyEnergy(amount);
      setTxHash(hash);
      setTradeStatus('success');

      try {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        await fetch(apiUrl('/transactions'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            type: 'bought',
            energyKwh: parseFloat(amount),
            amount: parseFloat(estimatedPrice) || parseFloat(amount) * (listing?.price || 0),
            listingId: listing?.id || null,
            listingTitle: listing?.title || 'Energy Purchase',
            txHash: hash,
            counterparty: listing?.producer || ''
          })
        });
      } catch (saveErr) {
        console.warn('Could not save transaction record:', saveErr);
      }

      if (onTradeComplete) onTradeComplete(hash);
    } catch (err) {
      setTradeStatus('error');
    }
  };

  const copyToClipboard = async () => {
    if (!txHash) return;
    await navigator.clipboard.writeText(txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const resetModal = () => {
    setAmount('1');
    setTxHash('');
    setTradeStatus('idle');
    setCopied(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 flex items-center justify-center z-[100] px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ 
          background: 'rgba(6, 8, 16, 0.92)', 
          backdropFilter: 'blur(12px)' 
        }}
        onClick={resetModal}
      >
        <motion.div
          onClick={e => e.stopPropagation()}
          initial={{ scale: 0.95, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 40 }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="relative max-w-[480px] w-full overflow-hidden shadow-2xl ring-1"
          style={{ 
            background: C.bg2, 
            border: `2px solid ${C.border}`,
            boxShadow: `0 0 80px -20px ${C.green}30, 0 25px 50px -12px rgb(0 0 0 / 0.6)`
          }}
        >
          {/* Header — clean square terminal style */}
          <div className="relative p-8 pb-5 border-b" style={{ borderColor: C.border, background: C.bg3 }}>
            <div className="flex justify-between items-start">
              <div>
                <motion.div 
                  className="flex items-center gap-3 mb-1"
                  initial={{ x: -12, opacity: 0 }} 
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <div 
                    className="p-2 flex items-center justify-center"
                    style={{ 
                      background: `${C.green}15`, 
                      border: `1px solid ${C.green}40`,
                      boxShadow: `0 0 20px ${C.green}30`
                    }}
                  >
                    <Zap className="h-5 w-5" style={{ color: C.green }} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-[4px] uppercase font-mono" style={{ color: C.text }}>
                      WEB3 TRADE TERMINAL
                    </h2>
                    <p className="text-[10px] tracking-widest font-mono -mt-0.5" style={{ color: C.green }}>POLYGON AMOY • LIVE</p>
                  </div>
                </motion.div>
                <p className="text-sm mt-3 font-light" style={{ color: C.text2 }}>
                  {listing?.title || 'Decentralized Energy Execution'}
                </p>
              </div>

              <button 
                onClick={resetModal} 
                className="p-3 transition-all hover:bg-white/10" 
                style={{ color: C.text2 }}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Status indicator */}
            <div className="absolute top-8 right-8 flex items-center gap-2">
              <div className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${isContractsConfigured ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${isContractsConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </div>
              <span className="text-[10px] uppercase tracking-[2px] font-mono font-medium" style={{ color: isContractsConfigured ? C.green : C.yellow }}>
                {isContractsConfigured ? 'LIVE • AMOY' : 'SIMULATION'}
              </span>
            </div>
          </div>

          <div className="p-8 relative">
            {/* Ambient glow (kept subtle for square look) */}
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-500/8 rounded-full blur-[100px] pointer-events-none" />

            {/* SUCCESS STATE */}
            {tradeStatus === 'success' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-10"
              >
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  transition={{ type: "spring", bounce: 0.5 }}
                  className="w-20 h-20 mx-auto mb-8 flex items-center justify-center"
                  style={{ background: `${C.green}12`, border: `2px solid ${C.green}40` }}
                >
                  <CheckCircle className="h-11 w-11" style={{ color: C.green }} />
                </motion.div>

                <h3 className="text-3xl font-bold mb-2 font-mono tracking-tight" style={{ color: C.text }}>
                  EXECUTION COMPLETE
                </h3>
                <p className="text-base mb-10 max-w-[280px] mx-auto" style={{ color: C.text2 }}>
                  {amount} kWh secured on-chain • Genesis block sealed
                </p>

                {txHash && (
                  <div className="bg-[#0a0d17] border border-[#1e2440] p-6 mb-10 font-mono text-sm">
                    <div className="flex justify-between mb-5">
                      <span style={{ color: C.text3 }}>TX HASH</span>
                      <span style={{ color: C.text2 }}>{txHash.slice(0, 8)}...{txHash.slice(-6)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <a 
                        href={`https://amoy.polygonscan.com/tx/${txHash}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="py-4 border border-[#2a3155] flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all hover:bg-white/5"
                        style={{ color: C.green }}
                      >
                        <ExternalLink className="h-4 w-4" /> VIEW ON SCAN
                      </a>

                      <button
                        onClick={copyToClipboard}
                        className="py-4 border border-[#2a3155] flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all hover:bg-white/5"
                        style={{ color: copied ? C.green : C.text }}
                      >
                        <Copy className="h-4 w-4" /> {copied ? 'COPIED ✓' : 'COPY HASH'}
                      </button>
                    </div>
                  </div>
                )}

                <button 
                  onClick={resetModal} 
                  className="w-full py-5 border border-[#2a3155] text-xs font-bold uppercase tracking-[3px] transition-all hover:bg-white/5"
                  style={{ color: C.text }}
                >
                  RETURN TO MARKET
                </button>
              </motion.div>
            )}

            {/* ERROR STATE */}
            {tradeStatus === 'error' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-10"
              >
                <div className="w-20 h-20 mx-auto mb-8 flex items-center justify-center" 
                  style={{ background: `${C.red}12`, border: `2px solid ${C.red}40` }}>
                  <AlertCircle className="h-11 w-11" style={{ color: C.red }} />
                </div>
                <h3 className="text-3xl font-bold mb-4 font-mono" style={{ color: C.text }}>REVERTED</h3>
                <p className="text-base px-8 mb-10 leading-relaxed" style={{ color: C.text2 }}>
                  {error || 'Transaction rejected by the network. Gas or slippage may have changed.'}
                </p>

                <button 
                  onClick={() => setTradeStatus('idle')} 
                  className="w-full py-5 border border-[#2a3155] text-xs font-bold uppercase tracking-[3px] transition-all hover:bg-white/5"
                  style={{ color: C.text }}
                >
                  RETRY EXECUTION
                </button>
              </motion.div>
            )}

            {/* MAIN TRADING INTERFACE */}
            {(tradeStatus === 'idle' || tradeStatus === 'confirming') && (
              <>
                {/* Wallet Status — square & spacious */}
                {!isConnected ? (
                  <div className="mb-10 p-8 border" style={{ background: C.bg3, borderColor: C.border }}>
                    <div className="flex items-center gap-3 mb-5">
                      <Wallet className="h-5 w-5" style={{ color: C.blue }} />
                      <span className="font-semibold text-base font-mono tracking-wide" style={{ color: C.text }}>
                        WALLET REQUIRED
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed mb-8" style={{ color: C.text2 }}>
                      Connect to sign the transaction locally. No keys ever leave your device.
                    </p>
                    <button 
                      onClick={connect} 
                      disabled={loading}
                      className="w-full py-4 border border-[#2a3155] flex items-center justify-center text-xs font-bold uppercase tracking-widest transition-all hover:bg-white/5 disabled:opacity-50"
                      style={{ 
                        background: `linear-gradient(90deg, ${C.blue}, #70b5ff)`, 
                        color: '#000' 
                      }}
                    >
                      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>CONNECT METAMASK</>}
                    </button>
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10 p-8 border"
                    style={{ 
                      background: `${C.green}08`, 
                      borderColor: `${C.green}30` 
                    }}
                  >
                    <div className="flex justify-between items-center mb-7">
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="h-5 w-5" style={{ color: C.green }} />
                        <span className="font-semibold text-sm font-mono tracking-wider" style={{ color: C.green }}>
                          VERIFIED
                        </span>
                      </div>
                      <div className="px-5 py-2 text-xs font-mono" 
                        style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}` }}>
                        {walletAddress.slice(0, 6)}⋯{walletAddress.slice(-4)}
                      </div>
                    </div>

                    <div className="pt-6 border-t flex justify-between items-center" style={{ borderColor: `${C.green}25` }}>
                      <span className="text-xs font-mono uppercase tracking-widest" style={{ color: C.text2 }}>ETK BALANCE</span>
                      <span className="font-mono text-2xl font-bold tabular-nums" style={{ color: C.text }}>
                        {parseFloat(tokenBalance || 0).toFixed(2)}
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Volume Input — square with +/- */}
                <div className="mb-10">
                  <label className="block text-[10px] font-bold uppercase tracking-[2px] mb-4 font-mono" style={{ color: C.text3 }}>
                    ENERGY VOLUME
                  </label>
                  <div className="flex border" style={{ borderColor: C.border }}>
                    <button
                      onClick={decrementAmount}
                      disabled={tradeStatus === 'confirming'}
                      className="p-6 border-r text-emerald-400 hover:text-emerald-300 disabled:opacity-40 transition-colors"
                      style={{ borderColor: C.border }}
                    >
                      <Minus className="h-6 w-6" />
                    </button>

                    <input 
                      type="number" 
                      value={amount} 
                      onChange={(e) => setAmount(e.target.value)} 
                      min="0.1" 
                      step="0.1" 
                      disabled={tradeStatus === 'confirming'}
                      className="flex-1 text-center font-mono text-5xl bg-transparent focus:outline-none py-6 tabular-nums"
                      style={{ color: C.text, caretColor: C.green }}
                    />

                    <button
                      onClick={incrementAmount}
                      disabled={tradeStatus === 'confirming'}
                      className="p-6 border-l text-emerald-400 hover:text-emerald-300 disabled:opacity-40 transition-colors"
                      style={{ borderColor: C.border }}
                    >
                      <Plus className="h-6 w-6" />
                    </button>

                    <div className="px-8 flex items-center text-xs font-mono font-bold" style={{ color: C.text2 }}>
                      kWh
                    </div>
                  </div>
                </div>

                {/* Price Breakdown — clean square terminal */}
                <div className="mb-10 p-8 border font-mono text-sm" 
                  style={{ background: C.bg, border: `1px solid ${C.border}` }}>
                  
                  <div className="space-y-6">
                    <div className="flex justify-between">
                      <span style={{ color: C.text2 }}>Base Rate</span>
                      <span className="font-medium" style={{ color: C.text }}>
                        {listing?.price || '20'} ETK/kWh
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: C.text2 }}>Est. Gas (MATIC)</span>
                      <span style={{ color: C.yellow }} className="tabular-nums">
                        {isContractsConfigured ? parseFloat(estimatedPrice).toFixed(6) : '—.———'}
                      </span>
                    </div>
                  </div>

                  <div className="h-px my-8" style={{ background: C.border2 }} />

                  <div className="flex justify-between items-baseline">
                    <span className="uppercase text-xs tracking-[3px] font-bold" style={{ color: C.text }}>TOTAL DUE</span>
                    <motion.span 
                      key={amount}
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-4xl font-bold tabular-nums tracking-tighter" 
                      style={{ color: C.green }}
                    >
                      {(parseFloat(amount) * (listing?.price || 20)).toFixed(2)}
                      <span className="text-base align-super ml-1" style={{ color: C.text2 }}>ETK</span>
                    </motion.span>
                  </div>
                </div>

                {/* EXECUTE BUTTON — square & bold */}
                <button 
                  onClick={handleTrade} 
                  disabled={loading || tradeStatus === 'confirming' || !amount || parseFloat(amount) <= 0 || !isConnected}
                  className="w-full py-6 border border-[#2a3155] text-sm font-bold uppercase tracking-[3px] transition-all flex items-center justify-center disabled:opacity-50"
                  style={{ 
                    background: `linear-gradient(90deg, ${C.green}, #00d4ff)`, 
                    color: '#000' 
                  }}
                >
                  {tradeStatus === 'confirming' ? (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      className="flex items-center gap-3 font-mono"
                    >
                      <Loader2 className="h-5 w-5 animate-spin" /> 
                      MINING BLOCK...
                    </motion.div>
                  ) : (
                    <span className="flex items-center gap-3 font-mono">
                      <Zap className="h-5 w-5" /> 
                      SIGN &amp; EXECUTE ON-CHAIN
                    </span>
                  )}
                </button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TradeModal;