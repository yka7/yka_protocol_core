import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { YKAToken } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("YKAToken - Batch Transfer Tests", function () {
  let token: YKAToken;
  let owner: SignerWithAddress;
  let users: SignerWithAddress[];
  const initialSupply = ethers.parseEther("1000000");

  beforeEach(async function () {
    [owner, ...users] = await ethers.getSigners();

    const YKAToken = await ethers.getContractFactory("YKAToken");
    token = (await upgrades.deployProxy(YKAToken, [
      initialSupply,
      owner.address,
    ])) as YKAToken;
    await token.waitForDeployment();
  });

  describe("batchTransfer", function () {
    it("should transfer tokens to multiple recipients", async function () {
      const recipients = users.slice(0, 3);
      const amounts = [
        ethers.parseEther("100"),
        ethers.parseEther("200"),
        ethers.parseEther("300"),
      ];

      await expect(
        token.batchTransfer(
          recipients.map((r) => r.address),
          amounts,
          {
            gasLimit: 3000000,
          }
        )
      ).to.not.be.reverted;

      // Verify balances
      for (let i = 0; i < recipients.length; i++) {
        expect(await token.balanceOf(recipients[i].address)).to.equal(
          amounts[i]
        );
      }
    });

    it("should process large batches with checkpoints", async function () {
      const recipientCount = 10;

      const recipients = users.slice(0, recipientCount);
      const amounts = Array(recipientCount).fill(ethers.parseEther("100"));

      const tx = await token.batchTransfer(
        recipients.map((r) => r.address),
        amounts,
        { gasLimit: 3000000 }
      );
      const receipt = await tx.wait();

      // Verify all transfers completed
      for (const recipient of recipients) {
        expect(await token.balanceOf(recipient.address)).to.equal(
          ethers.parseEther("100")
        );
      }
    });
  });

  describe("batchTransferFrom", function () {
    beforeEach(async function () {
      // Approve token spending
      await token.approve(users[0].address, ethers.parseEther("1000"));
    });

    it("should transfer tokens from approved account", async function () {
      const recipients = users.slice(1, 4);
      const amounts = [
        ethers.parseEther("100"),
        ethers.parseEther("200"),
        ethers.parseEther("300"),
      ];

      await expect(
        token.connect(users[0]).batchTransferFrom(
          owner.address,
          recipients.map((r) => r.address),
          amounts,
          { gasLimit: 3000000 }
        )
      ).to.not.be.reverted;

      // Verify balances
      for (let i = 0; i < recipients.length; i++) {
        expect(await token.balanceOf(recipients[i].address)).to.equal(
          amounts[i]
        );
      }
    });

    it("should revert if allowance is insufficient", async function () {
      const recipients = users.slice(1, 4);
      const amounts = [
        ethers.parseEther("400"),
        ethers.parseEther("400"),
        ethers.parseEther("400"),
      ];

      await expect(
        token.connect(users[0]).batchTransferFrom(
          owner.address,
          recipients.map((r) => r.address),
          amounts,
          { gasLimit: 3000000 }
        )
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientAllowance");
    });

    it("should process large batches with checkpoints", async function () {
      const recipientCount = 10;
      const checkpoint = 3;

      const recipients = users.slice(1, recipientCount + 1);
      const amounts = Array(recipientCount).fill(ethers.parseEther("50"));

      // Approve sufficient tokens
      await token.approve(users[0].address, ethers.parseEther("500"));

      const tx = await token.connect(users[0]).batchTransferFrom(
        owner.address,
        recipients.map((r) => r.address),
        amounts,
        { gasLimit: 3000000 }
      );
      const receipt = await tx.wait();

      // Verify all transfers completed
      for (const recipient of recipients) {
        expect(await token.balanceOf(recipient.address)).to.equal(
          ethers.parseEther("50")
        );
      }
    });
  });
});
