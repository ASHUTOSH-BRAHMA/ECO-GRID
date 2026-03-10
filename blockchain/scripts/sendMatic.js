const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    const userAddress = "0xc071d2fC224dcCa2a5d5296F8850E741A050adbc";

    const amount = hre.ethers.parseEther("0.5"); // Send 0.5 MATIC

    console.log(`Sending ${hre.ethers.formatEther(amount)} MATIC from ${deployer.address} to ${userAddress}...`);

    const tx = await deployer.sendTransaction({
        to: userAddress,
        value: amount
    });

    await tx.wait();
    console.log("Successfully sent MATIC! Tx Hash:", tx.hash);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
