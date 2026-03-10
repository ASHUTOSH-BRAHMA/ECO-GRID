const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // Deploy EnergyToken
    const EnergyToken = await hre.ethers.getContractFactory("contracts/EnergyToken.sol:EnergyToken");
    const energyToken = await EnergyToken.deploy();
    await energyToken.waitForDeployment();
    console.log("EnergyToken deployed to:", await energyToken.getAddress());

    // Deploy EnergyExchange
    const EnergyExchange = await hre.ethers.getContractFactory("contracts/EnergyExchange.sol:EnergyExchange");
    const energyExchange = await EnergyExchange.deploy();
    await energyExchange.waitForDeployment();
    console.log("EnergyExchange deployed to:", await energyExchange.getAddress());

    // Deploy EnergyAMM
    const EnergyAMM = await hre.ethers.getContractFactory("contracts/EnergyAMM.sol:EnergyAMM");
    const energyAMM = await EnergyAMM.deploy();
    await energyAMM.waitForDeployment();
    console.log("EnergyAMM deployed to:", await energyAMM.getAddress());

    // Deposit tokens so trading works out of the box
    console.log("Depositing initial 500,000 ENRG reserve into EnergyToken...");
    const depositAmount = hre.ethers.parseEther("500000");
    const tx = await energyToken.depositTokens(depositAmount);
    await tx.wait();
    console.log("Initial reserve deposited successfully!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});