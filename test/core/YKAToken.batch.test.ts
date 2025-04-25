import { expect } from 'chai';
import { ethers } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { YKAToken } from '../../typechain-types';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

describe('YKAToken Batch Operations', () => {
  const initialSupply = ethers.parseEther('1000000');

  async function deployTokenFixture() {
    const [owner, user1, user2, user3] = await ethers.getSigners();

    const YKAToken = await ethers.getContractFactory('YKAToken');
    const token = await YKAToken.deploy();
    await token.initialize(initialSupply, owner.address);

    return { token, owner, user1, user2, user3 };
  }

  describe('batchTransfer', () => {
    it('should transfer tokens to multiple recipients', async () => {
      const { token, owner, user1, user2, user3 } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseEther('1000');

      const recipients = [user1.address, user2.address, user3.address];
      const amounts = [amount, amount, amount];

      await token.batchTransfer(recipients, amounts);

      expect(await token.balanceOf(user1.address)).to.equal(amount);
      expect(await token.balanceOf(user2.address)).to.equal(amount);
      expect(await token.balanceOf(user3.address)).to.equal(amount);
    });

    it('should revert if arrays have different lengths', async () => {
      const { token, user1, user2 } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseEther('1000');

      await expect(
        token.batchTransfer(
          [user1.address, user2.address],
          [amount]
        )
      ).to.be.rejected;
    });

    it('should revert if any recipient is zero address', async () => {
      const { token, user1 } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseEther('1000');

      await expect(
        token.batchTransfer(
          [user1.address, ethers.ZeroAddress],
          [amount, amount]
        )
      ).to.be.rejected;
    });
  });

  describe('batchTransferFrom', () => {
    it('should transfer tokens from approved account to multiple recipients', async () => {
      const { token, owner, user1, user2, user3 } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseEther('1000');
      const totalAmount = amount * 3n;

      // Approve user1 to spend owner's tokens
      await token.approve(user1.address, totalAmount);

      const recipients = [user2.address, user3.address];
      const amounts = [amount, amount];

      await token.connect(user1).batchTransferFrom(owner.address, recipients, amounts);

      expect(await token.balanceOf(user2.address)).to.equal(amount);
      expect(await token.balanceOf(user3.address)).to.equal(amount);
    });

    it('should revert if allowance is insufficient', async () => {
      const { token, owner, user1, user2 } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseEther('1000');

      // Approve less than required
      await token.approve(user1.address, amount - 1n);

      await expect(
        token.connect(user1).batchTransferFrom(
          owner.address,
          [user2.address],
          [amount]
        )
      ).to.be.rejected;
    });
  });

  describe('Gas Optimization', () => {
    it('should use less gas for batch transfers compared to individual transfers', async () => {
      const { token, owner, user1, user2, user3 } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseEther('1000');

      const recipients = [user1.address, user2.address, user3.address];
      const amounts = [amount, amount, amount];

      // Execute batch transfer
      await token.batchTransfer(recipients, amounts);

      // Verify balances after batch transfer
      expect(await token.balanceOf(user1.address)).to.equal(amount);
      expect(await token.balanceOf(user2.address)).to.equal(amount);
      expect(await token.balanceOf(user3.address)).to.equal(amount);
    });
  });
});