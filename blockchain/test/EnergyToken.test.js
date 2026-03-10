const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EnergyToken", function () {
  let EnergyToken;
  let energyToken;
  let owner;
  let buyer;
  let seller;
  const INITIAL_SUPPLY = ethers.parseEther("1000000");

  beforeEach(async function () {
    [owner, buyer, seller] = await ethers.getSigners();
    EnergyToken = await ethers.getContractFactory("EnergyToken");
    energyToken = await EnergyToken.deploy();
    await energyToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await energyToken.name()).to.equal("EnergyToken");
      expect(await energyToken.symbol()).to.equal("ENRG");
    });

    it("Should mint initial supply to owner", async function () {
      expect(await energyToken.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY);
    });

    it("Should set owner correctly", async function () {
      expect(await energyToken.owner()).to.equal(owner.address);
    });

    it("Should have correct initial base price", async function () {
      expect(await energyToken.basePrice()).to.equal(ethers.parseEther("1"));
    });

    it("Should have correct supply factor", async function () {
      expect(await energyToken.supplyFactor()).to.equal(5000n);
    });
  });

  describe("Deposit Tokens", function () {
    it("Should allow owner to deposit tokens to contract", async function () {
      const depositAmount = ethers.parseEther("10000");
      await energyToken.depositTokens(depositAmount);
      expect(await energyToken.balanceOf(await energyToken.getAddress())).to.equal(depositAmount);
    });

    it("Should fail if non-owner tries to deposit", async function () {
      const depositAmount = ethers.parseEther("10000");
      await energyToken.transfer(buyer.address, depositAmount);
      
      let failed = false;
      try {
        await energyToken.connect(buyer).depositTokens(depositAmount);
      } catch (e) {
        failed = true;
      }
      expect(failed).to.be.true;
    });
  });

  describe("Dynamic Pricing", function () {
    beforeEach(async function () {
      const depositAmount = ethers.parseEther("900000");
      await energyToken.depositTokens(depositAmount);
    });

    it("Should calculate dynamic price based on supply", async function () {
      const amount = ethers.parseEther("100");
      const price = await energyToken.getDynamicPrice(amount);
      expect(price > 0n).to.be.true;
    });

    it("Should return price greater than or equal to base price", async function () {
      const amount = ethers.parseEther("100");
      const price = await energyToken.getDynamicPrice(amount);
      const basePrice = await energyToken.basePrice();
      expect(price >= basePrice).to.be.true;
    });
  });

  describe("Buy Energy", function () {
    beforeEach(async function () {
      const depositAmount = ethers.parseEther("999990");
      await energyToken.depositTokens(depositAmount);
    });

    it("Should allow buying energy with sufficient ETH", async function () {
      const amount = 1000n;
      const price = await energyToken.getDynamicPrice(amount);
      
      await energyToken.connect(buyer).buyEnergy(amount, { value: price });
      
      expect(await energyToken.balanceOf(buyer.address)).to.equal(amount);
      expect(await energyToken.energyBalance(buyer.address)).to.equal(amount);
    });

    it("Should fail if insufficient ETH is sent", async function () {
      const amount = 1000n;
      const price = await energyToken.getDynamicPrice(amount);
      const insufficientPrice = price / 2n;
      
      let failed = false;
      try {
        await energyToken.connect(buyer).buyEnergy(amount, { value: insufficientPrice });
      } catch (e) {
        failed = true;
      }
      expect(failed).to.be.true;
    });

    it("Should fail if contract has insufficient tokens", async function () {
      const tooMuchAmount = ethers.parseEther("1000000");
      
      let failed = false;
      try {
        await energyToken.connect(buyer).buyEnergy(tooMuchAmount, { value: ethers.parseEther("10") });
      } catch (e) {
        failed = true;
      }
      expect(failed).to.be.true;
    });

    it("Should update energy balance after purchase", async function () {
      const amount = 500n;
      const price = await energyToken.getDynamicPrice(amount);
      
      await energyToken.connect(buyer).buyEnergy(amount, { value: price });
      expect(await energyToken.energyBalance(buyer.address)).to.equal(amount);
      
      const price2 = await energyToken.getDynamicPrice(amount);
      await energyToken.connect(buyer).buyEnergy(amount, { value: price2 });
      expect(await energyToken.energyBalance(buyer.address)).to.equal(amount * 2n);
    });

    it("Should emit EnergyBought event", async function () {
      const amount = 1000n;
      const price = await energyToken.getDynamicPrice(amount);
      
      const tx = await energyToken.connect(buyer).buyEnergy(amount, { value: price });
      const receipt = await tx.wait();
      
      const event = receipt.logs.find(log => {
        try {
          return energyToken.interface.parseLog(log)?.name === "EnergyBought";
        } catch { return false; }
      });
      expect(event).to.not.be.undefined;
    });
  });

  describe("Sell Energy", function () {
    beforeEach(async function () {
      const depositAmount = ethers.parseEther("999990");
      await energyToken.depositTokens(depositAmount);

      const buyAmount = 10000n;
      const price = await energyToken.getDynamicPrice(buyAmount);
      await energyToken.connect(buyer).buyEnergy(buyAmount, { value: price });
      
      await owner.sendTransaction({
        to: await energyToken.getAddress(),
        value: ethers.parseEther("100")
      });
    });

    it("Should allow selling energy tokens", async function () {
      const sellAmount = 1000n;
      
      const tx = await energyToken.connect(buyer).sellEnergy(sellAmount);
      const receipt = await tx.wait();
      
      const event = receipt.logs.find(log => {
        try {
          return energyToken.interface.parseLog(log)?.name === "EnergySold";
        } catch { return false; }
      });
      expect(event).to.not.be.undefined;
      
      expect(await energyToken.balanceOf(buyer.address)).to.equal(9000n);
    });

    it("Should fail if seller has insufficient tokens", async function () {
      const tooMuchAmount = 20000n;
      
      let failed = false;
      try {
        await energyToken.connect(buyer).sellEnergy(tooMuchAmount);
      } catch (e) {
        failed = true;
      }
      expect(failed).to.be.true;
    });

    it("Should update energy balance after sale", async function () {
      const sellAmount = 1000n;
      const initialEnergyBalance = await energyToken.energyBalance(buyer.address);
      
      await energyToken.connect(buyer).sellEnergy(sellAmount);
      
      expect(await energyToken.energyBalance(buyer.address)).to.equal(
        initialEnergyBalance - sellAmount
      );
    });
  });

  describe("ERC20 Standard Functions", function () {
    it("Should allow token transfers", async function () {
      const transferAmount = ethers.parseEther("1000");
      await energyToken.transfer(buyer.address, transferAmount);
      expect(await energyToken.balanceOf(buyer.address)).to.equal(transferAmount);
    });

    it("Should allow approvals and transferFrom", async function () {
      const approveAmount = ethers.parseEther("500");
      await energyToken.approve(buyer.address, approveAmount);
      expect(await energyToken.allowance(owner.address, buyer.address)).to.equal(approveAmount);
      
      await energyToken.connect(buyer).transferFrom(owner.address, seller.address, approveAmount);
      expect(await energyToken.balanceOf(seller.address)).to.equal(approveAmount);
    });

    it("Should return correct total supply", async function () {
      expect(await energyToken.totalSupply()).to.equal(INITIAL_SUPPLY);
    });
  });
});
