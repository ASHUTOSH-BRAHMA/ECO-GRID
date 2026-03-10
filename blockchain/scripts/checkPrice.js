const hre = require("hardhat");

async function main() {
    const energyTokenAddress = "0xe03dc81B683C05493d190606EC2ac661D50fACD4";
    const EnergyToken = await hre.ethers.getContractFactory("contracts/EnergyToken.sol:EnergyToken");
    const energyToken = EnergyToken.attach(energyTokenAddress);

    const amounts = ["1", "2"];
    for (let amt of amounts) {
        const amountWei = hre.ethers.parseEther(amt);
        const price = await energyToken.getDynamicPrice(amountWei);
        console.log(`Price for ${amt} tokens (in WEI): ${price.toString()}`);
        console.log(`Price for ${amt} tokens (in MATIC): ${hre.ethers.formatEther(price)}`);
    }
}

main().catch(console.error);
