import { expect } from "../helpers/setup";
import { ethers, upgrades } from "hardhat";
import { YKAToken } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("YKAToken Approval Mechanism", function () {
  let token: YKAToken;
  let owner: SignerWithAddress;
  let spender: SignerWithAddress;
  let recipient: SignerWithAddress;
  const initialSupply = ethers.parseEther("1000000");

  beforeEach(async function () {
    [owner, spender, recipient] = await ethers.getSigners();

    const YKATokenFactory = await ethers.getContractFactory("YKAToken");
    token = await upgrades.deployProxy(YKATokenFactory, [
      initialSupply,
      owner.address
    ]) as YKAToken;
    await token.waitForDeployment();
  });

  describe("Basic Approval", function () {
    it("Should approve spending and verify allowance", async function () {
      // Set approval amount (10% of balance)
      const ownerBalance = await token.balanceOf(owner.address);
      const approvalAmount = ownerBalance * BigInt(10) / BigInt(100);

      // Execute approval
      await expect(token.approve(spender.address, approvalAmount))
        .to.emit(token, "Approval")
        .withArgs(owner.address, spender.address, approvalAmount);

      // Verify allowance
      const allowance = await token.allowance(owner.address, spender.address);
      expect(allowance).to.equal(approvalAmount);
    });

    it("Should allow approved spender to transfer tokens", async function () {
      // Set approval for 10% of balance
      const ownerBalance = await token.balanceOf(owner.address);
      const approvalAmount = ownerBalance * BigInt(10) / BigInt(100);

      // Execute approval
      await token.approve(spender.address, approvalAmount);

      // Transfer half of approved amount
      const transferAmount = approvalAmount / BigInt(2);
      await expect(token.connect(spender).transferFrom(owner.address, recipient.address, transferAmount))
        .to.emit(token, "Transfer")
        .withArgs(owner.address, recipient.address, transferAmount);

      // Verify final states
      const remainingAllowance = await token.allowance(owner.address, spender.address);
      const recipientBalance = await token.balanceOf(recipient.address);
      const finalOwnerBalance = await token.balanceOf(owner.address);

      expect(remainingAllowance).to.equal(approvalAmount - transferAmount);
      expect(recipientBalance).to.equal(transferAmount);
      expect(finalOwnerBalance).to.equal(ownerBalance - transferAmount);
    });

    it("Should prevent transferring more than approved amount", async function () {
      // Approve 10% of balance
      const ownerBalance = await token.balanceOf(owner.address);
      const approvalAmount = ownerBalance * BigInt(10) / BigInt(100);

      // Execute approval
      await token.approve(spender.address, approvalAmount);

      // Try to transfer more than approved amount
      const excessAmount = approvalAmount * BigInt(2);

      // Verify transaction is rejected
      await expect(
        token.connect(spender).transferFrom(owner.address, recipient.address, excessAmount)
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientAllowance");
    });
  });
});
