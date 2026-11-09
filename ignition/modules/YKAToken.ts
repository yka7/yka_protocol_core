import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "viem";

interface ModuleParameterRuntimeValue {
  moduleId: string;
  name: string;
  defaultValue: any;
  type: string;
}

const YKATokenModule = buildModule("YKATokenModule", (m) => {
  const initialOwner = process.env.INITIAL_OWNER;
  if (!initialOwner) {
    throw new Error("INITIAL_OWNER is required to deploy YKAToken (set it in .env or as a repository secret)");
  }

  // Get required parameters
  const owner = m.getParameter<string>("initialOwner", initialOwner);
  const initialSupplyParam = m.getParameter<string>("initialSupply", "1000000");

  // Deploy the implementation contract
  const token = m.contract("YKAToken");

  // Extract value from parameter
  const supplyValue = (initialSupplyParam as unknown as ModuleParameterRuntimeValue).defaultValue || "1000000";

  // Initialize with validated parameters
  m.call(token, "initialize", [
    parseEther(String(supplyValue)),
    owner
  ]);

  return { token };
});

export default YKATokenModule;
