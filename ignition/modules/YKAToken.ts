import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "viem";

interface ModuleParameterRuntimeValue {
  moduleId: string;
  name: string;
  defaultValue: any;
  type: string;
}

const YKATokenModule = buildModule("YKATokenModule", (m) => {
  // Get required parameters
  const owner = m.getParameter<string>("initialOwner");
  const initialSupplyParam = m.getParameter<string>("initialSupply");

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
