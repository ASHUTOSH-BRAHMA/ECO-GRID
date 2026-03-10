const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EnergyExchange", function () {
  let EnergyExchange;
  let energyExchange;
  let owner;
  let buyer1;
  let buyer2;
  let seller1;
  let seller2;

  beforeEach(async function () {
    [owner, buyer1, buyer2, seller1, seller2] = await ethers.getSigners();
    EnergyExchange = await ethers.getContractFactory("EnergyExchange");
    energyExchange = await EnergyExchange.deploy();
    await energyExchange.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      const address = await energyExchange.getAddress();
      expect(address).to.match(/^0x[a-fA-F0-9]{40}$/);
    });
  });

  describe("Place Order", function () {
    it("Should allow placing a buy order", async function () {
      const amount = ethers.parseEther("100");
      const price = ethers.parseEther("0.01");
      
      const tx = await energyExchange.connect(buyer1).placeOrder(amount, price, true);
      const receipt = await tx.wait();
      
      const event = receipt.logs.find(log => {
        try {
          return energyExchange.interface.parseLog(log)?.name === "OrderPlaced";
        } catch { return false; }
      });
      expect(event).to.not.be.undefined;
    });

    it("Should allow placing a sell order", async function () {
      const amount = ethers.parseEther("50");
      const price = ethers.parseEther("0.02");
      
      const tx = await energyExchange.connect(seller1).placeOrder(amount, price, false);
      const receipt = await tx.wait();
      
      const event = receipt.logs.find(log => {
        try {
          return energyExchange.interface.parseLog(log)?.name === "OrderPlaced";
        } catch { return false; }
      });
      expect(event).to.not.be.undefined;
    });

    it("Should store order in order book", async function () {
      const amount = ethers.parseEther("100");
      const price = ethers.parseEther("0.01");
      
      await energyExchange.connect(buyer1).placeOrder(amount, price, true);
      
      const order = await energyExchange.orderBook(0);
      expect(order.user).to.equal(buyer1.address);
      expect(order.amount).to.equal(amount);
      expect(order.price).to.equal(price);
      expect(order.isBuyOrder).to.be.true;
    });

    it("Should allow multiple orders from the same user", async function () {
      const amount1 = ethers.parseEther("100");
      const price1 = ethers.parseEther("0.01");
      const amount2 = ethers.parseEther("200");
      const price2 = ethers.parseEther("0.015");
      
      await energyExchange.connect(buyer1).placeOrder(amount1, price1, true);
      await energyExchange.connect(buyer1).placeOrder(amount2, price2, true);
      
      const order1 = await energyExchange.orderBook(0);
      const order2 = await energyExchange.orderBook(1);
      
      expect(order1.amount).to.equal(amount1);
      expect(order2.amount).to.equal(amount2);
    });
  });

  describe("Order Matching", function () {
    it("Should match buy and sell orders with compatible prices", async function () {
      const buyAmount = ethers.parseEther("100");
      const buyPrice = ethers.parseEther("0.02");
      const sellAmount = ethers.parseEther("100");
      const sellPrice = ethers.parseEther("0.01");

      await energyExchange.connect(buyer1).placeOrder(buyAmount, buyPrice, true);
      
      const tx = await energyExchange.connect(seller1).placeOrder(sellAmount, sellPrice, false);
      const receipt = await tx.wait();
      
      const event = receipt.logs.find(log => {
        try {
          return energyExchange.interface.parseLog(log)?.name === "OrderExecuted";
        } catch { return false; }
      });
      expect(event).to.not.be.undefined;
    });

    it("Should not match orders with incompatible prices", async function () {
      const buyAmount = ethers.parseEther("100");
      const buyPrice = ethers.parseEther("0.01");
      const sellAmount = ethers.parseEther("100");
      const sellPrice = ethers.parseEther("0.02");

      await energyExchange.connect(buyer1).placeOrder(buyAmount, buyPrice, true);
      
      const tx = await energyExchange.connect(seller1).placeOrder(sellAmount, sellPrice, false);
      const receipt = await tx.wait();
      
      const orderExecutedEvents = receipt.logs.filter(log => {
        try {
          return energyExchange.interface.parseLog(log)?.name === "OrderExecuted";
        } catch { return false; }
      });
      expect(orderExecutedEvents.length).to.equal(0);
    });

    it("Should partially fill orders when amounts differ", async function () {
      const buyAmount = ethers.parseEther("100");
      const buyPrice = ethers.parseEther("0.02");
      const sellAmount = ethers.parseEther("50");
      const sellPrice = ethers.parseEther("0.01");

      await energyExchange.connect(buyer1).placeOrder(buyAmount, buyPrice, true);
      await energyExchange.connect(seller1).placeOrder(sellAmount, sellPrice, false);
      
      const buyOrder = await energyExchange.orderBook(0);
      expect(buyOrder.amount).to.equal(ethers.parseEther("50"));
    });

    it("Should handle multiple matching orders in sequence", async function () {
      const buyAmount = ethers.parseEther("200");
      const buyPrice = ethers.parseEther("0.03");
      
      await energyExchange.connect(buyer1).placeOrder(buyAmount, buyPrice, true);
      
      await energyExchange.connect(seller1).placeOrder(
        ethers.parseEther("100"), 
        ethers.parseEther("0.01"), 
        false
      );
      
      const buyOrder = await energyExchange.orderBook(0);
      expect(buyOrder.amount).to.equal(ethers.parseEther("100"));
    });

    it("Should not match two buy orders", async function () {
      await energyExchange.connect(buyer1).placeOrder(
        ethers.parseEther("100"),
        ethers.parseEther("0.02"),
        true
      );
      
      const tx = await energyExchange.connect(buyer2).placeOrder(
        ethers.parseEther("100"),
        ethers.parseEther("0.01"),
        true
      );
      
      const receipt = await tx.wait();
      const orderExecutedEvents = receipt.logs.filter(log => {
        try {
          return energyExchange.interface.parseLog(log)?.name === "OrderExecuted";
        } catch { return false; }
      });
      expect(orderExecutedEvents.length).to.equal(0);
    });

    it("Should not match two sell orders", async function () {
      await energyExchange.connect(seller1).placeOrder(
        ethers.parseEther("100"),
        ethers.parseEther("0.01"),
        false
      );
      
      const tx = await energyExchange.connect(seller2).placeOrder(
        ethers.parseEther("100"),
        ethers.parseEther("0.02"),
        false
      );
      
      const receipt = await tx.wait();
      const orderExecutedEvents = receipt.logs.filter(log => {
        try {
          return energyExchange.interface.parseLog(log)?.name === "OrderExecuted";
        } catch { return false; }
      });
      expect(orderExecutedEvents.length).to.equal(0);
    });
  });

  describe("Order Book Queries", function () {
    it("Should allow reading individual orders", async function () {
      await energyExchange.connect(buyer1).placeOrder(
        ethers.parseEther("100"),
        ethers.parseEther("0.01"),
        true
      );
      
      const order = await energyExchange.orderBook(0);
      expect(order.user).to.equal(buyer1.address);
    });

    it("Should maintain order history", async function () {
      await energyExchange.connect(buyer1).placeOrder(
        ethers.parseEther("100"),
        ethers.parseEther("0.01"),
        true
      );
      
      await energyExchange.connect(seller1).placeOrder(
        ethers.parseEther("50"),
        ethers.parseEther("0.02"),
        false
      );
      
      await energyExchange.connect(buyer2).placeOrder(
        ethers.parseEther("75"),
        ethers.parseEther("0.015"),
        true
      );
      
      const order1 = await energyExchange.orderBook(0);
      const order2 = await energyExchange.orderBook(1);
      const order3 = await energyExchange.orderBook(2);
      
      expect(order1.isBuyOrder).to.be.true;
      expect(order2.isBuyOrder).to.be.false;
      expect(order3.isBuyOrder).to.be.true;
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero amount orders", async function () {
      await energyExchange.connect(buyer1).placeOrder(
        0n,
        ethers.parseEther("0.01"),
        true
      );
      
      const order = await energyExchange.orderBook(0);
      expect(order.amount).to.equal(0n);
    });

    it("Should handle very large amounts", async function () {
      const largeAmount = ethers.parseEther("1000000000");
      await energyExchange.connect(buyer1).placeOrder(
        largeAmount,
        ethers.parseEther("0.01"),
        true
      );
      
      const order = await energyExchange.orderBook(0);
      expect(order.amount).to.equal(largeAmount);
    });

    it("Should handle orders with same price", async function () {
      const samePrice = ethers.parseEther("0.01");
      
      await energyExchange.connect(buyer1).placeOrder(
        ethers.parseEther("100"),
        samePrice,
        true
      );
      
      const tx = await energyExchange.connect(seller1).placeOrder(
        ethers.parseEther("100"),
        samePrice,
        false
      );
      const receipt = await tx.wait();
      
      const event = receipt.logs.find(log => {
        try {
          return energyExchange.interface.parseLog(log)?.name === "OrderExecuted";
        } catch { return false; }
      });
      expect(event).to.not.be.undefined;
    });
  });
});
