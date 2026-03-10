const hre = require("hardhat");

async function main() {
    const EnergyToken = await hre.ethers.getContractFactory("contracts/EnergyToken.sol:EnergyToken");
    
    const oldAddress = "0x27817269dcd44221217ef6cD00658E1b432c77a1";
    const newAddress = "0xe03dc81B683C05493d190606EC2ac661D50fACD4";
    
    const oldToken = EnergyToken.attach(oldAddress);
    const newToken = EnergyToken.attach(newAddress);

    const amountWei = hre.ethers.parseEther("1");
    
    try {
        const p1 = await oldToken.getDynamicPrice(amountWei);
        console.log(`OLD Contract Price: ${p1.toString()}`);
    } catch(e) { console.log("OLD Error:", e.message); }
    
    try {
        const p2 = await newToken.getDynamicPrice(amountWei);
        console.log(`NEW Contract Price: ${p2.toString()}`);
    } catch(e) { console.log("NEW Error:", e.message); }
}

main().catch(console.error);
