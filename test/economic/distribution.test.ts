import { expect } from "../helpers/setup";
import { ethers, upgrades } from "hardhat";
import { YKAToken } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("YKAToken Distribution", function () {
  let token: YKAToken;
  let owner: SignerWithAddress;
  let traders: SignerWithAddress[];
  const initialSupply = ethers.parseEther("1000000");

  beforeEach(async function () {
    [owner, ...traders] = await ethers.getSigners();

    const YKATokenFactory = await ethers.getContractFactory("YKAToken");
    token = await upgrades.deployProxy(YKATokenFactory, [
      initialSupply,
      owner.address
    ]) as YKAToken;
    await token.waitForDeployment();
  });

  describe("Initial Distribution", function () {
    it("Should transfer 1% of total supply to trader", async function () {
      const trader = traders[0];
      const ownerBalance = await token.balanceOf(owner.address);
      const transferAmount = ownerBalance * BigInt(1) / BigInt(100);

      await expect(token.transfer(trader.address, transferAmount))
        .to.emit(token, "Transfer")
        .withArgs(owner.address, trader.address, transferAmount);

      expect(await token.balanceOf(trader.address)).to.equal(transferAmount);
      expect(await token.balanceOf(owner.address)).to.equal(ownerBalance - transferAmount);
    });

    it("Should distribute tokens to multiple traders", async function () {
      const transferAmount = initialSupply * BigInt(1) / BigInt(100);
      const totalAmount = transferAmount * BigInt(traders.length);

      for (const trader of traders) {
        await expect(token.transfer(trader.address, transferAmount))
          .to.emit(token, "Transfer")
          .withArgs(owner.address, trader.address, transferAmount);
      }

      expect(await token.balanceOf(owner.address)).to.equal(initialSupply - totalAmount);

      for (const trader of traders) {
        expect(await token.balanceOf(trader.address)).to.equal(transferAmount);
      }
    });
  });
});
