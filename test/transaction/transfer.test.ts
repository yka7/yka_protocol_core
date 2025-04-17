import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import hre from "hardhat";
import { ignition } from "hardhat";
import { expect } from "chai";
import { type PublicClient, type WalletClient, type Address } from "viem";
import { parseEther, formatEther, getAddress } from "viem";
import YKATokenModule from "../../ignition/modules/YKAToken";

interface TestContext {
  ykaToken: any;
  publicClient: PublicClient;
  owner: WalletClient;
  otherAccount: WalletClient;
  initialOwnerAddress: Address;
  initialSupply: bigint;
}

describe("YKAToken Transactions: Transfer", function () {
  async function deployFixture(): Promise<TestContext> {
    const [owner, otherAccount] = await hre.viem.getWalletClients();
    const initialOwnerAddress = getAddress(owner.account.address);
    const publicClient = await hre.viem.getPublicClient();
    const initialSupplyString = "1000000";
    const initialSupply = parseEther(initialSupplyString);

    const { token } = await ignition.deploy(YKATokenModule, {
      parameters: {
        YKATokenModule: {
          initialOwner: initialOwnerAddress,
          initialSupply: initialSupplyString,
        }
      },
    });

    const ykaToken = await hre.viem.getContractAt("YKAToken", getAddress(token.address));

    return {
      ykaToken,
      publicClient,
      owner,
      otherAccount,
      initialOwnerAddress,
      initialSupply
    };
  }

  describe("Basic Transfer", function () {
    it("Should transfer tokens between accounts", async function () {
      const { ykaToken, publicClient, owner, otherAccount } = await loadFixture(deployFixture);
      const recipientAddress = getAddress(otherAccount.account!.address);

      const amount = parseEther("100");
      const hash = await ykaToken.write.transfer(
        [recipientAddress, amount],
        { account: owner.account! }
      );
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      expect(receipt.status).to.equal("success");

      const recipientBalance = await ykaToken.read.balanceOf([recipientAddress]);
      expect(recipientBalance).to.equal(amount);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const { ykaToken, owner, otherAccount, initialOwnerAddress } = await loadFixture(deployFixture);
      const recipientAddress = getAddress(otherAccount.account!.address);
      const initialOwnerBalance = await ykaToken.read.balanceOf([initialOwnerAddress]);
      const amountToSend = initialOwnerBalance + parseEther("1");

      await expect(
        ykaToken.write.transfer([recipientAddress, amountToSend], {
          account: owner.account!,
        })
      ).to.be.rejectedWith(/ERC20InsufficientBalance|transfer amount exceeds balance/);
    });

    it("Should prevent transfers to zero address", async function () {
      const { ykaToken, owner } = await loadFixture(deployFixture);
      const amount = parseEther("10");
      const zeroAddress = "0x0000000000000000000000000000000000000000";

      await expect(
        ykaToken.write.transfer([zeroAddress, amount], {
          account: owner.account!,
        })
      ).to.be.rejectedWith("ERC20InvalidReceiver");
    });
  });

  describe("Batch Transfers", function () {
    it("Should handle multiple transfers in a loop", async function () {
      const { ykaToken, publicClient, owner, otherAccount, initialSupply } = await loadFixture(deployFixture);
      const recipients = Array(3).fill(getAddress(otherAccount.account!.address));
      const amounts = Array(3).fill(parseEther("10"));

      for (let i = 0; i < recipients.length; i++) {
        const hash = await ykaToken.write.transfer([recipients[i], amounts[i]], {
          account: owner.account!,
        });
        await publicClient.waitForTransactionReceipt({ hash });

        const recipientBalance = await ykaToken.read.balanceOf([recipients[i]]);
        expect(recipientBalance).to.equal(amounts[i] * BigInt(i + 1));
      }

      const ownerBalance = await ykaToken.read.balanceOf([owner.account!.address]);
      const totalTransferred = amounts.reduce((a, b) => a + b, BigInt(0));
      expect(ownerBalance).to.equal(initialSupply - totalTransferred);
    });
  });
});