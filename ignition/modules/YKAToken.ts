import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "viem";

const YKATokenModule = buildModule("YKATokenModule", (m) => {
  // Required parameter for initialOwner
  const owner = m.getParameter<string>("initialOwner");

  // Deploy the implementation contract
  const token = m.contract("YKAToken");

  // Initialize with 1 million tokens
  m.call(token, "initialize", [
    parseEther("1000000"),
    owner
  ]);

  return { token };
});

export default YKATokenModule;
