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

describe("YKAToken Transactions: Approval", function () {
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

  describe("Approval Operations", function () {
    it("Should handle approvals and transferFrom", async function () {
      const { ykaToken, publicClient, owner, otherAccount, initialSupply, initialOwnerAddress } = await loadFixture(deployFixture);
      const otherAccountAddress = getAddress(otherAccount.account!.address);
      const amountToApprove = parseEther("200");
      const amountToTransfer = parseEther("150");

      // 承認を実行
      const approveHash = await ykaToken.write.approve(
        [otherAccountAddress, amountToApprove],
        { account: owner.account! }
      );
      await publicClient.waitForTransactionReceipt({ hash: approveHash });

      // 承認額を確認
      const allowance = await ykaToken.read.allowance([initialOwnerAddress, otherAccountAddress]);
      expect(allowance).to.equal(amountToApprove);

      // transferFromを実行
      const transferFromHash = await ykaToken.write.transferFrom(
        [initialOwnerAddress, otherAccountAddress, amountToTransfer],
        { account: otherAccount.account! }
      );
      await publicClient.waitForTransactionReceipt({ hash: transferFromHash });

      // 残高を確認
      const ownerBalanceAfter = await ykaToken.read.balanceOf([initialOwnerAddress]);
      const otherAccountBalanceAfter = await ykaToken.read.balanceOf([otherAccountAddress]);

      expect(ownerBalanceAfter).to.equal(initialSupply - amountToTransfer);
      expect(otherAccountBalanceAfter).to.equal(amountToTransfer);

      // 残りの承認額を確認
      const remainingAllowance = await ykaToken.read.allowance([initialOwnerAddress, otherAccountAddress]);
      expect(remainingAllowance).to.equal(amountToApprove - amountToTransfer);
    });

    it("Should handle allowance limits correctly", async function () {
      const { ykaToken, owner, otherAccount } = await loadFixture(deployFixture);
      const maxUint256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
      const otherAccountAddress = getAddress(otherAccount.account!.address);

      await ykaToken.write.approve(
        [otherAccountAddress, maxUint256],
        { account: owner.account! }
      );

      const allowance = await ykaToken.read.allowance([owner.account!.address, otherAccountAddress]);
      expect(allowance).to.equal(maxUint256);
    });

    it("Should fail transferFrom if allowance is exceeded", async function () {
      const { ykaToken, owner, otherAccount, initialOwnerAddress } = await loadFixture(deployFixture);
      const otherAccountAddress = getAddress(otherAccount.account!.address);
      const amountToApprove = parseEther("100");

      // 承認を実行
      await ykaToken.write.approve(
        [otherAccountAddress, amountToApprove],
        { account: owner.account! }
      );

      // 承認額を超える転送を試みる
      const excessAmount = amountToApprove + parseEther("1");
      await expect(
        ykaToken.write.transferFrom(
          [initialOwnerAddress, otherAccountAddress, excessAmount],
          { account: otherAccount.account! }
        )
      ).to.be.rejectedWith(/ERC20InsufficientAllowance/);
    });
  });
});