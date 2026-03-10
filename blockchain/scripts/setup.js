const hre = require("hardhat");

async function main() {
    const energyTokenAddress = "0x27817269dcd44221217ef6cD00658E1b432c77a1";
    
    const EnergyToken = await hre.ethers.getContractFactory("contracts/EnergyToken.sol:EnergyToken");
    const energyToken = EnergyToken.attach(energyTokenAddress);

    const depositAmount = hre.ethers.parseEther("500000");
    
    console.log("Despositing 500,000 ENRG into the contract...");
    const tx = await energyToken.depositTokens(depositAmount);
    await tx.wait();
    console.log("Tokens deposited!");

    const bal = await energyToken.balanceOf(energyTokenAddress);
    console.log("Contract holding balance:", hre.ethers.formatEther(bal));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
