import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { YKAToken } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Economic Simulation Tests", function () {
  let token: YKAToken;
  let owner: SignerWithAddress;
  let traders: SignerWithAddress[];
  const initialSupply = ethers.parseEther("1000000");

  beforeEach(async function () {
    [owner, ...traders] = await ethers.getSigners();

    const YKAToken = await ethers.getContractFactory("YKAToken");
    token = await upgrades.deployProxy(YKAToken, [
      initialSupply,
      owner.address
    ]) as YKAToken;
    await token.waitForDeployment();
  });

  describe("Token Distribution", function () {
    it("Should distribute tokens to multiple traders", async function () {
      const distributionAmount = ethers.parseEther("10");
      const traderCount = 3;

      // Distribute tokens to traders
      for (let i = 0; i < traderCount; i++) {
        await expect(token.transfer(traders[i].address, distributionAmount))
          .to.emit(token, "Transfer")
          .withArgs(owner.address, traders[i].address, distributionAmount);
      }

      // Verify balances
      const ownerExpectedBalance = initialSupply - (distributionAmount * BigInt(traderCount));
      expect(await token.balanceOf(owner.address)).to.equal(ownerExpectedBalance);

      for (let i = 0; i < traderCount; i++) {
        expect(await token.balanceOf(traders[i].address))
          .to.equal(distributionAmount);
      }
    });

    it("Should simulate trading between traders", async function () {
      // Initial distribution
      const initialAmount = ethers.parseEther("20");
      const transferAmount = ethers.parseEther("5");

      // Distribute to first trader
      await token.transfer(traders[0].address, initialAmount);

      // Transfer between traders
      await expect(token.connect(traders[0]).transfer(traders[1].address, transferAmount))
        .to.emit(token, "Transfer")
        .withArgs(traders[0].address, traders[1].address, transferAmount);

      // Verify balances
      expect(await token.balanceOf(traders[0].address))
        .to.equal(initialAmount - transferAmount);
      expect(await token.balanceOf(traders[1].address))
        .to.equal(transferAmount);
    });
  });

  describe("Market Simulation", function () {
    it("Should handle multiple concurrent approvals and transfers", async function () {
      const initialAmount = ethers.parseEther("50");
      const transferAmount = ethers.parseEther("20");

      // Initial setup
      await token.transfer(traders[0].address, initialAmount);

      // Set approvals
      await token.connect(traders[0]).approve(traders[1].address, transferAmount);
      await token.connect(traders[0]).approve(traders[2].address, transferAmount);

      // Execute transfers
      await expect(token.connect(traders[1])
        .transferFrom(traders[0].address, traders[1].address, transferAmount))
        .to.emit(token, "Transfer")
        .withArgs(traders[0].address, traders[1].address, transferAmount);

      await expect(token.connect(traders[2])
        .transferFrom(traders[0].address, traders[2].address, transferAmount))
        .to.emit(token, "Transfer")
        .withArgs(traders[0].address, traders[2].address, transferAmount);

      // Verify final balances
      expect(await token.balanceOf(traders[0].address))
        .to.equal(initialAmount - transferAmount * BigInt(2));
      expect(await token.balanceOf(traders[1].address))
        .to.equal(transferAmount);
      expect(await token.balanceOf(traders[2].address))
        .to.equal(transferAmount);
    });

    it("Should fail on insufficient balance", async function () {
      const initialAmount = ethers.parseEther("10");
      const transferAmount = ethers.parseEther("20");

      // Initial setup
      await token.transfer(traders[0].address, initialAmount);

      // Attempt transfer with insufficient balance
      await expect(token.connect(traders[0])
        .transfer(traders[1].address, transferAmount))
        .to.be.revertedWith("ERC20: transfer amount exceeds balance");

      // Verify balances remain unchanged
      expect(await token.balanceOf(traders[0].address))
        .to.equal(initialAmount);
      expect(await token.balanceOf(traders[1].address))
        .to.equal(0);
    });

    it("Should fail on insufficient allowance", async function () {
      const initialAmount = ethers.parseEther("50");
      const approvalAmount = ethers.parseEther("10");
      const transferAmount = ethers.parseEther("20");

      // Initial setup
      await token.transfer(traders[0].address, initialAmount);
      await token.connect(traders[0]).approve(traders[1].address, approvalAmount);

      // Attempt transfer with insufficient allowance
      await expect(token.connect(traders[1])
        .transferFrom(traders[0].address, traders[1].address, transferAmount))
        .to.be.revertedWithCustomError(token, "ERC20InsufficientAllowance");

      // Verify balances and allowance remain unchanged
      expect(await token.balanceOf(traders[0].address))
        .to.equal(initialAmount);
      expect(await token.balanceOf(traders[1].address))
        .to.equal(0);
      expect(await token.allowance(traders[0].address, traders[1].address))
        .to.equal(approvalAmount);
    });
  });
});