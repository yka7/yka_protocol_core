import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { type PublicClient, type WalletClient } from "viem";
import { parseEther, formatEther, getAddress } from "viem";

interface TestContext {
  ykaToken: any;
  publicClient: PublicClient;
  initialSupply: bigint;
  owner: WalletClient;
  otherAccount: WalletClient;
  ownerAddress: string;
}

describe("YKAToken", function () {
  async function deployFixture(): Promise<TestContext> {
    const initialSupply = parseEther("1000000");
    const [owner, otherAccount] = await hre.viem.getWalletClients();
    const ownerAddress = getAddress(owner.account.address);
    const publicClient = await hre.viem.getPublicClient();
    
    const ykaToken = await hre.viem.deployContract("YKAToken", [], {});
    const initHash = await ykaToken.write.initialize([initialSupply, ownerAddress], {
      account: owner.account,
    });
    await publicClient.waitForTransactionReceipt({ hash: initHash });

    return {
      ykaToken,
      publicClient,
      initialSupply,
      owner,
      otherAccount,
      ownerAddress,
    };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { ykaToken, owner } = await loadFixture(deployFixture);
      expect(await ykaToken.read.owner()).to.equal(getAddress(owner.account.address));
    });

    it("Should assign the total supply to the owner", async function () {
      const { ykaToken, owner, initialSupply } = await loadFixture(deployFixture);
      const balance = await ykaToken.read.balanceOf([owner.account.address]);
      expect(balance).to.equal(initialSupply);
    });

    it("Should have correct token metadata", async function () {
      const { ykaToken } = await loadFixture(deployFixture);
      expect(await ykaToken.read.name()).to.equal("YKA Token");
      expect(await ykaToken.read.symbol()).to.equal("YKA");
      expect(await ykaToken.read.decimals()).to.equal(18);
    });

    it("Should prevent reinitializing", async function () {
      const { ykaToken, owner, initialSupply } = await loadFixture(deployFixture);
      await expect(
        ykaToken.write.initialize([initialSupply, owner.account.address], { account: owner.account })
      ).to.be.rejectedWith(/InvalidInitialization/);
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      const { ykaToken, publicClient, owner, otherAccount, initialSupply } = await loadFixture(deployFixture);
      const amountToSend = parseEther("100");

      const hash = await ykaToken.write.transfer([otherAccount.account.address, amountToSend], {
        account: owner.account,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      const otherBalance = await ykaToken.read.balanceOf([otherAccount.account.address]);
      const ownerBalance = await ykaToken.read.balanceOf([owner.account.address]);
      
      expect(otherBalance).to.equal(amountToSend);
      expect(ownerBalance).to.equal(initialSupply - amountToSend);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const { ykaToken, owner, otherAccount } = await loadFixture(deployFixture);
      const balance = await ykaToken.read.balanceOf([owner.account.address]);
      const invalidAmount = balance + parseEther("1");

      await expect(
        ykaToken.write.transfer([otherAccount.account.address, invalidAmount], {
          account: owner.account,
        })
      ).to.be.rejectedWith(/ERC20InsufficientBalance/);
    });
  });

  describe("Ownership", function () {
    it("Should allow owner to transfer ownership", async function () {
      const { ykaToken, publicClient, owner, otherAccount } = await loadFixture(deployFixture);
      const hash = await ykaToken.write.transferOwnership([otherAccount.account.address], {
        account: owner.account,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      expect(await ykaToken.read.owner()).to.equal(getAddress(otherAccount.account.address));
    });

    it("Should prevent non-owner from transferring ownership", async function () {
      const { ykaToken, otherAccount } = await loadFixture(deployFixture);
      await expect(
        ykaToken.write.transferOwnership([otherAccount.account.address], {
          account: otherAccount.account,
        })
      ).to.be.rejectedWith(/OwnableUnauthorizedAccount/);
    });
  });
});
