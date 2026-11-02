import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "viem";

const YKATokenModule = buildModule("YKATokenModule", (m) => {
  // Get required parameters
  // initialOwner must be supplied at deploy time (scripts/deploy.ts derives it from PRIVATE_KEY)
  const owner = m.getParameter<string>("initialOwner");
  // initialSupply keeps a default so a deploy without it does not fail on a missing parameter
  const initialSupply = m.getParameter<bigint>("initialSupply", parseEther("1000000"));

  // Deploy the implementation contract
  const token = m.contract("YKAToken");

  // Initialize with validated parameters
  m.call(token, "initialize", [initialSupply, owner]);

  return { token };
});

export default YKATokenModule;
