import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { viem } from "hardhat";
import { expect } from "../helpers/setup";
import { parseEther, PublicActions, WalletActions } from "viem";
import type { PublicClient, WalletClient } from "viem";

describe("YKAToken Ownership", function () {
  let client: PublicClient & WalletActions;
  const initialSupply = parseEther("1000000");

  async function deployFixture() {
    const [deployer, newOwner, nonOwner] = await viem.getWalletClients();

    // Deploy token
    const token = await viem.deployContract("YKAToken");

    // Initialize
    await token.write.initialize([initialSupply, deployer.account.address]);

    return {
      token,
      deployerAddress: deployer.account.address,
      newOwnerAddress: newOwner.account.address,
      nonOwnerAddress: nonOwner.account.address,
      deployerClient: deployer,
      newOwnerClient: newOwner,
      nonOwnerClient: nonOwner
    };
  }

  describe("Basic Ownership Management", function () {
    it("Should allow owner to transfer ownership", async function () {
      const fixture = await loadFixture(deployFixture);
      await fixture.token.write.transferOwnership(
        [fixture.newOwnerAddress],
        { account: fixture.deployerClient.account }
      );
      const pendingOwner = await fixture.token.read.pendingOwner();
      expect(pendingOwner.toLowerCase()).to.equal(fixture.newOwnerAddress.toLowerCase());
    });

    it("Should prevent non-owner from transferring ownership", async function () {
      const fixture = await loadFixture(deployFixture);
      await expect(
        fixture.token.write.transferOwnership(
          [fixture.newOwnerAddress],
          { account: fixture.nonOwnerClient.account }
        )
      ).to.be.rejectedWith("Ownable: caller is not the owner");
    });

    it("Should emit OwnershipTransferStarted and OwnershipTransferred events", async function () {
      const fixture = await loadFixture(deployFixture);
      client = await viem.getPublicClient() as PublicClient & WalletActions;

      // Test OwnershipTransferStarted event
      const tx1 = await fixture.token.write.transferOwnership(
        [fixture.newOwnerAddress],
        { account: fixture.deployerClient.account }
      );
      const receipt1 = await client.waitForTransactionReceipt({ hash: tx1 });
      expect(receipt1.status).to.equal('success');
      expect(receipt1.logs.length).to.be.greaterThan(0);

      // Test OwnershipTransferred event
      const tx2 = await fixture.token.write.acceptOwnership({
        account: fixture.newOwnerClient.account
      });
      const receipt2 = await client.waitForTransactionReceipt({ hash: tx2 });
      expect(receipt2.status).to.equal('success');
      expect(receipt2.logs.length).to.be.greaterThan(0);

      const owner = await fixture.token.read.owner();
      expect(owner.toLowerCase()).to.equal(fixture.newOwnerAddress.toLowerCase());
    });

    it("Should handle transfer to zero address", async function () {
      const fixture = await loadFixture(deployFixture);
      await fixture.token.write.transferOwnership(
        ["0x0000000000000000000000000000000000000000"],
        { account: fixture.deployerClient.account }
      );
      const pendingOwner = await fixture.token.read.pendingOwner();
      expect(pendingOwner).to.equal("0x0000000000000000000000000000000000000000");
    });

    it("Should handle transfer to same address", async function () {
      const fixture = await loadFixture(deployFixture);
      await fixture.token.write.transferOwnership(
        [fixture.deployerAddress],
        { account: fixture.deployerClient.account }
      );
      const pendingOwner = await fixture.token.read.pendingOwner();
      expect(pendingOwner.toLowerCase()).to.equal(fixture.deployerAddress.toLowerCase());
    });
  });

  describe("Ownership Transfer", function () {
    it("Should handle ownership transfer correctly", async function () {
      const fixture = await loadFixture(deployFixture);

      // Step 1: Transfer ownership
      await fixture.token.write.transferOwnership(
        [fixture.newOwnerAddress],
        { account: fixture.deployerClient.account }
      );
      const pendingOwner = await fixture.token.read.pendingOwner();
      expect(pendingOwner.toLowerCase()).to.equal(fixture.newOwnerAddress.toLowerCase());

      // Step 2: Accept ownership
      await fixture.token.write.acceptOwnership({
        account: fixture.newOwnerClient.account
      });
      const owner = await fixture.token.read.owner();
      expect(owner.toLowerCase()).to.equal(fixture.newOwnerAddress.toLowerCase());
      expect(await fixture.token.read.pendingOwner()).to.equal("0x0000000000000000000000000000000000000000");
    });

    it("Should cancel ownership transfer", async function () {
      const fixture = await loadFixture(deployFixture);

      // Initiate transfer
      await fixture.token.write.transferOwnership(
        [fixture.newOwnerAddress],
        { account: fixture.deployerClient.account }
      );
      const pendingOwner = await fixture.token.read.pendingOwner();
      expect(pendingOwner.toLowerCase()).to.equal(fixture.newOwnerAddress.toLowerCase());

      // Cancel transfer
      await fixture.token.write.transferOwnership(
        ["0x0000000000000000000000000000000000000000"],
        { account: fixture.deployerClient.account }
      );
      expect(await fixture.token.read.pendingOwner()).to.equal("0x0000000000000000000000000000000000000000");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero address cases", async function () {
      const fixture = await loadFixture(deployFixture);

      await fixture.token.write.transferOwnership(
        ["0x0000000000000000000000000000000000000000"],
        { account: fixture.deployerClient.account }
      );
      const pendingOwner = await fixture.token.read.pendingOwner();
      expect(pendingOwner).to.equal("0x0000000000000000000000000000000000000000");
      // Verify current owner is unchanged
      const owner = await fixture.token.read.owner();
      expect(owner.toLowerCase()).to.equal(fixture.deployerAddress.toLowerCase());
    });

    it("Should handle repeated transfer attempts", async function () {
      const fixture = await loadFixture(deployFixture);

      // First transfer attempt
      await fixture.token.write.transferOwnership(
        [fixture.newOwnerAddress],
        { account: fixture.deployerClient.account }
      );
      const pendingOwner = await fixture.token.read.pendingOwner();
      expect(pendingOwner.toLowerCase()).to.equal(fixture.newOwnerAddress.toLowerCase());

      // Second transfer attempt before acceptance
      const [,,,anotherOwner] = await viem.getWalletClients();
      const anotherOwnerAddress = anotherOwner.account.address;
      await fixture.token.write.transferOwnership(
        [anotherOwnerAddress],
        { account: fixture.deployerClient.account }
      );
      const pendingOwner2 = await fixture.token.read.pendingOwner();
      expect(pendingOwner2.toLowerCase()).to.equal(anotherOwnerAddress.toLowerCase());

      // Original pending owner should not be able to accept
      await expect(
        fixture.token.write.acceptOwnership({
          account: fixture.newOwnerClient.account
        })
      ).to.be.rejectedWith("Ownable2Step: caller is not the new owner");
    });
  });
});