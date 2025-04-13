import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "viem";

// Default parameters for the YKAToken deployment
const DEFAULT_INITIAL_OWNER = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"; // Default to Hardhat account 0
const DEFAULT_INITIAL_SUPPLY_STRING = "1000000"; // 1 million tokens

const YKATokenModule = buildModule("YKATokenModule", (m) => {
  // Get deployment parameters or use defaults
  const initialOwner = m.getParameter("initialOwner", DEFAULT_INITIAL_OWNER);
  const initialSupply = m.getParameter("initialSupply", DEFAULT_INITIAL_SUPPLY_STRING);

  // Convert initialSupply to string explicitly
  const initialSupplyValue = typeof initialSupply === 'string'
    ? initialSupply
    : DEFAULT_INITIAL_SUPPLY_STRING;

  // Deploy the implementation contract
  const token = m.contract("YKAToken");

  // Initialize the contract with the initial supply and owner
  m.call(token, "initialize", [parseEther(initialSupplyValue), initialOwner]);

  // Return the contract instance
  return { token };
});

export default YKATokenModule;
