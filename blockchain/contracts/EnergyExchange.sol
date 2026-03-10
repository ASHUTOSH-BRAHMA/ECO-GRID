// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract EnergyExchange {
    struct Order {
        address user;
        uint256 amount;
        uint256 price;
        bool isBuyOrder;
    }

    Order[] public orderBook;

    event OrderPlaced(address indexed user, uint256 amount, uint256 price, bool isBuyOrder);
    event OrderExecuted(address buyer, address seller, uint256 amount, uint256 price);

    function placeOrder(uint256 amount, uint256 price, bool isBuyOrder) public {
        orderBook.push(Order(msg.sender, amount, price, isBuyOrder));
        emit OrderPlaced(msg.sender, amount, price, isBuyOrder);
        matchOrders();
    }

    function matchOrders() internal {
        for (uint256 i = 0; i < orderBook.length; i++) {
            for (uint256 j = i + 1; j < orderBook.length; j++) {
                if (orderBook[i].isBuyOrder != orderBook[j].isBuyOrder && orderBook[i].price >= orderBook[j].price) {
                    executeTrade(i, j);
                    break;
                }
            }
        }
    }

    function executeTrade(uint256 buyIndex, uint256 sellIndex) internal {
        Order storage buyOrder = orderBook[buyIndex];
        Order storage sellOrder = orderBook[sellIndex];

        uint256 tradeAmount = buyOrder.amount < sellOrder.amount ? buyOrder.amount : sellOrder.amount;
        buyOrder.amount -= tradeAmount;
        sellOrder.amount -= tradeAmount;

        emit OrderExecuted(buyOrder.user, sellOrder.user, tradeAmount, buyOrder.price);
    }
}
