import React, { useState } from 'react';
import NavBar from './NavBar';

const PricingPage = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <>
    <NavBar/>
    <div className="min-h-screen bg-[#060810] selection:bg-[#00e5a0]/30 selection:text-white mt-16 text-[#e8eaf6]">
      <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        <header className="text-center mb-12">
          <div className="inline-block px-4 py-1.5 rounded-lg bg-[#00e5a0]/10 border border-[#00e5a0]/30 text-[10px] font-mono uppercase tracking-widest mb-4 text-[#00e5a0] font-bold shadow-[0_0_15px_rgba(0,229,160,0.1)]">
            Economic Model
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#e8eaf6] font-['Syne'] mb-4">EcoGrid Pricing Model</h1>
          <p className="text-lg text-[#8892b0] font-mono max-w-2xl mx-auto">Sustainable energy trading designed for a greener, more efficient future.</p>
        </header>

        <nav className="mb-8">
          <ul className="flex flex-wrap justify-center gap-2 md:gap-4">
            {['overview', 'coreComponents', 'dynamicPricing', 'incentives', 'implementation'].map((tab) => (
              <li key={tab}>
                <button
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 rounded-lg font-mono text-xs uppercase tracking-wider font-bold transition-all duration-300 ${
                    activeTab === tab
                      ? 'bg-[#00e5a0]/10 border border-[#00e5a0]/50 text-[#00e5a0] shadow-[0_0_15px_rgba(0,229,160,0.2)]'
                      : 'bg-[#111525] text-[#8892b0] hover:text-[#e8eaf6] hover:bg-[#1e2440] border border-[#1e2440]'
                  }`}
                >
                  {tab === 'overview' ? 'Overview' : 
                   tab === 'coreComponents' ? 'Core Pricing' : 
                   tab === 'dynamicPricing' ? 'Dynamic Pricing' : 
                   tab === 'incentives' ? 'Incentives' : 'Implementation'}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="bg-[#111525] rounded-xl shadow-lg p-6 md:p-8 mb-8 border border-[#1e2440]">
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-2xl font-bold text-[#e8eaf6] font-['Syne'] mb-6">Overview</h2>
              <p className="mb-6 text-[#8892b0] font-mono text-sm leading-relaxed">
                EcoGrid's pricing model is designed to create a fair, transparent, and efficient marketplace 
                for renewable energy trading. The model balances the needs of three key stakeholders: 
                prosumers (who both produce and consume energy), consumers (who only purchase energy), 
                and utilities (traditional grid operators).
              </p>
              <div className="flex flex-col md:flex-row gap-6 mt-8">
                <div className="bg-[#0c0f1a] rounded-xl p-6 flex-1 border border-[#1e2440] hover:border-[#00e5a0]/50 transition-colors shadow-lg group">
                  <h3 className="text-xl font-bold text-[#00e5a0] font-['Syne'] mb-3 group-hover:text-[#e8eaf6] transition-colors">For Prosumers</h3>
                  <p className="text-[#8892b0] font-mono text-xs leading-relaxed">Sell your excess renewable energy and earn EcoTokens while contributing to a more sustainable future.</p>
                </div>
                <div className="bg-[#0c0f1a] rounded-xl p-6 flex-1 border border-[#1e2440] hover:border-[#4d9fff]/50 transition-colors shadow-lg group">
                  <h3 className="text-xl font-bold text-[#4d9fff] font-['Syne'] mb-3 group-hover:text-[#e8eaf6] transition-colors">For Consumers</h3>
                  <p className="text-[#8892b0] font-mono text-xs leading-relaxed">Access clean renewable energy at competitive rates with full transparency and control.</p>
                </div>
                <div className="bg-[#0c0f1a] rounded-xl p-6 flex-1 border border-[#1e2440] hover:border-[#a78bfa]/50 transition-colors shadow-lg group">
                  <h3 className="text-xl font-bold text-[#a78bfa] font-['Syne'] mb-3 group-hover:text-[#e8eaf6] transition-colors">For Utilities</h3>
                  <p className="text-[#8892b0] font-mono text-xs leading-relaxed">Integrate with the modern energy ecosystem and offer value-added services to your customers.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'coreComponents' && (
            <div className="animate-in fade-in duration-500">
              <h2 className="text-2xl font-bold text-[#e8eaf6] font-['Syne'] mb-6">Core Pricing Components</h2>
              
              <div className="mb-10">
                <h3 className="text-lg font-bold text-[#00e5a0] uppercase tracking-wider font-mono mb-4">1. Energy Token (EcoToken)</h3>
                <ul className="list-disc pl-6 space-y-3 text-[#8892b0] font-mono text-sm leading-relaxed">
                  <li><strong className="text-[#e8eaf6] font-bold">Base Value:</strong> 1 EcoToken = 1 kWh of energy</li>
                  <li><strong className="text-[#e8eaf6] font-bold">Conversion Rate:</strong> Initial rate of 1 EcoToken = $0.12 USD (adjustable based on market conditions)</li>
                  <li><strong className="text-[#e8eaf6] font-bold">Minimum Purchase:</strong> 10 EcoTokens ($1.20 USD)</li>
                  <li><strong className="text-[#e8eaf6] font-bold">Transaction Fee:</strong> 1% per transaction (supports platform maintenance)</li>
                </ul>
              </div>

              <div className="mb-10">
                <h3 className="text-lg font-bold text-[#00e5a0] uppercase tracking-wider font-mono mb-4">2. P2P Energy Trading</h3>
                <div className="overflow-x-auto rounded-lg border border-[#1e2440]">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#00e5a0]/10 border-b border-[#1e2440]">
                        <th className="p-4 text-left text-[#00e5a0] font-mono uppercase tracking-wider text-xs font-bold">Component</th>
                        <th className="p-4 text-left text-[#00e5a0] font-mono uppercase tracking-wider text-xs font-bold">Price Range</th>
                        <th className="p-4 text-left text-[#00e5a0] font-mono uppercase tracking-wider text-xs font-bold">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-[#0c0f1a] border-b border-[#1e2440]/50 hover:bg-[#111525] transition-colors">
                        <td className="p-4 text-[#e8eaf6] font-mono text-sm">Prosumer-set Price</td>
                        <td className="p-4 text-[#00e5a0] font-mono text-sm font-bold">$0.08-0.15 per kWh</td>
                        <td className="p-4 text-[#8892b0] font-mono text-xs">Dynamic pricing based on supply/demand</td>
                      </tr>
                      <tr className="bg-[#111525] border-b border-[#1e2440]/50 hover:bg-[#1e2440]/50 transition-colors">
                        <td className="p-4 text-[#e8eaf6] font-mono text-sm">Time-of-Day Pricing</td>
                        <td className="p-4 text-[#4d9fff] font-mono text-sm font-bold">+/- 20% adjustment</td>
                        <td className="p-4 text-[#8892b0] font-mono text-xs">Higher during peak demand periods</td>
                      </tr>
                      <tr className="bg-[#0c0f1a] border-b border-[#1e2440]/50 hover:bg-[#111525] transition-colors">
                        <td className="p-4 text-[#e8eaf6] font-mono text-sm">Volume Discount</td>
                        <td className="p-4 text-[#00e5a0] font-mono text-sm font-bold">5-15%</td>
                        <td className="p-4 text-[#8892b0] font-mono text-xs">Applied to purchases {'>'} 100 kWh</td>
                      </tr>
                      <tr className="bg-[#111525] border-b border-[#1e2440]/50 hover:bg-[#1e2440]/50 transition-colors">
                        <td className="p-4 text-[#e8eaf6] font-mono text-sm">Renewable Premium</td>
                        <td className="p-4 text-[#a78bfa] font-mono text-sm font-bold">+5-10%</td>
                        <td className="p-4 text-[#8892b0] font-mono text-xs">For certified 100% renewable energy</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mb-10">
                <h3 className="text-lg font-bold text-[#00e5a0] uppercase tracking-wider font-mono mb-4">3. Smart Grid Services</h3>
                <div className="overflow-x-auto rounded-lg border border-[#1e2440]">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#4d9fff]/10 border-b border-[#1e2440]">
                        <th className="p-4 text-left text-[#4d9fff] font-mono uppercase tracking-wider text-xs font-bold">Service</th>
                        <th className="p-4 text-left text-[#4d9fff] font-mono uppercase tracking-wider text-xs font-bold">Fee Structure</th>
                        <th className="p-4 text-left text-[#4d9fff] font-mono uppercase tracking-wider text-xs font-bold">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-[#0c0f1a] border-b border-[#1e2440]/50 hover:bg-[#111525] transition-colors">
                        <td className="p-4 text-[#e8eaf6] font-mono text-sm">Grid Access</td>
                        <td className="p-4 text-[#00e5a0] font-mono text-sm font-bold">$5/month</td>
                        <td className="p-4 text-[#8892b0] font-mono text-xs">Base connection fee to access the grid</td>
                      </tr>
                      <tr className="bg-[#111525] border-b border-[#1e2440]/50 hover:bg-[#1e2440]/50 transition-colors">
                        <td className="p-4 text-[#e8eaf6] font-mono text-sm">Grid Stabilization</td>
                        <td className="p-4 text-[#00e5a0] font-mono text-sm font-bold">3% of transaction</td>
                        <td className="p-4 text-[#8892b0] font-mono text-xs">Fee for maintaining grid reliability</td>
                      </tr>
                      <tr className="bg-[#0c0f1a] border-b border-[#1e2440]/50 hover:bg-[#111525] transition-colors">
                        <td className="p-4 text-[#e8eaf6] font-mono text-sm">Energy Storage</td>
                        <td className="p-4 text-[#00e5a0] font-mono text-sm font-bold">$0.03/kWh stored</td>
                        <td className="p-4 text-[#8892b0] font-mono text-xs">Fee for utilizing virtual energy storage</td>
                      </tr>
                      <tr className="bg-[#111525] border-b border-[#1e2440]/50 hover:bg-[#1e2440]/50 transition-colors">
                        <td className="p-4 text-[#e8eaf6] font-mono text-sm">Forecasting Service</td>
                        <td className="p-4 text-[#00e5a0] font-mono text-sm font-bold">$2/month</td>
                        <td className="p-4 text-[#8892b0] font-mono text-xs">Access to AI forecasting insights</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#00e5a0] uppercase tracking-wider font-mono mb-4">4. Marketplace Tiers</h3>
                
                <h4 className="text-lg font-bold text-[#4d9fff] font-['Syne'] mt-8 mb-4">Prosumer Plans</h4>
                <div className="overflow-x-auto mb-8 rounded-lg border border-[#1e2440]">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#00e5a0]/10 border-b border-[#1e2440]">
                        <th className="p-4 text-left text-[#00e5a0] font-mono uppercase tracking-wider text-xs font-bold">Tier</th>
                        <th className="p-4 text-left text-[#00e5a0] font-mono uppercase tracking-wider text-xs font-bold">Monthly Fee</th>
                        <th className="p-4 text-left text-[#00e5a0] font-mono uppercase tracking-wider text-xs font-bold">Benefits</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-[#0c0f1a] border-b border-[#1e2440]/50 hover:bg-[#111525] transition-colors">
                        <td className="p-4 text-[#e8eaf6] font-mono text-sm font-bold">Standard</td>
                        <td className="p-4 text-[#8892b0] font-mono text-sm">Free</td>
                        <td className="p-4 text-[#8892b0] font-mono text-xs">Basic P2P trading, standard forecasting</td>
                      </tr>
                      <tr className="bg-[#111525] border-b border-[#1e2440]/50 hover:bg-[#1e2440]/50 transition-colors">
                        <td className="p-4 text-[#00e5a0] font-mono text-sm font-bold flex items-center gap-2">Premium <div className="w-2 h-2 rounded-full bg-[#00e5a0] shadow-[0_0_5px_#00e5a0]"></div></td>
                        <td className="p-4 text-[#e8eaf6] font-mono text-sm">$10/month</td>
                        <td className="p-4 text-[#8892b0] font-mono text-xs">Reduced transaction fees (0.5%), priority marketplace listings, advanced forecasting</td>
                      </tr>
                      <tr className="bg-[#0c0f1a] border-b border-[#1e2440]/50 hover:bg-[#111525] transition-colors">
                        <td className="p-4 text-[#a78bfa] font-mono text-sm font-bold flex items-center gap-2">Enterprise <div className="w-2 h-2 rounded-full bg-[#a78bfa] shadow-[0_0_5px_#a78bfa]"></div></td>
                        <td className="p-4 text-[#e8eaf6] font-mono text-sm">$50/month</td>
                        <td className="p-4 text-[#8892b0] font-mono text-xs">Zero transaction fees, API access, custom analytics, dedicated support</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h4 className="text-lg font-bold text-[#4d9fff] font-['Syne'] mt-8 mb-4">Consumer Plans</h4>
                <div className="overflow-x-auto mb-8 rounded-lg border border-[#1e2440]">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#00e5a0]/10 border-b border-[#1e2440]">
                        <th className="p-4 text-left text-[#00e5a0] font-mono uppercase tracking-wider text-xs font-bold">Tier</th>
                        <th className="p-4 text-left text-[#00e5a0] font-mono uppercase tracking-wider text-xs font-bold">Monthly Fee</th>
                        <th className="p-4 text-left text-[#00e5a0] font-mono uppercase tracking-wider text-xs font-bold">Benefits</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-[#0c0f1a] border-b border-[#1e2440]/50 hover:bg-[#111525] transition-colors">
                        <td className="p-4 text-[#e8eaf6] font-mono text-sm font-bold">Basic</td>
                        <td className="p-4 text-[#8892b0] font-mono text-sm">Free</td>
                        <td className="p-4 text-[#8892b0] font-mono text-xs">Marketplace access, basic consumption analytics</td>
                      </tr>
                      <tr className="bg-[#111525] border-b border-[#1e2440]/50 hover:bg-[#1e2440]/50 transition-colors">
                        <td className="p-4 text-[#4d9fff] font-mono text-sm font-bold flex items-center gap-2">Plus <div className="w-2 h-2 rounded-full bg-[#4d9fff] shadow-[0_0_5px_#4d9fff]"></div></td>
                        <td className="p-4 text-[#e8eaf6] font-mono text-sm">$5/month</td>
                        <td className="p-4 text-[#8892b0] font-mono text-xs">Price alerts, consumption optimization tools, preferred rates</td>
                      </tr>
                      <tr className="bg-[#0c0f1a] border-b border-[#1e2440]/50 hover:bg-[#111525] transition-colors">
                        <td className="p-4 text-[#00e5a0] font-mono text-sm font-bold flex items-center gap-2">Premium <div className="w-2 h-2 rounded-full bg-[#00e5a0] shadow-[0_0_5px_#00e5a0]"></div></td>
                        <td className="p-4 text-[#e8eaf6] font-mono text-sm">$15/month</td>
                        <td className="p-4 text-[#8892b0] font-mono text-xs">Automated purchasing, advanced forecasting, carbon footprint tracking</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h4 className="text-lg font-bold text-[#4d9fff] font-['Syne'] mt-8 mb-4">Utility Plans</h4>
                <div className="overflow-x-auto rounded-lg border border-[#1e2440]">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#00e5a0]/10 border-b border-[#1e2440]">
                        <th className="p-4 text-left text-[#00e5a0] font-mono uppercase tracking-wider text-xs font-bold">Tier</th>
                        <th className="p-4 text-left text-[#00e5a0] font-mono uppercase tracking-wider text-xs font-bold">Monthly Fee</th>
                        <th className="p-4 text-left text-[#00e5a0] font-mono uppercase tracking-wider text-xs font-bold">Benefits</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-[#0c0f1a] border-b border-[#1e2440]/50 hover:bg-[#111525] transition-colors">
                        <td className="p-4 text-[#e8eaf6] font-mono text-sm font-bold">Standard</td>
                        <td className="p-4 text-[#8892b0] font-mono text-sm">$100/month</td>
                        <td className="p-4 text-[#8892b0] font-mono text-xs">Basic grid monitoring, market analytics</td>
                      </tr>
                      <tr className="bg-[#111525] border-b border-[#1e2440]/50 hover:bg-[#1e2440]/50 transition-colors">
                        <td className="p-4 text-[#4d9fff] font-mono text-sm font-bold flex items-center gap-2">Professional <div className="w-2 h-2 rounded-full bg-[#4d9fff] shadow-[0_0_5px_#4d9fff]"></div></td>
                        <td className="p-4 text-[#e8eaf6] font-mono text-sm">$500/month</td>
                        <td className="p-4 text-[#8892b0] font-mono text-xs">Advanced grid optimization, detailed market insights, API access</td>
                      </tr>
                      <tr className="bg-[#0c0f1a] border-b border-[#1e2440]/50 hover:bg-[#111525] transition-colors">
                        <td className="p-4 text-[#a78bfa] font-mono text-sm font-bold flex items-center gap-2">Enterprise <div className="w-2 h-2 rounded-full bg-[#a78bfa] shadow-[0_0_5px_#a78bfa]"></div></td>
                        <td className="p-4 text-[#e8eaf6] font-mono text-sm">Custom pricing</td>
                        <td className="p-4 text-[#8892b0] font-mono text-xs">Full system integration, white-label solutions, custom development</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dynamicPricing' && (
            <div className="animate-in fade-in duration-500">
              <h2 className="text-2xl font-bold text-[#e8eaf6] font-['Syne'] mb-6">Dynamic Pricing Factors</h2>

              <div className="mb-8">
                <h3 className="text-lg font-bold text-[#00e5a0] uppercase tracking-wider font-mono mb-4">Supply-Demand Algorithm</h3>
                <p className="mb-4 text-[#8892b0] font-mono text-sm leading-relaxed">
                  The P2P marketplace incorporates a dynamic pricing algorithm that adjusts rates based on:
                </p>
                <ol className="list-decimal pl-6 space-y-3 text-[#8892b0] font-mono text-sm leading-relaxed">
                  <li><strong className="text-[#e8eaf6] font-bold">Current Supply:</strong> Available energy from all prosumers</li>
                  <li><strong className="text-[#e8eaf6] font-bold">Current Demand:</strong> Energy requirements from all consumers</li>
                  <li><strong className="text-[#e8eaf6] font-bold">Time of Day:</strong> Peak vs. off-peak pricing</li>
                  <li><strong className="text-[#e8eaf6] font-bold">Seasonal Factors:</strong> Weather-related adjustments</li>
                  <li><strong className="text-[#e8eaf6] font-bold">Grid Load:</strong> Current capacity utilization</li>
                </ol>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-bold text-[#00e5a0] uppercase tracking-wider font-mono mb-4">Price Calculation Formula</h3>
                <div className="bg-[#0c0f1a] p-6 rounded-lg mb-6 border border-[#1e2440] shadow-inner">
                  <code className="block text-[#00e5a0] font-mono text-sm md:text-base leading-relaxed">
                    Final Price = Base Price × Supply/Demand Factor × Time Factor × Seasonal Factor × (1 - Volume Discount)
                  </code>
                </div>
                <ul className="list-disc pl-6 space-y-3 text-[#8892b0] font-mono text-sm leading-relaxed">
                  <li><strong className="text-[#e8eaf6] font-bold">Base Price:</strong> Prosumer-set price per kWh</li>
                  <li><strong className="text-[#e8eaf6] font-bold">Supply/Demand Factor:</strong> Ranges from 0.8-1.5 based on market conditions</li>
                  <li><strong className="text-[#e8eaf6] font-bold">Time Factor:</strong> 0.8 (off-peak) to 1.4 (peak demand)</li>
                  <li><strong className="text-[#e8eaf6] font-bold">Seasonal Factor:</strong> 0.9-1.2 based on weather conditions</li>
                  <li><strong className="text-[#e8eaf6] font-bold">Volume Discount:</strong> 0-15% based on purchase volume</li>
                </ul>
              </div>

              <div className="mb-10">
                <h3 className="text-lg font-bold text-[#00e5a0] uppercase tracking-wider font-mono mb-4">Payment and Settlement</h3>
                
                <h4 className="text-lg font-bold text-[#4d9fff] font-['Syne'] mt-8 mb-4">Payment Methods</h4>
                <div className="flex flex-wrap gap-3 mb-8">
                  {['Credit/Debit Cards', 'PayPal/Digital Wallets', 'Bank Transfers', 'Cryptocurrency (Bitcoin, Ethereum)', 'Mobile Payment Solutions'].map((method) => (
                    <span key={method} className="bg-[#00e5a0]/10 text-[#00e5a0] px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider border border-[#00e5a0]/30 shadow-[0_0_10px_rgba(0,229,160,0.1)]">
                      {method}
                    </span>
                  ))}
                </div>

                <h4 className="text-lg font-bold text-[#4d9fff] font-['Syne'] mt-8 mb-4">Settlement Timeline</h4>
                <div className="overflow-x-auto rounded-lg border border-[#1e2440]">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#4d9fff]/10 border-b border-[#1e2440]">
                        <th className="p-4 text-left text-[#4d9fff] font-mono uppercase tracking-wider text-xs font-bold">Transaction Type</th>
                        <th className="p-4 text-left text-[#4d9fff] font-mono uppercase tracking-wider text-xs font-bold">Settlement Time</th>
                        <th className="p-4 text-left text-[#4d9fff] font-mono uppercase tracking-wider text-xs font-bold">Fee</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-[#0c0f1a] border-b border-[#1e2440]/50 hover:bg-[#111525] transition-colors">
                        <td className="p-4 text-[#e8eaf6] font-mono text-sm font-bold">Standard</td>
                        <td className="p-4 text-[#8892b0] font-mono text-sm">24-48 hours</td>
                        <td className="p-4 text-[#8892b0] font-mono text-xs">Included</td>
                      </tr>
                      <tr className="bg-[#111525] border-b border-[#1e2440]/50 hover:bg-[#1e2440]/50 transition-colors">
                        <td className="p-4 text-[#e8eaf6] font-mono text-sm font-bold">Express</td>
                        <td className="p-4 text-[#8892b0] font-mono text-sm">4 hours</td>
                        <td className="p-4 text-[#00e5a0] font-mono text-xs">+1%</td>
                      </tr>
                      <tr className="bg-[#0c0f1a] border-b border-[#1e2440]/50 hover:bg-[#111525] transition-colors">
                        <td className="p-4 text-[#e8eaf6] font-mono text-sm font-bold">Instant</td>
                        <td className="p-4 text-[#8892b0] font-mono text-sm">Immediate</td>
                        <td className="p-4 text-[#4d9fff] font-mono text-xs">+2.5%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#00e5a0] uppercase tracking-wider font-mono mb-4">Revenue Model Breakdown</h3>
                <div className="overflow-x-auto rounded-lg border border-[#1e2440]">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#00e5a0]/10 border-b border-[#1e2440]">
                        <th className="p-4 text-left text-[#00e5a0] font-mono uppercase tracking-wider text-xs font-bold">Revenue Stream</th>
                        <th className="p-4 text-left text-[#00e5a0] font-mono uppercase tracking-wider text-xs font-bold">Percentage of Total</th>
                        <th className="p-4 text-left text-[#00e5a0] font-mono uppercase tracking-wider text-xs font-bold">Growth Projection</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-[#0c0f1a] border-b border-[#1e2440]/50 hover:bg-[#111525] transition-colors">
                        <td className="p-4 text-[#e8eaf6] font-mono text-sm">Transaction Fees</td>
                        <td className="p-4 text-[#00e5a0] font-mono text-sm font-bold">35%</td>
                        <td className="p-4 text-[#8892b0] font-mono text-xs">15% annual</td>
                      </tr>
                      <tr className="bg-[#111525] border-b border-[#1e2440]/50 hover:bg-[#1e2440]/50 transition-colors">
                        <td className="p-4 text-[#e8eaf6] font-mono text-sm">Subscription Plans</td>
                        <td className="p-4 text-[#4d9fff] font-mono text-sm font-bold">25%</td>
                        <td className="p-4 text-[#8892b0] font-mono text-xs">30% annual</td>
                      </tr>
                      <tr className="bg-[#0c0f1a] border-b border-[#1e2440]/50 hover:bg-[#111525] transition-colors">
                        <td className="p-4 text-[#e8eaf6] font-mono text-sm">Grid Services</td>
                        <td className="p-4 text-[#00e5a0] font-mono text-sm font-bold">20%</td>
                        <td className="p-4 text-[#8892b0] font-mono text-xs">10% annual</td>
                      </tr>
                      <tr className="bg-[#111525] border-b border-[#1e2440]/50 hover:bg-[#1e2440]/50 transition-colors">
                        <td className="p-4 text-[#e8eaf6] font-mono text-sm">Data Analytics</td>
                        <td className="p-4 text-[#4d9fff] font-mono text-sm font-bold">10%</td>
                        <td className="p-4 text-[#8892b0] font-mono text-xs">40% annual</td>
                      </tr>
                      <tr className="bg-[#0c0f1a] border-b border-[#1e2440]/50 hover:bg-[#111525] transition-colors">
                        <td className="p-4 text-[#e8eaf6] font-mono text-sm">Value-Added Services</td>
                        <td className="p-4 text-[#a78bfa] font-mono text-sm font-bold">10%</td>
                        <td className="p-4 text-[#8892b0] font-mono text-xs">25% annual</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'incentives' && (
            <div className="animate-in fade-in duration-500">
              <h2 className="text-2xl font-bold text-[#e8eaf6] font-['Syne'] mb-6">Incentive Programs</h2>

              <div className="mb-10">
                <h3 className="text-lg font-bold text-[#00e5a0] uppercase tracking-wider font-mono mb-4">Renewable Energy Incentives</h3>
                <div className="overflow-x-auto rounded-lg border border-[#1e2440]">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#00e5a0]/10 border-b border-[#1e2440]">
                        <th className="p-4 text-left text-[#00e5a0] font-mono uppercase tracking-wider text-xs font-bold">Program</th>
                        <th className="p-4 text-left text-[#00e5a0] font-mono uppercase tracking-wider text-xs font-bold">Benefit</th>
                        <th className="p-4 text-left text-[#00e5a0] font-mono uppercase tracking-wider text-xs font-bold">Eligibility</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-[#0c0f1a] border-b border-[#1e2440]/50 hover:bg-[#111525] transition-colors">
                        <td className="p-4 text-[#e8eaf6] font-mono text-sm font-bold">Early Adopter</td>
                        <td className="p-4 text-[#00e5a0] font-mono text-sm font-bold">20% bonus EcoTokens</td>
                        <td className="p-4 text-[#8892b0] font-mono text-xs">First 1,000 prosumers</td>
                      </tr>
                      <tr className="bg-[#111525] border-b border-[#1e2440]/50 hover:bg-[#1e2440]/50 transition-colors">
                        <td className="p-4 text-[#e8eaf6] font-mono text-sm font-bold">Referral Program</td>
                        <td className="p-4 text-[#4d9fff] font-mono text-sm font-bold">10 EcoTokens per referral</td>
                        <td className="p-4 text-[#8892b0] font-mono text-xs">All users</td>
                      </tr>
                      <tr className="bg-[#0c0f1a] border-b border-[#1e2440]/50 hover:bg-[#111525] transition-colors">
                        <td className="p-4 text-[#e8eaf6] font-mono text-sm font-bold">Consistency Bonus</td>
                        <td className="p-4 text-[#00e5a0] font-mono text-sm font-bold">5% price premium</td>
                        <td className="p-4 text-[#8892b0] font-mono text-xs">Prosumers with {'>'} 90% uptime</td>
                      </tr>
                      <tr className="bg-[#111525] border-b border-[#1e2440]/50 hover:bg-[#1e2440]/50 transition-colors">
                        <td className="p-4 text-[#e8eaf6] font-mono text-sm font-bold">Green Energy Certificate</td>
                        <td className="p-4 text-[#a78bfa] font-mono text-sm font-bold">Official recognition</td>
                        <td className="p-4 text-[#8892b0] font-mono text-xs">100% renewable sources</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mb-10">
                <h3 className="text-lg font-bold text-[#00e5a0] uppercase tracking-wider font-mono mb-4">Grid Stabilization Rewards</h3>
                <p className="mb-4 text-[#8892b0] font-mono text-sm leading-relaxed">
                  Prosumers who help stabilize the grid during peak demand periods receive additional compensation:
                </p>
                <ul className="list-disc pl-6 space-y-3 text-[#8892b0] font-mono text-sm leading-relaxed">
                  <li><strong className="text-[#e8eaf6] font-bold">Peak Contribution Bonus:</strong> <span className="text-[#00e5a0]">+15%</span> on energy sold during peak hours</li>
                  <li><strong className="text-[#e8eaf6] font-bold">Demand Response Reward:</strong> <span className="text-[#00e5a0]">$0.05/kWh</span> for reducing consumption during alerts</li>
                  <li><strong className="text-[#e8eaf6] font-bold">Grid Support Credit:</strong> Monthly rewards for consistent energy provision</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'implementation' && (
             <div className="animate-in fade-in duration-500">
               <h2 className="text-2xl font-bold text-[#e8eaf6] font-['Syne'] mb-6">Implementation Roadmap</h2>
               
               <div className="relative border-l border-[#1e2440] ml-4 md:ml-6 mt-8 space-y-8">
                 <div className="relative pl-8">
                   <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#00e5a0] shadow-[0_0_10px_#00e5a0]"></div>
                   <h3 className="text-lg font-bold text-[#00e5a0] mb-2 font-['Syne']">Phase 1: Foundation</h3>
                   <p className="text-[#8892b0] font-mono text-sm leading-relaxed">Launch basic P2P trading for standard prosumers and consumers. Implement fixed-rate conversion for EcoTokens.</p>
                 </div>
                 
                 <div className="relative pl-8">
                   <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#4d9fff] shadow-[0_0_10px_#4d9fff] opacity-50"></div>
                   <h3 className="text-lg font-bold text-[#4d9fff] mb-2 font-['Syne']">Phase 2: Dynamic Markets</h3>
                   <p className="text-[#8892b0] font-mono text-sm leading-relaxed">Activate smart algorithms for dynamic pricing based on localized supply and demand constraints. Introduce peak-hour adjustments.</p>
                 </div>
                 
                 <div className="relative pl-8">
                   <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#a78bfa] shadow-[0_0_10px_#a78bfa] opacity-25"></div>
                   <h3 className="text-lg font-bold text-[#a78bfa] mb-2 font-['Syne']">Phase 3: Grid Services</h3>
                   <p className="text-[#8892b0] font-mono text-sm leading-relaxed">Roll out utility-scale tier access. Implement grid stabilization incentives and demand response programs.</p>
                 </div>
               </div>
             </div>
          )}
        </div>

        <footer className="text-center mt-12 pt-8 border-t border-[#1e2440]">
          <p className="text-[#8892b0] font-mono text-xs">&copy; 2025 EcoGrid - Sustainable Energy Trading Platform</p>
        </footer>
      </div>
    </div>
    </>
  );
};

export default PricingPage;
