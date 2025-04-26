import { expect } from "../helpers/setup";
import { ethers, upgrades } from "hardhat";
import type { YKAToken } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("YKAToken Ownership", function () {
  let token: YKAToken;
  let deployer: SignerWithAddress;
  let deployerAddress: string;
  let newOwner: SignerWithAddress;
  let newOwnerAddress: string;
  let nonOwner: SignerWithAddress;
  const initialSupply = ethers.parseEther("1000000");

  beforeEach(async function () {
    [deployer, newOwner, nonOwner] = await ethers.getSigners();

    deployerAddress = deployer.address;
    newOwnerAddress = newOwner.address;

    const YKATokenFactory = await ethers.getContractFactory("YKAToken");
    token = await upgrades.deployProxy(YKATokenFactory, [
      initialSupply,
      deployerAddress
    ]) as YKAToken;
    await token.waitForDeployment();
  });

  describe("Basic Ownership Management", function () {
    it("Should allow owner to transfer ownership", async function () {
      await token.transferOwnership(newOwnerAddress);
      const pendingOwner = await token.pendingOwner();
      expect(pendingOwner.toLowerCase()).to.equal(newOwnerAddress.toLowerCase());
    });

    it("Should prevent non-owner from transferring ownership", async function () {
      await expect(
        token.connect(nonOwner).transferOwnership(newOwnerAddress)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should emit OwnershipTransferStarted and OwnershipTransferred events", async function () {
      await token.transferOwnership(newOwnerAddress);
      await token.connect(newOwner).acceptOwnership();
      const owner = await token.owner();
      expect(owner.toLowerCase()).to.equal(newOwnerAddress.toLowerCase());
    });

    it("Should handle transfer to zero address", async function () {
      await token.transferOwnership(ethers.ZeroAddress);
      const pendingOwner = await token.pendingOwner();
      expect(pendingOwner).to.equal(ethers.ZeroAddress);
    });

    it("Should handle transfer to same address", async function () {
      await token.transferOwnership(deployerAddress);
      const pendingOwner = await token.pendingOwner();
      expect(pendingOwner.toLowerCase()).to.equal(deployerAddress.toLowerCase());
    });
  });

  describe("Ownership Transfer", function () {
    it("Should handle ownership transfer correctly", async function () {
      // Step 1: Transfer ownership
      await token.transferOwnership(newOwnerAddress);
      const pendingOwner = await token.pendingOwner();
      expect(pendingOwner.toLowerCase()).to.equal(newOwnerAddress.toLowerCase());

      // Step 2: Accept ownership
      await token.connect(newOwner).acceptOwnership();
      const owner = await token.owner();
      expect(owner.toLowerCase()).to.equal(newOwnerAddress.toLowerCase());
      expect(await token.pendingOwner()).to.equal(ethers.ZeroAddress);
    });

    it("Should cancel ownership transfer", async function () {
      // Initiate transfer
      await token.transferOwnership(newOwnerAddress);
      const pendingOwner = await token.pendingOwner();
      expect(pendingOwner.toLowerCase()).to.equal(newOwnerAddress.toLowerCase());

      // Cancel transfer
      await token.transferOwnership(ethers.ZeroAddress);
      expect(await token.pendingOwner()).to.equal(ethers.ZeroAddress);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero address cases", async function () {
      await token.transferOwnership(ethers.ZeroAddress);
      const pendingOwner = await token.pendingOwner();
      expect(pendingOwner).to.equal(ethers.ZeroAddress);
      // Verify current owner is unchanged
      const owner = await token.owner();
      expect(owner.toLowerCase()).to.equal(deployerAddress.toLowerCase());
    });

    it("Should handle repeated transfer attempts", async function () {
      // First transfer attempt
      await token.transferOwnership(newOwnerAddress);
      const pendingOwner = await token.pendingOwner();
      expect(pendingOwner.toLowerCase()).to.equal(newOwnerAddress.toLowerCase());

      // Second transfer attempt before acceptance
      const anotherOwner = (await ethers.getSigners())[3];
      const anotherOwnerAddress = anotherOwner.address;
      await token.transferOwnership(anotherOwnerAddress);
      const pendingOwner2 = await token.pendingOwner();
      expect(pendingOwner2.toLowerCase()).to.equal(anotherOwnerAddress.toLowerCase());

      // Original pending owner should not be able to accept
      await expect(
        token.connect(newOwner).acceptOwnership()
      ).to.be.revertedWith("Ownable2Step: caller is not the new owner");
    });
  });
});