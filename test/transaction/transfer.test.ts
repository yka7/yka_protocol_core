import { expect } from "../helpers/setup";
import { viem } from 'hardhat';
import { parseEther } from 'viem';
import type { PublicClient } from 'viem';
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("YKAToken Transactions: Transfer", function () {
  const initialSupply = parseEther("1000000");

  async function deployFixture() {
    const [deployer, otherAccount] = await viem.getWalletClients();

    // Deploy token
    const token = await viem.deployContract("YKAToken");

    // Initialize
    await token.write.initialize([initialSupply, deployer.account.address]);

    return {
      token,
      deployer,
      otherAccount,
      deployerAddress: deployer.account.address,
      otherAddress: otherAccount.account.address
    };
  }

  describe("Basic Transfer", function () {
    it("Should transfer tokens between accounts", async function () {
      const fixture = await loadFixture(deployFixture);
      const amount = parseEther("100");

      await fixture.token.write.transfer(
        [fixture.otherAddress, amount],
        { account: fixture.deployer.account }
      );

      const balance = await fixture.token.read.balanceOf([fixture.otherAddress]);
      expect(balance).to.equal(amount);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const fixture = await loadFixture(deployFixture);
      const balance = await fixture.token.read.balanceOf([fixture.deployerAddress]);
      const amountToSend = balance + parseEther("1");

      await expect(
        fixture.token.write.transfer(
          [fixture.otherAddress, amountToSend],
          { account: fixture.deployer.account }
        )
      ).to.be.rejectedWith("ERC20InsufficientBalance");
    });

    it("Should prevent transfers to zero address", async function () {
      const fixture = await loadFixture(deployFixture);
      const amount = parseEther("10");

      await expect(
        fixture.token.write.transfer(
          ["0x0000000000000000000000000000000000000000", amount],
          { account: fixture.deployer.account }
        )
      ).to.be.rejectedWith("ZeroAddress");
    });
  });

  describe("Batch Transfer", function () {
    it("Should handle batch transfers with dynamic batch size", async function () {
      const fixture = await loadFixture(deployFixture);
      const recipients = Array(10).fill(fixture.otherAddress);
      const amounts = Array(10).fill(parseEther("10"));
      const totalTransferred = amounts.reduce((a, b) => a + b, BigInt(0));
      const batchSize = BigInt(3);

      const tx = await fixture.token.write.batchTransfer(
        [recipients, amounts, batchSize],
        { account: fixture.deployer.account }
      );

      const client = await viem.getPublicClient() as PublicClient;
      const receipt = await client.waitForTransactionReceipt({ hash: tx });
      expect(receipt.status).to.equal('success');

      const ownerBalance = await fixture.token.read.balanceOf([fixture.deployerAddress]);
      const otherBalance = await fixture.token.read.balanceOf([fixture.otherAddress]);

      expect(ownerBalance).to.equal(initialSupply - totalTransferred);
      expect(otherBalance).to.equal(totalTransferred);
    });

    it("Should fail with zero batch size", async function () {
      const fixture = await loadFixture(deployFixture);
      const recipients = Array(3).fill(fixture.otherAddress);
      const amounts = Array(3).fill(parseEther("10"));
      const batchSize = BigInt(0);

      await expect(
        fixture.token.write.batchTransfer(
          [recipients, amounts, batchSize],
          { account: fixture.deployer.account }
        )
      ).to.be.rejectedWith("BatchParamsInvalid");
    });
  });
});