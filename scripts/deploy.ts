import { ignition } from "hardhat";
import { formatEther, getAddress } from "viem";
import { Wallet } from "ethers";
import YKATokenModule from "../ignition/modules/YKAToken";

// Get deployer's address from PRIVATE_KEY
const getDeployerAddress = () => {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("PRIVATE_KEY environment variable is not set");
  }
  const formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
  const wallet = new Wallet(formattedPrivateKey);
  return wallet.address;
};

async function main() {
  // Get deployer's address for the owner
  const deployerAddress = getDeployerAddress();

  console.log(`Deploying YKAToken with:`);
  console.log(`  Initial Supply: 1000000 YKA`);
  console.log(`  Initial Owner: ${deployerAddress}`);
  console.log("----------------------------------------------------");

  // Deploy using Ignition
  const { token } = await ignition.deploy(YKATokenModule, {
    parameters: {
      YKATokenModule: {
        initialOwner: deployerAddress
      }
    }
  });

  console.log("----------------------------------------------------");
  console.log(`YKAToken deployed to: ${getAddress(token.address)}`);
  console.log("----------------------------------------------------");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
