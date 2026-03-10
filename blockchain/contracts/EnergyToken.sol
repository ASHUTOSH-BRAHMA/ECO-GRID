// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract EnergyToken is ERC20, Ownable {
    uint256 public constant INITIAL_SUPPLY = 1_000_000 * (10 ** 18);
    uint256 public basePrice = 0.01 ether;
    uint256 public supplyFactor = 5000;

    mapping(address => uint256) public energyBalance;

    event EnergyBought(address indexed buyer, uint256 amount, uint256 price);
    event EnergySold(address indexed seller, uint256 amount, uint256 price);

    constructor() ERC20("EnergyToken", "ENRG") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    function buyEnergy(uint256 amount) external payable {
        uint256 price = getDynamicPrice(amount);
        require(msg.value >= price, "Insufficient ETH sent");
        require(balanceOf(address(this)) >= amount, "Not enough energy tokens");

        _transfer(address(this), msg.sender, amount);
        energyBalance[msg.sender] += amount;

        emit EnergyBought(msg.sender, amount, price);
    }

    function sellEnergy(uint256 amount) external {
        require(balanceOf(msg.sender) >= amount, "Not enough tokens to sell");

        uint256 price = getDynamicPrice(amount);
        _transfer(msg.sender, address(this), amount);
        energyBalance[msg.sender] -= amount;

        payable(msg.sender).transfer(price);
        emit EnergySold(msg.sender, amount, price);
    }

    function getDynamicPrice(uint256 amount) public view returns (uint256) {
        uint256 availableSupply = balanceOf(address(this));
        uint256 tokensSold = (totalSupply() - availableSupply) / 1e18;
        
        // Increase price by 0.001 MATIC for every `supplyFactor` tokens sold
        uint256 currentPricePerToken = basePrice + ((tokensSold / supplyFactor) * 0.001 ether);
        
        return (currentPricePerToken * amount) / 1e18;
    }

    function depositTokens(uint256 amount) external onlyOwner {
        _transfer(msg.sender, address(this), amount);
    }

    receive() external payable {}
}
