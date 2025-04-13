import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem"; // Includes chai-matchers, network-helpers, verify, etc.
import "@nomicfoundation/hardhat-ethers"; // Required by hardhat-upgrades
import "@openzeppelin/hardhat-upgrades"; // For deploying upgradeable contracts
import "@nomicfoundation/hardhat-ignition"; // For Ignition deployment framework
import dotenv from "dotenv"; // To load environment variables for keys/endpoints
import type { NetworkUserConfig } from "hardhat/types";

dotenv.config(); // Load environment variables from .env file

// Example environment variables (create a .env file in your project root)
// SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/YOUR_INFURA_API_KEY"
// PRIVATE_KEY="YOUR_PRIVATE_KEY_FOR_DEPLOYMENT"
// ETHERSCAN_API_KEY="YOUR_ETHERSCAN_API_KEY"

const sepoliaConfig: NetworkUserConfig = {
  url: process.env.SEPOLIA_RPC_URL || "", // Use Infura, Alchemy, etc.
  chainId: 11155111, // Sepolia chain ID
  accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
};

const mainnetConfig: NetworkUserConfig = {
    url: process.env.MAINNET_RPC_URL || "",
    chainId: 1,
    accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28", // Match the version in your contracts
    settings: {
      optimizer: {
        enabled: true,
        runs: 200, // Standard optimizer setting
      },
    },
  },
  networks: {
    hardhat: {
      // Default network for local testing
      // Chain ID 31337
    },
    localhost: {
      // For connecting to a node running locally (e.g., npx hardhat node)
      url: "http://127.0.0.1:8545/",
      // Accounts are usually managed by the local node
      // Chain ID might differ from hardhat network if using Ganache/Anvil
    },
    sepolia: sepoliaConfig, // Sepolia testnet configuration
    // mainnet: mainnetConfig, // Uncomment and configure for mainnet deployment
  },
  etherscan: {
    // Used by hardhat-verify plugin
    apiKey: {
        mainnet: process.env.ETHERSCAN_API_KEY || "",
        sepolia: process.env.ETHERSCAN_API_KEY || "", // Etherscan API key for verification
        // Add other networks if needed (e.g., polygon, arbitrum)
    }
  },
  gasReporter: { // Optional: analyze gas usage of tests
    enabled: process.env.REPORT_GAS !== undefined, // Enable via REPORT_GAS=true yarn test
    currency: "USD",
    // coinmarketcap: process.env.COINMARKETCAP_API_KEY, // Optional: for USD conversion
    // outputFile: "gas-report.txt", // Optional: save report to file
    // noColors: true, // Optional: disable colors in report
  },
  sourcify: { // Optional: Verification via Sourcify
    enabled: true
  }
};

export default config;
