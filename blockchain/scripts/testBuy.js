const hre = require("hardhat");

async function main() {
    const energyTokenAddress = "0xe03dc81B683C05493d190606EC2ac661D50fACD4";
    const EnergyToken = await hre.ethers.getContractFactory("contracts/EnergyToken.sol:EnergyToken");
    const energyToken = EnergyToken.attach(energyTokenAddress);

    const amount = hre.ethers.parseEther("1");
    
    console.log("Getting dynamic price...");
    const price = await energyToken.getDynamicPrice(amount);
    console.log("Price for 1 token:", hre.ethers.formatEther(price), "MATIC");

    const bal = await energyToken.balanceOf(energyTokenAddress);
    console.log("Contract balance:", hre.ethers.formatEther(bal), "ENRG");

    console.log("Attempting buyEnergy...");
    try {
        const tx = await energyToken.buyEnergy(amount, { value: price });
        await tx.wait();
        console.log("Success!");
    } catch(err) {
        console.error("Revert details:", err);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
