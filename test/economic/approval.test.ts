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

describe("YKAToken Approval Mechanism", function () {
  async function deployFixture(): Promise<TestContext> {
    const [owner] = await hre.viem.getWalletClients();
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
      initialOwnerAddress,
      initialSupply
    };
  }

  describe("Basic Approval", function () {
    it("Should approve spending and verify allowance", async function () {
      const { ykaToken, publicClient, owner } = await loadFixture(deployFixture);
      const [_, spender] = await hre.viem.getWalletClients();
      const spenderAddress = getAddress(spender.account!.address);

      // Set approval amount (10% of balance)
      const ownerBalance = await ykaToken.read.balanceOf([owner.account!.address]);
      const approvalAmount = ownerBalance * BigInt(10) / BigInt(100);

      console.log("\n      Approval Test:");
      console.log(`      - Owner balance: ${formatEther(ownerBalance)} YKA`);
      console.log(`      - Approval amount: ${formatEther(approvalAmount)} YKA (10%)`);

      // Execute approval
      const hash = await ykaToken.write.approve(
        [spenderAddress, approvalAmount],
        { account: owner.account! }
      );
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      expect(receipt.status).to.equal("success");

      // Verify allowance
      const allowance = await ykaToken.read.allowance([owner.account!.address, spenderAddress]);
      expect(allowance).to.equal(approvalAmount);

      console.log("\n      Results:");
      console.log(`      - Spender allowance: ${formatEther(allowance)} YKA`);
    });

    it("Should allow approved spender to transfer tokens", async function () {
      const { ykaToken, publicClient, owner } = await loadFixture(deployFixture);
      const [_, spender, recipient] = await hre.viem.getWalletClients();
      const spenderAddress = getAddress(spender.account!.address);
      const recipientAddress = getAddress(recipient.account!.address);

      // Set approval for 10% of balance
      const ownerBalance = await ykaToken.read.balanceOf([owner.account!.address]);
      const approvalAmount = ownerBalance * BigInt(10) / BigInt(100);

      console.log("\n      TransferFrom Test Setup:");
      console.log(`      - Owner balance: ${formatEther(ownerBalance)} YKA`);
      console.log(`      - Approval amount: ${formatEther(approvalAmount)} YKA (10%)`);

      // Execute approval
      const approveHash = await ykaToken.write.approve(
        [spenderAddress, approvalAmount],
        { account: owner.account! }
      );
      await publicClient.waitForTransactionReceipt({ hash: approveHash });

      // Transfer half of approved amount
      const transferAmount = approvalAmount / BigInt(2);
      console.log(`      - Transfer amount: ${formatEther(transferAmount)} YKA (5%)`);

      const transferHash = await ykaToken.write.transferFrom(
        [owner.account!.address, recipientAddress, transferAmount],
        { account: spender.account! }
      );
      const receipt = await publicClient.waitForTransactionReceipt({ hash: transferHash });
      expect(receipt.status).to.equal("success");

      // Verify final states
      const remainingAllowance = await ykaToken.read.allowance([owner.account!.address, spenderAddress]);
      const recipientBalance = await ykaToken.read.balanceOf([recipientAddress]);
      const finalOwnerBalance = await ykaToken.read.balanceOf([owner.account!.address]);

      expect(remainingAllowance).to.equal(approvalAmount - transferAmount);
      expect(recipientBalance).to.equal(transferAmount);
      expect(finalOwnerBalance).to.equal(ownerBalance - transferAmount);

      console.log("\n      Results:");
      console.log(`      - Remaining allowance: ${formatEther(remainingAllowance)} YKA`);
      console.log(`      - Recipient balance: ${formatEther(recipientBalance)} YKA`);
      console.log(`      - Final owner balance: ${formatEther(finalOwnerBalance)} YKA`);
    });

    it("Should prevent transferring more than approved amount", async function () {
      const { ykaToken, publicClient, owner } = await loadFixture(deployFixture);
      const [_, spender, recipient] = await hre.viem.getWalletClients();
      const spenderAddress = getAddress(spender.account!.address);
      const recipientAddress = getAddress(recipient.account!.address);

      // Approve 10% of balance
      const ownerBalance = await ykaToken.read.balanceOf([owner.account!.address]);
      const approvalAmount = ownerBalance * BigInt(10) / BigInt(100);

      console.log("\n      Overflow Test Setup:");
      console.log(`      - Owner balance: ${formatEther(ownerBalance)} YKA`);
      console.log(`      - Approval amount: ${formatEther(approvalAmount)} YKA (10%)`);

      // Execute approval
      const approveHash = await ykaToken.write.approve(
        [spenderAddress, approvalAmount],
        { account: owner.account! }
      );
      await publicClient.waitForTransactionReceipt({ hash: approveHash });

      // Try to transfer more than approved amount
      const excessAmount = approvalAmount * BigInt(2); // 20% (exceeds approval)
      console.log(`      - Attempting transfer: ${formatEther(excessAmount)} YKA (20%)`);

      // Verify transaction is rejected
      await expect(
        ykaToken.write.transferFrom(
          [owner.account!.address, recipientAddress, excessAmount],
          { account: spender.account! }
        )
      ).to.be.rejectedWith(/ERC20InsufficientAllowance/);

      // Verify balances remain unchanged
      const allowance = await ykaToken.read.allowance([owner.account!.address, spenderAddress]);
      const recipientBalance = await ykaToken.read.balanceOf([recipientAddress]);

      expect(allowance).to.equal(approvalAmount);
      expect(recipientBalance).to.equal(BigInt(0));

      console.log("\n      Results:");
      console.log(`      - Transfer rejected as expected`);
      console.log(`      - Allowance unchanged: ${formatEther(allowance)} YKA`);
      console.log(`      - Recipient balance: ${formatEther(recipientBalance)} YKA`);
    });
  });
});
