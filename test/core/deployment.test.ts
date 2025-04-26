import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { viem, upgrades } from "hardhat";
import { expect } from "../helpers/setup";
import { parseEther, formatEther } from "viem";

describe("YKAToken Core: Deployment", function () {
  async function deployFixture() {
    const [deployer] = await viem.getWalletClients();
    const initialSupply = parseEther("1000000");

    // Deploy implementation
    const token = await viem.deployContract("YKAToken");

    // Initialize
    await token.write.initialize([initialSupply, deployer.account.address]);

    return {
      token,
      owner: deployer.account,
      initialSupply
    };
  }

  describe("Initialization", function () {
    it("Should deploy with correct initial state", async function () {
      const { token, owner, initialSupply } = await loadFixture(deployFixture);

      const ownerAddress = await token.read.owner();
      expect(ownerAddress.toLowerCase()).to.equal(owner.address.toLowerCase());
      expect(await token.read.name()).to.equal("YKA Token");
      expect(await token.read.symbol()).to.equal("YKA");
      expect(await token.read.decimals()).to.equal(18n);

      const ownerBalance = await token.read.balanceOf([owner.address]);
      expect(ownerBalance).to.equal(initialSupply);

      const name = await token.read.name();
      const symbol = await token.read.symbol();
      const decimals = await token.read.decimals();

      console.log("\n      Deployment State:");
      console.log(`      - Token Name: ${name}`);
      console.log(`      - Token Symbol: ${symbol}`);
      console.log(`      - Decimals: ${Number(decimals)}`);
      console.log(`      - Total Supply: ${formatEther(initialSupply)} YKA`);
      console.log(`      - Owner Balance: ${formatEther(ownerBalance)} YKA`);
    });

    it("Should prevent initializing again", async function () {
      const { token, owner, initialSupply } = await loadFixture(deployFixture);

      await expect(
        token.write.initialize([initialSupply, owner.address])
      ).to.be.rejectedWith("Initializable: contract is already initialized");
    });
  });
});