// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract EnergyAMM {
    uint256 public tokenReserve = 100000 ether;
    uint256 public ethReserve = 100 ether;

    function getSwapPrice(uint256 tokenAmount) public view returns (uint256) {
        return (ethReserve * tokenAmount) / tokenReserve;
    }

    function swapEnergyForETH(uint256 tokenAmount) external {
        uint256 ethAmount = getSwapPrice(tokenAmount);
        require(address(this).balance >= ethAmount, "Not enough ETH in pool");

        tokenReserve += tokenAmount;
        ethReserve -= ethAmount;

        payable(msg.sender).transfer(ethAmount);
    }

    receive() external payable {}
}
