const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EnergyAMM", function () {
  let EnergyAMM;
  let energyAMM;
  let owner;
  let user1;
  let user2;
  const INITIAL_TOKEN_RESERVE = ethers.parseEther("100000");
  const INITIAL_ETH_RESERVE = ethers.parseEther("100");

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    EnergyAMM = await ethers.getContractFactory("EnergyAMM");
    energyAMM = await EnergyAMM.deploy();
    await energyAMM.waitForDeployment();
    
    await owner.sendTransaction({
      to: await energyAMM.getAddress(),
      value: INITIAL_ETH_RESERVE
    });
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      const address = await energyAMM.getAddress();
      expect(address).to.match(/^0x[a-fA-F0-9]{40}$/);
    });

    it("Should have correct initial token reserve", async function () {
      expect(await energyAMM.tokenReserve()).to.equal(INITIAL_TOKEN_RESERVE);
    });

    it("Should have correct initial ETH reserve", async function () {
      expect(await energyAMM.ethReserve()).to.equal(INITIAL_ETH_RESERVE);
    });
  });

  describe("Get Swap Price", function () {
    it("Should calculate swap price correctly", async function () {
      const tokenAmount = ethers.parseEther("1000");
      const expectedPrice = (INITIAL_ETH_RESERVE * tokenAmount) / INITIAL_TOKEN_RESERVE;
      
      const price = await energyAMM.getSwapPrice(tokenAmount);
      expect(price).to.equal(expectedPrice);
    });

    it("Should return 0 for 0 token amount", async function () {
      const price = await energyAMM.getSwapPrice(0);
      expect(price).to.equal(0n);
    });

    it("Should calculate proportional prices", async function () {
      const amount1 = ethers.parseEther("100");
      const amount2 = ethers.parseEther("200");
      
      const price1 = await energyAMM.getSwapPrice(amount1);
      const price2 = await energyAMM.getSwapPrice(amount2);
      
      expect(price2).to.equal(price1 * 2n);
    });

    it("Should calculate correct price for large amounts", async function () {
      const largeAmount = ethers.parseEther("50000");
      const expectedPrice = (INITIAL_ETH_RESERVE * largeAmount) / INITIAL_TOKEN_RESERVE;
      
      const price = await energyAMM.getSwapPrice(largeAmount);
      expect(price).to.equal(expectedPrice);
    });

    it("Should handle small token amounts", async function () {
      const smallAmount = ethers.parseEther("0.001");
      const price = await energyAMM.getSwapPrice(smallAmount);
      expect(price >= 0n).to.be.true;
    });
  });

  describe("Swap Energy for ETH", function () {
    it("Should execute swap successfully", async function () {
      const tokenAmount = ethers.parseEther("1000");
      const expectedEthAmount = await energyAMM.getSwapPrice(tokenAmount);
      
      const initialBalance = await ethers.provider.getBalance(user1.address);
      await energyAMM.connect(user1).swapEnergyForETH(tokenAmount);
      const finalBalance = await ethers.provider.getBalance(user1.address);
      
      expect(finalBalance > initialBalance - ethers.parseEther("0.1")).to.be.true;
    });

    it("Should update token reserve after swap", async function () {
      const tokenAmount = ethers.parseEther("1000");
      const initialTokenReserve = await energyAMM.tokenReserve();
      
      await energyAMM.connect(user1).swapEnergyForETH(tokenAmount);
      
      const newTokenReserve = await energyAMM.tokenReserve();
      expect(newTokenReserve).to.equal(initialTokenReserve + tokenAmount);
    });

    it("Should update ETH reserve after swap", async function () {
      const tokenAmount = ethers.parseEther("1000");
      const expectedEthAmount = await energyAMM.getSwapPrice(tokenAmount);
      const initialEthReserve = await energyAMM.ethReserve();
      
      await energyAMM.connect(user1).swapEnergyForETH(tokenAmount);
      
      const newEthReserve = await energyAMM.ethReserve();
      expect(newEthReserve).to.equal(initialEthReserve - expectedEthAmount);
    });

    it("Should fail if pool has insufficient ETH", async function () {
      const hugeAmount = ethers.parseEther("500000");
      
      let failed = false;
      try {
        await energyAMM.connect(user1).swapEnergyForETH(hugeAmount);
      } catch (e) {
        failed = true;
        expect(e.message).to.include("Not enough ETH in pool");
      }
      expect(failed).to.be.true;
    });

    it("Should allow multiple sequential swaps", async function () {
      const tokenAmount = ethers.parseEther("500");
      
      await energyAMM.connect(user1).swapEnergyForETH(tokenAmount);
      await energyAMM.connect(user2).swapEnergyForETH(tokenAmount);
      
      const finalTokenReserve = await energyAMM.tokenReserve();
      expect(finalTokenReserve).to.equal(INITIAL_TOKEN_RESERVE + tokenAmount * 2n);
    });

    it("Should transfer correct ETH amount to user", async function () {
      const tokenAmount = ethers.parseEther("1000");
      const expectedEthAmount = await energyAMM.getSwapPrice(tokenAmount);
      
      const initialBalance = await ethers.provider.getBalance(user1.address);
      const tx = await energyAMM.connect(user1).swapEnergyForETH(tokenAmount);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const finalBalance = await ethers.provider.getBalance(user1.address);
      
      const received = finalBalance - initialBalance + gasUsed;
      expect(received).to.equal(expectedEthAmount);
    });
  });

  describe("Price Impact", function () {
    it("Should show price impact on large swaps", async function () {
      const smallAmount = ethers.parseEther("100");
      const largeAmount = ethers.parseEther("10000");
      
      const priceBeforeSmall = await energyAMM.getSwapPrice(smallAmount);
      await energyAMM.connect(user1).swapEnergyForETH(largeAmount);
      const priceAfterLarge = await energyAMM.getSwapPrice(smallAmount);
      
      expect(priceAfterLarge < priceBeforeSmall).to.be.true;
    });

    it("Should adjust reserves proportionally after swaps", async function () {
      const tokenAmount = ethers.parseEther("1000");
      
      const initialTokenReserve = await energyAMM.tokenReserve();
      const initialEthReserve = await energyAMM.ethReserve();
      
      await energyAMM.connect(user1).swapEnergyForETH(tokenAmount);
      
      const finalTokenReserve = await energyAMM.tokenReserve();
      const finalEthReserve = await energyAMM.ethReserve();
      
      expect(finalTokenReserve > initialTokenReserve).to.be.true;
      expect(finalEthReserve < initialEthReserve).to.be.true;
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero token swap (no-op)", async function () {
      const initialEthReserve = await energyAMM.ethReserve();
      const initialTokenReserve = await energyAMM.tokenReserve();
      
      await energyAMM.connect(user1).swapEnergyForETH(0);
      
      expect(await energyAMM.ethReserve()).to.equal(initialEthReserve);
      expect(await energyAMM.tokenReserve()).to.equal(initialTokenReserve);
    });

    it("Should allow swap that drains most of the pool", async function () {
      const maxSwap = ethers.parseEther("90000");
      const ethOutput = await energyAMM.getSwapPrice(maxSwap);
      
      if (ethOutput < INITIAL_ETH_RESERVE) {
        let success = true;
        try {
          await energyAMM.connect(user1).swapEnergyForETH(maxSwap);
        } catch {
          success = false;
        }
        expect(success).to.be.true;
      }
    });

    it("Should handle concurrent swaps from different users", async function () {
      const amount = ethers.parseEther("500");
      
      await Promise.all([
        energyAMM.connect(user1).swapEnergyForETH(amount),
        energyAMM.connect(user2).swapEnergyForETH(amount)
      ]);
      
      const finalTokenReserve = await energyAMM.tokenReserve();
      expect(finalTokenReserve >= INITIAL_TOKEN_RESERVE + amount).to.be.true;
    });
  });

  describe("Pool State Queries", function () {
    it("Should return current token reserve", async function () {
      const tokenReserve = await energyAMM.tokenReserve();
      expect(tokenReserve).to.equal(INITIAL_TOKEN_RESERVE);
    });

    it("Should return current ETH reserve", async function () {
      const ethReserve = await energyAMM.ethReserve();
      expect(ethReserve).to.equal(INITIAL_ETH_RESERVE);
    });

    it("Should reflect reserve changes after swaps", async function () {
      const tokenAmount = ethers.parseEther("2000");
      const ethAmount = await energyAMM.getSwapPrice(tokenAmount);
      
      await energyAMM.connect(user1).swapEnergyForETH(tokenAmount);
      
      expect(await energyAMM.tokenReserve()).to.equal(INITIAL_TOKEN_RESERVE + tokenAmount);
      expect(await energyAMM.ethReserve()).to.equal(INITIAL_ETH_RESERVE - ethAmount);
    });
  });
});
