# EcoGrid Pricing Model

## Overview

EcoGrid's pricing model is designed to create a fair, transparent, and efficient marketplace for renewable energy trading. The model balances the needs of three key stakeholders: prosumers (who both produce and consume energy), consumers (who only purchase energy), and utilities (traditional grid operators).

## Core Pricing Components

### 1. Energy Token (EcoToken)

- **Base Value**: 1 EcoToken = 1 kWh of energy
- **Conversion Rate**: Initial rate of 1 EcoToken = $0.12 USD (adjustable based on market conditions)
- **Minimum Purchase**: 10 EcoTokens ($1.20 USD)
- **Transaction Fee**: 1% per transaction (supports platform maintenance)

### 2. P2P Energy Trading

| Component | Price Range | Notes |
|-----------|-------------|-------|
| Prosumer-set Price | $0.08-0.15 per kWh | Dynamic pricing based on supply/demand |
| Time-of-Day Pricing | +/- 20% adjustment | Higher during peak demand periods |
| Volume Discount | 5-15% | Applied to purchases >100 kWh |
| Renewable Premium | +5-10% | For certified 100% renewable energy |

### 3. Smart Grid Services

| Service | Fee Structure | Description |
|---------|---------------|-------------|
| Grid Access | $5/month | Base connection fee to access the grid |
| Grid Stabilization | 3% of transaction | Fee for maintaining grid reliability |
| Energy Storage | $0.03/kWh stored | Fee for utilizing virtual energy storage |
| Forecasting Service | $2/month | Access to AI forecasting insights |

### 4. Marketplace Tiers

#### Prosumer Plans

| Tier | Monthly Fee | Benefits |
|------|-------------|----------|
| Standard | Free | Basic P2P trading, standard forecasting |
| Premium | $10/month | Reduced transaction fees (0.5%), priority marketplace listings, advanced forecasting |
| Enterprise | $50/month | Zero transaction fees, API access, custom analytics, dedicated support |

#### Consumer Plans

| Tier | Monthly Fee | Benefits |
|------|-------------|----------|
| Basic | Free | Marketplace access, basic consumption analytics |
| Plus | $5/month | Price alerts, consumption optimization tools, preferred rates |
| Premium | $15/month | Automated purchasing, advanced forecasting, carbon footprint tracking |

#### Utility Plans

| Tier | Monthly Fee | Benefits |
|------|-------------|----------|
| Standard | $100/month | Basic grid monitoring, market analytics |
| Professional | $500/month | Advanced grid optimization, detailed market insights, API access |
| Enterprise | Custom pricing | Full system integration, white-label solutions, custom development |

## Dynamic Pricing Factors

### Supply-Demand Algorithm

The P2P marketplace incorporates a dynamic pricing algorithm that adjusts rates based on:

1. **Current Supply**: Available energy from all prosumers
2. **Current Demand**: Energy requirements from all consumers
3. **Time of Day**: Peak vs. off-peak pricing
4. **Seasonal Factors**: Weather-related adjustments
5. **Grid Load**: Current capacity utilization

### Price Calculation Formula

```
Final Price = Base Price × Supply/Demand Factor × Time Factor × Seasonal Factor × (1 - Volume Discount)
```

Where:
- Base Price: Prosumer-set price per kWh
- Supply/Demand Factor: Ranges from 0.8-1.5 based on market conditions
- Time Factor: 0.8 (off-peak) to 1.4 (peak demand)
- Seasonal Factor: 0.9-1.2 based on weather conditions
- Volume Discount: 0-15% based on purchase volume

## Incentive Programs

### Renewable Energy Incentives

| Program | Benefit | Eligibility |
|---------|---------|-------------|
| Early Adopter | 20% bonus EcoTokens | First 1,000 prosumers |
| Referral Program | 10 EcoTokens per referral | All users |
| Consistency Bonus | 5% price premium | Prosumers with >90% uptime |
| Green Energy Certificate | Official recognition | 100% renewable sources |

### Grid Stabilization Rewards

Prosumers who help stabilize the grid during peak demand periods receive additional compensation:

- **Peak Contribution Bonus**: +15% on energy sold during peak hours
- **Demand Response Reward**: $0.05/kWh for reducing consumption during alerts
- **Grid Support Credit**: Monthly rewards for consistent energy provision

## Payment and Settlement

### Payment Methods

- Credit/Debit Cards
- PayPal/Digital Wallets
- Bank Transfers
- Cryptocurrency (Bitcoin, Ethereum)
- Mobile Payment Solutions

### Settlement Timeline

| Transaction Type | Settlement Time | Fee |
|------------------|----------------|-----|
| Standard | 24-48 hours | Included |
| Express | 4 hours | +1% |
| Instant | Immediate | +2.5% |

## Revenue Model Breakdown

| Revenue Stream | Percentage of Total | Growth Projection |
|----------------|---------------------|-------------------|
| Transaction Fees | 35% | 15% annual |
| Subscription Plans | 25% | 30% annual |
| Grid Services | 20% | 10% annual |
| Data Analytics | 10% | 40% annual |
| Value-Added Services | 10% | 25% annual |

## Implementation for Hackathon Demo

For the hackathon demonstration, we'll implement a simplified version of this pricing model with:

1. **Working Marketplace UI** showing dynamic pricing
2. **Mock transactions** using EcoTokens on the Polygon Testnet
3. **Simulated supply-demand shifts** affecting pricing
4. **Visual dashboard** showing price trends and forecasts
5. **Sample user accounts** pre-loaded with different tier benefits

This pricing model demonstrates EcoGrid's innovation in creating a sustainable, market-driven approach to renewable energy distribution while providing clear monetization paths for platform growth.