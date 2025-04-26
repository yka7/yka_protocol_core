import { expect } from "chai";
import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { createPublicClient, http, createWalletClient } from "viem";
import { hardhat } from "viem/chains";

// Import hardhat viem matchers
import "@nomicfoundation/hardhat-viem";
import "@nomicfoundation/hardhat-chai-matchers/internal/add-chai-matchers";

// Setup chai plugins
chai.use(chaiAsPromised);

// Create default viem clients
export const publicClient = createPublicClient({
  chain: hardhat,
  transport: http()
});

export { expect };