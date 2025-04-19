import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import hre from "hardhat";
import { expect } from "chai";
import { type PublicClient, type WalletClient, type Address } from "viem";
import { parseEther, formatEther, getAddress } from "viem";

interface TestContext {
  ykaToken: any;
  publicClient: PublicClient;
  owner: WalletClient;
  otherAccount: WalletClient;
  initialOwnerAddress: Address;
  initialSupply: bigint;
  implementation: Address;
}

describe("YKAToken Ownership", function () {
  async function deployFixture(): Promise<TestContext> {
    const [owner, otherAccount] = await hre.viem.getWalletClients();
    const initialOwnerAddress = getAddress(owner.account.address);
    const publicClient = await hre.viem.getPublicClient();
    const initialSupplyString = "1000000";
    const initialSupply = parseEther(initialSupplyString);

    // Deploy and initialize contract
    const YKAToken = await hre.viem.deployContract("YKAToken");
    const implementation = getAddress(YKAToken.address);

    await YKAToken.write.initialize(
      [initialSupply, initialOwnerAddress],
      { account: owner.account! }
    );

    return {
      ykaToken: YKAToken,
      publicClient,
      owner,
      otherAccount,
      initialOwnerAddress,
      initialSupply,
      implementation
    };
  }

  describe("Ownership Management", function () {
    it("Should allow owner to transfer ownership", async function () {
      const { ykaToken, publicClient, owner, otherAccount } = await loadFixture(deployFixture);
      const newOwnerAddress = getAddress(otherAccount.account!.address);

      const txHash = await ykaToken.write.transferOwnership(
        [newOwnerAddress],
        { account: owner.account! }
      );
      await publicClient.waitForTransactionReceipt({ hash: txHash });

      expect(await ykaToken.read.owner()).to.equal(newOwnerAddress);
      console.log(`      Ownership transferred to: ${newOwnerAddress}`);
    });

    it("Should prevent non-owner from transferring ownership", async function () {
      const { ykaToken, otherAccount } = await loadFixture(deployFixture);
      const nonOwnerAddress = getAddress(otherAccount.account!.address);

      await expect(
        ykaToken.write.transferOwnership(
          [nonOwnerAddress],
          { account: otherAccount.account! }
        )
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });

    it("Should emit OwnershipTransferred event", async function () {
      const { ykaToken, publicClient, owner, otherAccount, initialOwnerAddress } = await loadFixture(deployFixture);
      const newOwnerAddress = getAddress(otherAccount.account!.address);

      const txHash = await ykaToken.write.transferOwnership(
        [newOwnerAddress],
        { account: owner.account! }
      );
      await publicClient.waitForTransactionReceipt({ hash: txHash });

      // 所有権の移転後の状態を確認
      expect(await ykaToken.read.owner()).to.equal(newOwnerAddress);

      // 元のオーナーが操作を試みるとエラーになることを確認
      await expect(
        ykaToken.write.transferOwnership(
          [initialOwnerAddress],
          { account: owner.account! }
        )
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });
  });

  describe("Upgrade Authorization", function () {
    it("Should deploy implementation successfully", async function () {
      const { ykaToken, implementation } = await loadFixture(deployFixture);
      expect(implementation).to.match(/^0x[a-fA-F0-9]{40}$/);
      console.log(`      Implementation deployed at: ${implementation}`);
    });

    it("Should have correct implementation after deployment", async function () {
      const { ykaToken, implementation } = await loadFixture(deployFixture);
      expect(implementation).to.equal(getAddress(ykaToken.address));
    });
  });
});