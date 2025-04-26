import { expect } from "../helpers/setup";
import { ethers, upgrades } from "hardhat";
import { YKAToken } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("YKAToken Transactions: Transfer", function () {
  let token: YKAToken;
  let owner: SignerWithAddress;
  let otherAccount: SignerWithAddress;
  const initialSupply = ethers.parseEther("1000000");

  beforeEach(async function () {
    [owner, otherAccount] = await ethers.getSigners();

    const YKATokenFactory = await ethers.getContractFactory("YKAToken");
    token = await upgrades.deployProxy(YKATokenFactory, [
      initialSupply,
      owner.address
    ]) as YKAToken;
    await token.waitForDeployment();
  });

  describe("Basic Transfer", function () {
    it("Should transfer tokens between accounts", async function () {
      const amount = ethers.parseEther("100");

      await expect(token.transfer(otherAccount.address, amount))
        .to.emit(token, "Transfer")
        .withArgs(owner.address, otherAccount.address, amount);

      expect(await token.balanceOf(otherAccount.address)).to.equal(amount);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const ownerBalance = await token.balanceOf(owner.address);
      const amountToSend = ownerBalance + ethers.parseEther("1");

      await expect(
        token.transfer(otherAccount.address, amountToSend)
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientBalance");
    });

    it("Should prevent transfers to zero address", async function () {
      const amount = ethers.parseEther("10");

      await expect(
        token.transfer(ethers.ZeroAddress, amount)
      ).to.be.revertedWithCustomError(token, "ZeroAddress");
    });
  });

  describe("Batch Transfers", function () {
    it("Should handle multiple transfers in a loop", async function () {
      const recipients = Array(3).fill(otherAccount.address);
      const amounts = Array(3).fill(ethers.parseEther("10"));
      const totalTransferred = amounts.reduce((a, b) => a + b, BigInt(0));

      for (let i = 0; i < recipients.length; i++) {
        await expect(token.transfer(recipients[i], amounts[i]))
          .to.emit(token, "Transfer")
          .withArgs(owner.address, recipients[i], amounts[i]);
      }

      expect(await token.balanceOf(owner.address)).to.equal(initialSupply - totalTransferred);
      expect(await token.balanceOf(otherAccount.address)).to.equal(totalTransferred);
    });
  });
});