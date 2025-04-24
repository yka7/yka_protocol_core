import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import hre from "hardhat";
import { ignition } from "hardhat";
import { expect } from "chai";
import { type PublicClient, type WalletClient, type Address } from "viem";
import { parseEther, formatEther, getAddress } from "viem";
import YKATokenModule from "../../ignition/modules/YKAToken";

interface TestContext {
  ykaToken: any;
  publicClient: PublicClient;
  owner: WalletClient;
  initialOwnerAddress: Address;
  initialSupply: bigint;
}

describe("YKAToken Core: Deployment", function () {
  async function deployFixture(): Promise<TestContext> {
    const [owner] = await hre.viem.getWalletClients();
    const initialOwnerAddress = getAddress(owner.account.address);
    const publicClient = await hre.viem.getPublicClient();
    const initialSupply = parseEther("1000000");

    const { token } = await ignition.deploy(YKATokenModule, {
      parameters: {
        YKATokenModule: {
          initialOwner: initialOwnerAddress,
          initialSupply: "1000000",
        }
      },
    });

    const ykaToken = await hre.viem.getContractAt("YKAToken", getAddress(token.address));

    return {
      ykaToken,
      publicClient,
      owner,
      initialOwnerAddress,
      initialSupply
    };
  }

  describe("Initialization", function () {
    it("Should deploy with correct initial state", async function () {
      const { ykaToken, initialOwnerAddress, initialSupply } = await loadFixture(deployFixture);

      expect(await ykaToken.read.owner()).to.equal(initialOwnerAddress);
      expect(await ykaToken.read.name()).to.equal("YKA Token");
      expect(await ykaToken.read.symbol()).to.equal("YKA");
      expect(await ykaToken.read.decimals()).to.equal(18);

      const ownerBalance = await ykaToken.read.balanceOf([initialOwnerAddress]);
      expect(ownerBalance).to.equal(initialSupply);

      console.log("\n      Deployment State:");
      console.log(`      - Token Name: ${await ykaToken.read.name()}`);
      console.log(`      - Token Symbol: ${await ykaToken.read.symbol()}`);
      console.log(`      - Decimals: ${await ykaToken.read.decimals()}`);
      console.log(`      - Total Supply: ${formatEther(initialSupply)} YKA`);
      console.log(`      - Owner Balance: ${formatEther(ownerBalance)} YKA`);
    });

    it("Should prevent initializing again", async function () {
      const { ykaToken, owner, initialSupply } = await loadFixture(deployFixture);

      await expect(
        ykaToken.write.initialize([initialSupply, owner.account!.address], { account: owner.account! })
      ).to.be.rejectedWith("Initializable: contract is already initialized");
    });
  });
});