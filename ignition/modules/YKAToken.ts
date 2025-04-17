import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "viem";

const YKATokenModule = buildModule("YKATokenModule", (m) => {
  // Required parameter for initialOwner
  const owner = m.getParameter<string>("initialOwner");

  // Deploy the implementation contract
  const token = m.contract("YKAToken");

  // Initialize with same supply as test fixture (1 million tokens)
  m.call(token, "initialize", [
    parseEther("1000000"), // 1 million tokens (matching test fixture)
    owner
  ]);

  return { token };
});

export default YKATokenModule;
