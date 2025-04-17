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
  initialOwnerAddress: Address;
  initialSupply: bigint;
}

describe("YKAToken Distribution", function () {
  async function deployFixture(): Promise<TestContext> {
    const [owner] = await hre.viem.getWalletClients();
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
      initialOwnerAddress,
      initialSupply
    };
  }

  describe("Initial Distribution", function () {
    it("Should transfer 1% of total supply to trader", async function () {
      const { ykaToken, publicClient, owner, initialSupply } = await loadFixture(deployFixture);
      const [_, trader] = await hre.viem.getWalletClients();
      const ownerAddress = getAddress(owner.account!.address);
      const traderAddress = getAddress(trader.account!.address);

      console.log(`\n      Accounts:`);
      console.log(`      - Owner: ${ownerAddress}`);
      console.log(`      - Trader: ${traderAddress}`);

      // Verify initial balances
      const initialTraderBalance = await ykaToken.read.balanceOf([traderAddress]);
      const initialOwnerBalance = await ykaToken.read.balanceOf([ownerAddress]);

      expect(initialTraderBalance).to.equal(BigInt(0));
      expect(initialOwnerBalance).to.equal(initialSupply);

      console.log(`\n      Initial Balances:`);
      console.log(`      - Owner: ${formatEther(initialOwnerBalance)} YKA`);
      console.log(`      - Trader: ${formatEther(initialTraderBalance)} YKA`);

      // Calculate and execute transfer (1% of supply)
      const transferPercentage = BigInt(1);
      const amountToTransfer = (initialSupply * transferPercentage) / BigInt(100);
      console.log(`\n      Transferring ${formatEther(amountToTransfer)} YKA (1% of supply)`);

      const hash = await ykaToken.write.transfer(
        [traderAddress, amountToTransfer],
        { account: owner.account! }
      );
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      expect(receipt.status).to.equal("success");

      // Verify final balances
      const traderBalance = await ykaToken.read.balanceOf([traderAddress]);
      const ownerBalance = await ykaToken.read.balanceOf([owner.account!.address]);

      expect(traderBalance).to.equal(amountToTransfer);
      expect(ownerBalance).to.equal(initialSupply - amountToTransfer);

      console.log("\n      Results:");
      console.log(`      - Amount transferred: ${formatEther(amountToTransfer)} YKA (1%)`);
      console.log(`      - Trader balance: ${formatEther(traderBalance)} YKA`);
      console.log(`      - Owner remaining: ${formatEther(ownerBalance)} YKA`);
    });

    it("Should distribute tokens to multiple traders", async function () {
      const { ykaToken, publicClient, owner, initialSupply } = await loadFixture(deployFixture);
      const [_, trader1, trader2, trader3] = await hre.viem.getWalletClients();

      // Get trader addresses
      const traders = [trader1, trader2, trader3].map(t => ({
        address: getAddress(t.account!.address),
        wallet: t
      }));

      console.log("\n      Multiple Traders Distribution:");
      console.log(`      - Number of traders: ${traders.length}`);

      // Verify initial balances
      const ownerAddress = getAddress(owner.account!.address);
      const initialOwnerBalance = await ykaToken.read.balanceOf([ownerAddress]);
      expect(initialOwnerBalance).to.equal(initialSupply);

      // Transfer 1% to each trader
      const transferPercentage = BigInt(1);
      const amountPerTrader = (initialSupply * transferPercentage) / BigInt(100);
      const totalAmount = amountPerTrader * BigInt(traders.length);

      console.log(`      - Amount per trader: ${formatEther(amountPerTrader)} YKA (1%)`);
      console.log(`      - Total distribution: ${formatEther(totalAmount)} YKA (${traders.length}%)`);

      // Execute transfers
      for (const { address } of traders) {
        const hash = await ykaToken.write.transfer(
          [address, amountPerTrader],
          { account: owner.account! }
        );
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        expect(receipt.status).to.equal("success");
      }

      // Verify final balances
      console.log("\n      Final Balances:");
      const ownerFinalBalance = await ykaToken.read.balanceOf([ownerAddress]);
      console.log(`      - Owner: ${formatEther(ownerFinalBalance)} YKA`);

      for (const { address } of traders) {
        const balance = await ykaToken.read.balanceOf([address]);
        expect(balance).to.equal(amountPerTrader);
        console.log(`      - Trader (${address}): ${formatEther(balance)} YKA`);
      }

      expect(ownerFinalBalance).to.equal(initialSupply - totalAmount);
    });
  });
});
