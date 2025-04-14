import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "viem";

/**
 * YKAToken deployment module
 * Deploys the YKAToken contract and initializes it with the provided parameters
 */
const YKATokenModule = buildModule("YKATokenModule", (m) => {
  // Deploy the implementation contract first
  const token = m.contract("YKAToken");

  // Add initialization parameters as a second step
  m.call(token, "initialize", [
    // Convert initial supply to wei (1 million tokens)
    parseEther("1000000"),
    // Use the provided owner address from deployment parameters
    m.getParameter<string>("initialOwner")
  ]);

  return { token };
});

export default YKATokenModule;
