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
  otherAccounts: WalletClient[];
  initialOwnerAddress: Address;
  initialSupply: bigint;
}

describe("YKAToken Economic Simulation", function () {
  before(async function () {
    console.log("\n      Starting Economic Simulation Tests...");
    console.log("      ================================");
  });

  after(async function () {
    console.log("\n      Economic Simulation Tests Complete");
    console.log("      ==============================\n");
  });

  async function deployFixture(): Promise<TestContext> {
    const accounts = await hre.viem.getWalletClients();
    const [owner, ...otherAccounts] = accounts;
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
      otherAccounts,
      initialOwnerAddress,
      initialSupply
    };
  }

  describe("Token Distribution", function () {
    it("Should distribute tokens to multiple traders", async function () {
      const { ykaToken, publicClient, owner, otherAccounts, initialSupply } = await loadFixture(deployFixture);
      const distributionAmount = parseEther("10");
      const traderAddresses = otherAccounts.slice(0, 3).map(acc => getAddress(acc.account!.address));

      console.log("\n      Initial Distribution Setup:");
      console.log(`      - Distribution amount per trader: ${formatEther(distributionAmount)} YKA`);

      // 各トレーダーへの配布
      for (let i = 0; i < traderAddresses.length; i++) {
        const hash = await ykaToken.write.transfer(
          [traderAddresses[i], distributionAmount],
          { account: owner.account! }
        );
        await publicClient.waitForTransactionReceipt({ hash });

        const balance = await ykaToken.read.balanceOf([traderAddresses[i]]);
        expect(balance).to.equal(distributionAmount);
        console.log(`      - Trader ${i + 1} received: ${formatEther(balance)} YKA`);
      }

      // オーナーの残高確認
      const ownerBalance = await ykaToken.read.balanceOf([owner.account!.address]);
      const totalDistributed = distributionAmount * BigInt(traderAddresses.length);
      expect(ownerBalance).to.equal(initialSupply - totalDistributed);
      console.log(`      - Owner remaining: ${formatEther(ownerBalance)} YKA`);
    });

    it("Should simulate trading between traders", async function () {
      const { ykaToken, publicClient, owner, otherAccounts } = await loadFixture(deployFixture);
      const [trader1, trader2] = otherAccounts;
      const tradeAmount = parseEther("5");

      // 最初の配布
      const initialDistribution = parseEther("20");
      await ykaToken.write.transfer(
        [getAddress(trader1.account!.address), initialDistribution],
        { account: owner.account! }
      );

      // トレーダー間の取引
      const hash = await ykaToken.write.transfer(
        [getAddress(trader2.account!.address), tradeAmount],
        { account: trader1.account! }
      );
      await publicClient.waitForTransactionReceipt({ hash });

      const trader2Balance = await ykaToken.read.balanceOf([getAddress(trader2.account!.address)]);
      expect(trader2Balance).to.equal(tradeAmount);
      console.log(`      Trade completed: ${formatEther(tradeAmount)} YKA transferred between traders`);
    });
  });

  describe("Market Simulation", function () {
    it("Should handle multiple concurrent approvals and transfers", async function () {
      const { ykaToken, publicClient, owner, otherAccounts } = await loadFixture(deployFixture);
      const [trader1, trader2, trader3] = otherAccounts;
      const approvalAmount = parseEther("50");
      const trader1Address = getAddress(trader1.account!.address);
      const trader2Address = getAddress(trader2.account!.address);
      const trader3Address = getAddress(trader3.account!.address);

      // トレーダー1への初期配布
      await ykaToken.write.transfer([trader1Address, approvalAmount], { account: owner.account! });

      // 承認の設定
      await ykaToken.write.approve([trader2Address, approvalAmount], { account: trader1.account! });
      await ykaToken.write.approve([trader3Address, approvalAmount], { account: trader1.account! });

      // 並行取引のシミュレーション
      // トランザクションを順番に実行
      console.log("      Executing first transfer...");
      const transfer1Hash = await ykaToken.write.transferFrom(
        [trader1Address, trader2Address, parseEther("20")],
        { account: trader2.account! }
      );
      await publicClient.waitForTransactionReceipt({ hash: transfer1Hash });

      console.log("      Executing second transfer...");
      const transfer2Hash = await ykaToken.write.transferFrom(
        [trader1Address, trader3Address, parseEther("20")],
        { account: trader3.account! }
      );
      await publicClient.waitForTransactionReceipt({ hash: transfer2Hash });

      // 結果の検証
      const balances = await Promise.all([
        ykaToken.read.balanceOf([trader1Address]),
        ykaToken.read.balanceOf([trader2Address]),
        ykaToken.read.balanceOf([trader3Address])
      ]);

      console.log("\n      Market Simulation Results:");
      console.log(`      - Trader 1 Balance: ${formatEther(balances[0])} YKA`);
      console.log(`      - Trader 2 Balance: ${formatEther(balances[1])} YKA`);
      console.log(`      - Trader 3 Balance: ${formatEther(balances[2])} YKA`);
    });
  });
});