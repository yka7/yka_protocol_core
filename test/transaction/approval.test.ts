import { expect } from "../helpers/setup";
import { ethers, upgrades } from "hardhat";
import { YKAToken } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("YKAToken Transactions: Approval", function () {
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

  describe("Approval Operations", function () {
    it("Should handle approvals and transferFrom", async function () {
      const amountToApprove = ethers.parseEther("200");
      const amountToTransfer = ethers.parseEther("150");

      // 承認を実行
      await expect(token.approve(otherAccount.address, amountToApprove))
        .to.emit(token, "Approval")
        .withArgs(owner.address, otherAccount.address, amountToApprove);

      // 承認額を確認
      const allowance = await token.allowance(owner.address, otherAccount.address);
      expect(allowance).to.equal(amountToApprove);

      // transferFromを実行
      await expect(token.connect(otherAccount).transferFrom(owner.address, otherAccount.address, amountToTransfer))
        .to.emit(token, "Transfer")
        .withArgs(owner.address, otherAccount.address, amountToTransfer);

      // 残高を確認
      expect(await token.balanceOf(otherAccount.address)).to.equal(amountToTransfer);
      expect(await token.balanceOf(owner.address)).to.equal(initialSupply - amountToTransfer);

      // 残りの承認額を確認
      expect(await token.allowance(owner.address, otherAccount.address)).to.equal(amountToApprove - amountToTransfer);
    });

    it("Should handle allowance limits correctly", async function () {
      const maxUint256 = ethers.MaxUint256;

      await token.approve(otherAccount.address, maxUint256);
      expect(await token.allowance(owner.address, otherAccount.address)).to.equal(maxUint256);
    });

    it("Should fail transferFrom if allowance is exceeded", async function () {
      const amountToApprove = ethers.parseEther("100");

      // 承認を実行
      await token.approve(otherAccount.address, amountToApprove);

      // 承認額を超える転送を試みる
      const excessAmount = amountToApprove + ethers.parseEther("1");

      await expect(
        token.connect(otherAccount).transferFrom(owner.address, otherAccount.address, excessAmount)
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientAllowance");
    });
  });
});