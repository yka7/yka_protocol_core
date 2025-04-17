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
  otherAccount: WalletClient;
  initialOwnerAddress: Address;
  initialSupply: bigint;
}

describe("YKAToken Ownership", function () {
  async function deployFixture(): Promise<TestContext> {
    const [owner, otherAccount] = await hre.viem.getWalletClients();
    const initialOwnerAddress = getAddress(owner.account.address);
    const publicClient = await hre.viem.getPublicClient();
    const initialSupplyString = "1000000";
    const initialSupply = parseEther(initialSupplyString);

    const { token } = await ignition.deploy(YKATokenModule, {
      parameters: {
        YKATokenModule: {
          initialOwner: initialOwnerAddress,
          initialSupply: initialSupplyString,
        }
      },
    });

    const ykaToken = await hre.viem.getContractAt("YKAToken", getAddress(token.address));

    return {
      ykaToken,
      publicClient,
      owner,
      otherAccount,
      initialOwnerAddress,
      initialSupply
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
});