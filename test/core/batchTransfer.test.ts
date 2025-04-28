import { expect } from "../helpers/setup";
import { viem } from "hardhat";
import { parseEther } from "viem";
import type { PublicClient } from "viem";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("YKAToken - Batch Transfer Tests", function () {
  const initialSupply = parseEther("1000000");

  async function deployFixture() {
    const [deployer, ...users] = await viem.getWalletClients();

    // Deploy token
    const token = await viem.deployContract("YKAToken");

    // Initialize
    await token.write.initialize([initialSupply, deployer.account.address]);

    return {
      token,
      deployer,
      users,
      deployerAddress: deployer.account.address,
      userAddresses: users.map(u => u.account.address)
    };
  }

  describe("batchTransfer", function () {
    it("should transfer tokens to multiple recipients", async function () {
      const fixture = await loadFixture(deployFixture);
      const recipients = fixture.userAddresses.slice(0, 3);
      const amounts = [
        parseEther("100"),
        parseEther("200"),
        parseEther("300")
      ];

      await fixture.token.write.batchTransfer(
        [recipients, amounts, BigInt(recipients.length)],
        { account: fixture.deployer.account }
      );

      // Verify balances
      for (let i = 0; i < recipients.length; i++) {
        const balance = await fixture.token.read.balanceOf([recipients[i]]);
        expect(balance).to.equal(amounts[i]);
      }
    });

    it("should process large batches with checkpoints", async function () {
      const fixture = await loadFixture(deployFixture);
      const recipientCount = 10;
      const recipients = fixture.userAddresses.slice(0, recipientCount);
      const amounts = Array(recipientCount).fill(parseEther("100"));

      const client = await viem.getPublicClient() as PublicClient;
      const tx = await fixture.token.write.batchTransfer(
        [recipients, amounts, BigInt(recipientCount)],
        { account: fixture.deployer.account }
      );
      const receipt = await client.waitForTransactionReceipt({ hash: tx });
      expect(receipt.status).to.equal('success');

      // Verify all transfers completed
      for (const recipient of recipients) {
        const balance = await fixture.token.read.balanceOf([recipient]);
        expect(balance).to.equal(parseEther("100"));
      }
    });
  });

  describe("batchTransferFrom", function () {
    it("should transfer tokens from approved account", async function () {
      const fixture = await loadFixture(deployFixture);
      const spender = fixture.users[0];
      const recipients = fixture.userAddresses.slice(1, 4);
      const amounts = [
        parseEther("100"),
        parseEther("200"),
        parseEther("300")
      ];
      const totalAmount = amounts.reduce((a, b) => a + b);

      // Approve spender
      await fixture.token.write.approve(
        [spender.account.address, totalAmount],
        { account: fixture.deployer.account }
      );

      // Execute batch transfer
      await fixture.token.write.batchTransferFrom(
        [fixture.deployerAddress, recipients, amounts, BigInt(recipients.length)],
        { account: spender.account }
      );

      // Verify balances
      for (let i = 0; i < recipients.length; i++) {
        const balance = await fixture.token.read.balanceOf([recipients[i]]);
        expect(balance).to.equal(amounts[i]);
      }
    });

    it("should revert if allowance is insufficient", async function () {
      const fixture = await loadFixture(deployFixture);
      const spender = fixture.users[0];
      const recipients = fixture.userAddresses.slice(1, 4);
      const amounts = [
        parseEther("400"),
        parseEther("400"),
        parseEther("400")
      ];

      // Approve less than required
      await fixture.token.write.approve(
        [spender.account.address, parseEther("100")],
        { account: fixture.deployer.account }
      );

      await expect(
        fixture.token.write.batchTransferFrom(
          [fixture.deployerAddress, recipients, amounts, BigInt(recipients.length)],
          { account: spender.account }
        )
      ).to.be.rejectedWith("InsufficientAllowance");
    });

    it("should process large batches with checkpoints", async function () {
      const fixture = await loadFixture(deployFixture);
      const recipientCount = 10;
      const spender = fixture.users[0];
      const recipients = fixture.userAddresses.slice(1, recipientCount + 1);
      const amounts = Array(recipientCount).fill(parseEther("50"));
      const totalAmount = parseEther("500");

      // Approve sufficient tokens
      await fixture.token.write.approve(
        [spender.account.address, totalAmount],
        { account: fixture.deployer.account }
      );

      const client = await viem.getPublicClient() as PublicClient;
      const tx = await fixture.token.write.batchTransferFrom(
        [fixture.deployerAddress, recipients, amounts, BigInt(recipientCount)],
        { account: spender.account }
      );
      const receipt = await client.waitForTransactionReceipt({ hash: tx });
      expect(receipt.status).to.equal('success');

      // Verify all transfers completed
      for (const recipient of recipients) {
        const balance = await fixture.token.read.balanceOf([recipient]);
        expect(balance).to.equal(parseEther("50"));
      }
    });
  });
});
