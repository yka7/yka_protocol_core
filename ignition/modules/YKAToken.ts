import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "viem";
import { Wallet } from "ethers";

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

const DEFAULT_INITIAL_SUPPLY_STRING = process.env.INITIAL_SUPPLY || "1000000000000000000000000"; // 1 million tokens with 18 decimals

const YKATokenModule = buildModule("YKATokenModule", (m) => {
  // Get deployer's address
  const deployerAddress = getDeployerAddress();

  // Deploy the implementation contract
  const token = m.contract("YKAToken");

  // Initialize the contract with the initial supply and deployer as owner
  m.call(token, "initialize", [parseEther(DEFAULT_INITIAL_SUPPLY_STRING), deployerAddress]);

  // Return the contract instance
  return { token };
});

export default YKATokenModule;
