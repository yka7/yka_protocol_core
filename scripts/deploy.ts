import { formatEther, parseEther, zeroAddress } from "viem";
import hre from "hardhat"; // Hardhat Runtime Environment

async function main() {
  // --- Configuration ---
  const initialSupply = parseEther("1000000"); // Set the initial supply (e.g., 1 million tokens)
  const initialOwner = (await hre.viem.getWalletClients())[0].account?.address; // Use the first account from Hardhat node as owner

  if (!initialOwner) {
    throw new Error(
      "Could not get initial owner address. Ensure Hardhat node is running and has accounts."
    );
  }
  if (initialOwner === zeroAddress) {
    throw new Error("Initial owner address cannot be the zero address.");
  }

  console.log(`Deploying YKAToken with:`);
  console.log(`  Initial Supply: ${formatEther(initialSupply)} YKA`);
  console.log(`  Initial Owner: ${initialOwner}`);
  console.log("----------------------------------------------------");

  // --- Deployment ---
  // Get the contract factory for YKAToken
  const ykaToken = await hre.viem.deployContract("YKAToken", [], {}); // Deploy the implementation contract first (no constructor args for proxy)

  console.log(`YKAToken implementation deployed to: ${ykaToken.address}`);

  // --- Deployment (Using Upgradeable Proxy - Recommended) ---
  // If you plan to upgrade the contract later, use a proxy.
  // Hardhat-upgrades plugin handles proxy deployment and initialization.

  // Get the contract factory using the upgrades plugin
  const YKATokenFactory = await hre.ethers.getContractFactory("YKAToken"); // Use ethers for upgrades plugin

  console.log("Deploying YKAToken proxy and initializing...");

  // Deploy the proxy and call the initializer function
  const ykaTokenProxy = await hre.upgrades.deployProxy(
    YKATokenFactory,
    [initialSupply, initialOwner], // Arguments for the initialize function
    { initializer: "initialize", kind: "uups" } // Specify initializer and UUPS proxy kind
  );

  // Wait for the deployment transaction to be mined
  await ykaTokenProxy.waitForDeployment();

  const proxyAddress = await ykaTokenProxy.getAddress(); // Get the proxy address

  console.log("----------------------------------------------------");
  console.log(`YKAToken (Proxy) deployed to: ${proxyAddress}`);
  console.log(
    `Implementation contract address: ${await hre.upgrades.erc1967.getImplementationAddress(
      proxyAddress
    )}`
  );
  console.log(
    `Admin contract address: ${await hre.upgrades.erc1967.getAdminAddress(
      proxyAddress
    )}`
  );
  console.log("----------------------------------------------------");

  // --- Verification (Optional) ---
  // Wait for a few blocks to ensure Etherscan propagation if verifying immediately
  // await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds delay

  // console.log("Verifying contract on Etherscan...");
  // try {
  //   await hre.run("verify:verify", {
  //     address: proxyAddress, // Verify the proxy address
  //     // constructorArguments: [], // No constructor args for the implementation if deployed separately
  //     // If you didn't deploy implementation separately, you might need args here
  //   });
  //   console.log("Contract verified successfully!");
  // } catch (error) {
  //   console.error("Verification failed:", error);
  // }
}

// --- Execution ---
main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1; // Set exit code to indicate failure
});
