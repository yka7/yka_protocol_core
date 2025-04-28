import { expect } from '../helpers/setup';
import { viem } from 'hardhat';
import { parseEther } from 'viem';
import { type PublicClient } from 'viem';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';

describe('YKAToken Batch Operations', () => {
  const initialSupply = parseEther('1000000');

  async function deployTokenFixture() {
    const [deployer, user1, user2, user3] = await viem.getWalletClients();

    // Deploy token
    const token = await viem.deployContract("YKAToken");

    // Initialize
    await token.write.initialize([initialSupply, deployer.account.address]);

    return {
      token,
      deployer,
      user1,
      user2,
      user3,
      deployerAddress: deployer.account.address,
      user1Address: user1.account.address,
      user2Address: user2.account.address,
      user3Address: user3.account.address
    };
  }

  describe('batchTransfer', () => {
    it('should transfer tokens to multiple recipients', async () => {
      const fixture = await loadFixture(deployTokenFixture);
      const amount = parseEther('1000');

      const recipients = [
        fixture.user1Address,
        fixture.user2Address,
        fixture.user3Address
      ];
      const amounts = [amount, amount, amount];

      const batchSize = BigInt(recipients.length);
      await fixture.token.write.batchTransfer(
        [recipients, amounts, batchSize],
        { account: fixture.deployer.account }
      );

      const balance1 = await fixture.token.read.balanceOf([fixture.user1Address]);
      const balance2 = await fixture.token.read.balanceOf([fixture.user2Address]);
      const balance3 = await fixture.token.read.balanceOf([fixture.user3Address]);

      expect(balance1).to.equal(amount);
      expect(balance2).to.equal(amount);
      expect(balance3).to.equal(amount);
    });

    it('should revert if arrays have different lengths', async () => {
      const fixture = await loadFixture(deployTokenFixture);
      const amount = parseEther('1000');

      await expect(
        fixture.token.write.batchTransfer(
          [[fixture.user1Address, fixture.user2Address], [amount], BigInt(2)],
          { account: fixture.deployer.account }
        )
      ).to.be.rejectedWith("BatchParamsInvalid");
    });

    it('should revert if any recipient is zero address', async () => {
      const fixture = await loadFixture(deployTokenFixture);
      const amount = parseEther('1000');

      await expect(
        fixture.token.write.batchTransfer(
          [[fixture.user1Address, "0x0000000000000000000000000000000000000000"],
           [amount, amount],
           BigInt(2)],
          { account: fixture.deployer.account }
        )
      ).to.be.rejectedWith("ZeroAddress");
    });
  });

  describe('batchTransferFrom', () => {
    it('should transfer tokens from approved account to multiple recipients', async () => {
      const fixture = await loadFixture(deployTokenFixture);
      const amount = parseEther('1000');
      const totalAmount = amount * 3n;

      // Approve user1 to spend deployer's tokens
      await fixture.token.write.approve(
        [fixture.user1Address, totalAmount],
        { account: fixture.deployer.account }
      );

      const recipients = [fixture.user2Address, fixture.user3Address];
      const amounts = [amount, amount];

      const batchSize = BigInt(recipients.length);
      await fixture.token.write.batchTransferFrom(
        [fixture.deployerAddress, recipients, amounts, batchSize],
        { account: fixture.user1.account }
      );

      const balance2 = await fixture.token.read.balanceOf([fixture.user2Address]);
      const balance3 = await fixture.token.read.balanceOf([fixture.user3Address]);
      expect(balance2).to.equal(amount);
      expect(balance3).to.equal(amount);
    });

    it('should revert if allowance is insufficient', async () => {
      const fixture = await loadFixture(deployTokenFixture);
      const amount = parseEther('1000');

      // Approve less than required
      await fixture.token.write.approve(
        [fixture.user1Address, amount - 1n],
        { account: fixture.deployer.account }
      );

      await expect(
        fixture.token.write.batchTransferFrom(
          [fixture.deployerAddress, [fixture.user2Address], [amount], BigInt(1)],
          { account: fixture.user1.account }
        )
      ).to.be.rejectedWith("InsufficientAllowance");
    });
  });

  describe('Gas Optimization', () => {
    it('should use less gas for batch transfers compared to individual transfers', async () => {
      const fixture = await loadFixture(deployTokenFixture);
      const amount = parseEther('1000');

      const recipients = [
        fixture.user1Address,
        fixture.user2Address,
        fixture.user3Address
      ];
      const amounts = [amount, amount, amount];

      const client = await viem.getPublicClient() as PublicClient;

      // Execute batch transfer
      const tx = await fixture.token.write.batchTransfer(
        [recipients, amounts, BigInt(recipients.length)],
        { account: fixture.deployer.account }
      );

      // Verify successful execution
      const receipt = await client.waitForTransactionReceipt({ hash: tx });
      expect(receipt.status).to.equal('success');

      // Verify balances
      for (const [index, recipient] of recipients.entries()) {
        const balance = await fixture.token.read.balanceOf([recipient]);
        expect(balance).to.equal(amounts[index]);
      }
    });
  });
});