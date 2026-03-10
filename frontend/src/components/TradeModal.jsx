import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Wallet, AlertCircle, CheckCircle, Loader2, ExternalLink, ShieldCheck, Activity } from 'lucide-react';
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

  const resetModal = () => {
    setAmount('1');
    setTxHash('');
    setTradeStatus('idle');
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
        style={{ background: 'rgba(6, 8, 16, 0.85)', backdropFilter: 'blur(8px)' }}
        onClick={resetModal}
      >
        <motion.div
          onClick={e => e.stopPropagation()}
          initial={{ scale: 0.95, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 30 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative max-w-[440px] w-full rounded-2xl overflow-hidden shadow-2xl"
          style={{ background: C.bg2, border: `1px solid ${C.border}` }}
        >
          {/* Header */}
          <div className="relative p-6 pb-4 border-b" style={{ borderColor: C.border, background: C.bg3 }}>
            <div className="flex justify-between items-start">
              <div>
                <motion.div className="flex items-center gap-2 mb-1"
                 initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                  <div className="p-1.5 rounded-lg flex items-center justify-center" style={{ background: `${C.green}20`, border: `1px solid ${C.green}40` }}>
                    <Zap className="h-4 w-4" style={{ color: C.green }} />
                  </div>
                  <h2 className="text-sm font-bold tracking-widest uppercase font-mono" style={{ color: C.text }}>Web3 Trade Terminal</h2>
                </motion.div>
                <p className="text-xs mt-1" style={{ color: C.text2, fontFamily: "'JetBrains Mono', monospace" }}>
                  {listing?.title || 'Decentralized Energy Execution'}
                </p>
              </div>
              <button onClick={resetModal} className="p-1.5 rounded-full transition-colors hover:bg-white/5" style={{ color: C.text2 }}>
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Status light */}
            <div className="absolute top-6 right-12 flex items-center gap-2">
               <div className="relative flex h-2 w-2">
                 <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isContractsConfigured ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                 <span className={`relative inline-flex rounded-full h-2 w-2 ${isContractsConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
               </div>
               <span className="text-[9px] uppercase tracking-wider font-mono" style={{ color: isContractsConfigured ? C.green : C.yellow }}>
                 {isContractsConfigured ? 'Polygon Amoy Active' : 'Simulation Mode'}
               </span>
            </div>
          </div>

          <div className="p-6 relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>

            {/* Success State */}
            {tradeStatus === 'success' && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                <motion.div 
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                  style={{ background: `${C.green}15`, border: `1px solid ${C.green}40` }}
                >
                  <CheckCircle className="h-8 w-8" style={{ color: C.green }} />
                </motion.div>
                <h3 className="text-xl font-bold mb-2 font-mono" style={{ color: C.text }}>Trade Confirmed</h3>
                <p className="text-sm mb-6" style={{ color: C.text2 }}>The genesis block has recorded your transaction securely.</p>
                
                {txHash && (
                  <a href={`https://amoy.polygonscan.com/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center justify-center p-3 rounded-xl transition-all font-mono text-xs w-full mb-4 group"
                    style={{ background: C.bg3, border: `1px solid ${C.border2}`, color: C.green }}>
                    View on PolygonScan 
                    <ExternalLink className="h-3 w-3 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </a>
                )}
                
                <button onClick={resetModal} className="w-full py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition-all"
                  style={{ background: C.border, color: C.text, border: `1px solid ${C.border2}` }}>
                  Close Terminal
                </button>
              </motion.div>
            )}

            {/* Error State */}
            {tradeStatus === 'error' && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: `${C.red}15`, border: `1px solid ${C.red}40` }}>
                  <AlertCircle className="h-8 w-8" style={{ color: C.red }} />
                </div>
                <h3 className="text-xl font-bold mb-2 font-mono" style={{ color: C.text }}>Execution Failed</h3>
                <p className="text-xs mb-6 px-4" style={{ color: C.text2, fontFamily: "'JetBrains Mono', monospace" }}>{error || 'Transaction reverted by the EVM.'}</p>
                
                <button onClick={() => setTradeStatus('idle')} className="w-full py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition-all hover:brightness-110"
                  style={{ background: C.border, color: C.text, border: `1px solid ${C.border2}` }}>
                  Retry Operation
                </button>
              </motion.div>
            )}

            {/* Trading Form */}
            {(tradeStatus === 'idle' || tradeStatus === 'confirming') && (
              <>
                {!isConnected ? (
                  <div className="mb-6 p-5 rounded-xl border relative overflow-hidden" style={{ background: C.bg3, borderColor: C.border }}>
                    <div className="flex items-center mb-2">
                      <Wallet className="h-4 w-4 mr-2" style={{ color: C.blue }} />
                      <span className="font-semibold text-sm font-mono" style={{ color: C.text }}>Wallet Disconnected</span>
                    </div>
                    <p className="text-xs mb-4" style={{ color: C.text2, lineHeight: 1.5 }}>
                      A Web3 wallet is strictly required to sign messages and encrypt network payloads locally.
                    </p>
                    <button onClick={connect} disabled={loading} className="w-full py-2.5 rounded-lg flex items-center justify-center text-xs font-bold uppercase tracking-wider transition-all hover:brightness-110"
                      style={{ background: `linear-gradient(90deg, ${C.blue}, #70b5ff)`, color: '#000', boxShadow: `0 0 20px ${C.blue}40` }}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Connect MetaMask</>}
                    </button>
                  </div>
                ) : (
                  <div className="mb-6 p-4 rounded-xl border" style={{ background: `${C.green}08`, borderColor: `${C.green}30` }}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" style={{ color: C.green }} />
                        <span className="font-semibold text-xs font-mono uppercase tracking-wider" style={{ color: C.green }}>Identity Verified</span>
                      </div>
                      <span className="px-2 py-1 rounded text-[10px] font-mono" style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}` }}>
                        {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t" style={{ borderColor: `${C.green}20` }}>
                      <span className="text-[10px] font-mono uppercase" style={{ color: C.text2 }}>ETK Balance</span>
                      <span className="font-bold font-mono text-sm" style={{ color: C.text }}>{parseFloat(tokenBalance).toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 font-mono" style={{ color: C.text3 }}>Purchase Volume (kWh)</label>
                  <div className="relative">
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min="0.1" step="0.1" disabled={tradeStatus === 'confirming'}
                      className="w-full p-3 font-mono text-lg rounded-xl focus:outline-none transition-colors"
                      style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}`, caretColor: C.green }}
                      onFocus={e => e.target.style.borderColor = C.green}
                      onBlur={e => e.target.style.borderColor = C.border} />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <Activity className="h-4 w-4 opacity-50" style={{ color: C.green }} />
                      <span className="text-xs font-mono font-bold" style={{ color: C.text2 }}>kWh</span>
                    </div>
                  </div>
                </div>

                <div className="mb-6 p-4 rounded-xl font-mono text-xs" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
                  <div className="flex justify-between mb-2">
                    <span style={{ color: C.text2 }}>Base Rate</span>
                    <span style={{ color: C.text }}>{listing?.price || '20'} ETK / kWh</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span style={{ color: C.text2 }}>Gas Estimate</span>
                    <span style={{ color: C.yellow }}>{isContractsConfigured ? `${parseFloat(estimatedPrice).toFixed(6)} MATIC` : 'N/A'}</span>
                  </div>
                  <div className="h-[1px] w-full my-3" style={{ background: C.border2 }}></div>
                  <div className="flex justify-between items-center">
                    <span className="uppercase tracking-widest text-[10px] font-bold" style={{ color: C.text }}>Gross Total</span>
                    <span className="text-base font-bold" style={{ color: C.green }}>
                      {(parseFloat(amount) * (listing?.price || 20)).toFixed(2)} ETK
                    </span>
                  </div>
                </div>

                <button onClick={handleTrade} disabled={loading || tradeStatus === 'confirming' || !amount || parseFloat(amount) <= 0 || !isConnected}
                  className="w-full py-3.5 rounded-xl font-bold text-xs tracking-widest uppercase transition-all shadow-lg flex items-center justify-center relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: `linear-gradient(90deg, ${C.green}, #00b4d8)`, color: '#000', boxShadow: `0 0 20px ${C.green}30` }}>
                  {tradeStatus === 'confirming' ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center font-mono">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Mining Block...
                    </motion.div>
                  ) : (
                    <span className="font-mono flex items-center">
                      <Zap className="h-4 w-4 mr-2" /> Sign & Execute
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
