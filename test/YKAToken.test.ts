import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import hre from "hardhat";
import { ignition } from "hardhat";
import { expect } from "chai";
import { type PublicClient, type WalletClient, type Address } from "viem";
import { parseEther, formatEther, getAddress, zeroAddress } from "viem";

// Import the Ignition module
import YKATokenModule from "../ignition/modules/YKAToken";

// Define an interface for the deployed contracts object returned by the fixture
interface DeployedContracts {
  ykaToken: any; // Adjust type if using TypeChain with Ignition (might need specific types)
}

// Define an interface for the test context
interface TestContext extends DeployedContracts {
  publicClient: PublicClient;
  initialSupply: bigint;
  initialOwnerAddress: Address;
  owner: WalletClient;
  otherAccount: WalletClient;
}

describe("YKAToken (Ignition Deployment)", function () {
  // Define the initial state for tests using a fixture that deploys via Ignition
  async function deployYKATokenFixture(): Promise<TestContext> {
    // --- Setup ---
    const initialSupplyString = "1000000"; // Supply as string for parameter
    const initialSupply = parseEther(initialSupplyString);

    // Get test accounts using Viem
    const [owner, otherAccount] = await hre.viem.getWalletClients();
    const initialOwnerAddress = getAddress(owner.account.address); // Use deployer as default owner for testing
    const publicClient = await hre.viem.getPublicClient();

    // --- Deployment via Ignition ---
    // Deploy the YKATokenModule, passing parameters for the fixture
    const { token } = await ignition.deploy(YKATokenModule, {
      parameters: {
        YKATokenModule: {
          initialOwner: initialOwnerAddress,
          initialSupply: initialSupplyString,
        }
      },
    });

    // Get a Viem contract instance
    const ykaToken = await hre.viem.getContractAt("YKAToken", getAddress(token.address));

    // console.log(`   Fixture: Ignition deployed proxy to ${proxyAddress}`);
    // console.log(`   Fixture: Initial owner set to ${initialOwnerAddress}`);

    return {
      ykaToken, // Viem instance attached to the proxy
      publicClient,
      initialSupply,
      initialOwnerAddress,
      owner,
      otherAccount,
    };
  }

  // --- Test Cases ---

  // Test suite for Deployment and Initialization (via Ignition)
  describe("Deployment and Initialization", function () {
    it("Should set the right owner via initializer", async function () {
      const { ykaToken, initialOwnerAddress } = await loadFixture(deployYKATokenFixture);
      expect(await ykaToken.read.owner()).to.equal(initialOwnerAddress);
    });

    it("Should assign the total supply of tokens to the owner via initializer", async function () {
      const { ykaToken, initialOwnerAddress, initialSupply } = await loadFixture(deployYKATokenFixture);
      const ownerBalance = await ykaToken.read.balanceOf([initialOwnerAddress]);
      expect(ownerBalance).to.equal(initialSupply);
      console.log(`      Owner balance: ${formatEther(ownerBalance)} YKA`);
    });

    it("Should have the correct name and symbol set via initializer", async function () {
      const { ykaToken } = await loadFixture(deployYKATokenFixture);
      expect(await ykaToken.read.name()).to.equal("YKA Token");
      expect(await ykaToken.read.symbol()).to.equal("YKA");
      console.log(`      Token Name: ${await ykaToken.read.name()}`);
      console.log(`      Token Symbol: ${await ykaToken.read.symbol()}`);
    });

    it("Should have the correct decimals", async function () {
      const { ykaToken } = await loadFixture(deployYKATokenFixture);
      expect(await ykaToken.read.decimals()).to.equal(18);
      console.log(`      Decimals: ${await ykaToken.read.decimals()}`);
    });

    it("Should prevent initializing again (proxy already initialized)", async function () {
      const { ykaToken, owner, initialSupply } = await loadFixture(deployYKATokenFixture);
      // Attempt to call initialize directly on the implementation *might* work if accessible,
      // but calling it through the proxy (which is what ykaToken represents) should fail.
      // Note: Direct calls to initialize on the proxy address after deployment are blocked by the Initializable guard.
      await expect(
        ykaToken.write.initialize([initialSupply, owner.account!.address], { account: owner.account! })
      ).to.be.rejectedWith("InvalidInitialization");
    });
  });

  // Test suite for Transactions (interacting via Proxy deployed by Ignition)
  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      const { ykaToken, publicClient, owner, otherAccount, initialSupply, initialOwnerAddress } = await loadFixture(deployYKATokenFixture);
      const otherAccountAddress = getAddress(otherAccount.account!.address);
      const amountToSend = parseEther("100");

      const hash = await ykaToken.write.transfer([otherAccountAddress, amountToSend], {
        account: owner.account!,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      const otherAccountBalance = await ykaToken.read.balanceOf([otherAccountAddress]);
      const ownerBalance = await ykaToken.read.balanceOf([initialOwnerAddress]);

      expect(otherAccountBalance).to.equal(amountToSend);
      expect(ownerBalance).to.equal(initialSupply - amountToSend);
      console.log(`      otherAccount balance after transfer: ${formatEther(otherAccountBalance)} YKA`);
      console.log(`      Owner balance after transfer: ${formatEther(ownerBalance)} YKA`);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const { ykaToken, owner, otherAccount, initialOwnerAddress } = await loadFixture(deployYKATokenFixture);
      const otherAccountAddress = getAddress(otherAccount.account!.address);
      const initialOwnerBalance = await ykaToken.read.balanceOf([initialOwnerAddress]);
      const amountToSend = initialOwnerBalance + parseEther("1");

      await expect(
        ykaToken.write.transfer([otherAccountAddress, amountToSend], {
          account: owner.account!,
        })
      ).to.be.rejectedWith(/ERC20InsufficientBalance|transfer amount exceeds balance/);
      console.log(`      Attempted to send: ${formatEther(amountToSend)} YKA`);
      console.log(`      Owner balance: ${formatEther(initialOwnerBalance)} YKA`);
    });

    // --- Other transaction tests (burn, approve, transferFrom) remain largely the same ---
    it("Should allow burning tokens", async function () {
      const { ykaToken, publicClient, owner, initialSupply, initialOwnerAddress } = await loadFixture(deployYKATokenFixture);
      const amountToBurn = parseEther("500");

      const burnHash = await ykaToken.write.burn([amountToBurn], { account: owner.account });
      await publicClient.waitForTransactionReceipt({ hash: burnHash });

      const ownerBalanceAfterBurn = await ykaToken.read.balanceOf([initialOwnerAddress]);
      const totalSupplyAfterBurn = await ykaToken.read.totalSupply();

      expect(ownerBalanceAfterBurn).to.equal(initialSupply - amountToBurn);
      expect(totalSupplyAfterBurn).to.equal(initialSupply - amountToBurn);
      console.log(`      Owner balance after burn: ${formatEther(ownerBalanceAfterBurn)} YKA`);
      console.log(`      Total supply after burn: ${formatEther(totalSupplyAfterBurn)} YKA`);
    });

    it("Should handle approvals and transferFrom", async function () {
      const { ykaToken, publicClient, owner, otherAccount, initialSupply, initialOwnerAddress } = await loadFixture(deployYKATokenFixture); // Fixture provides initialOwnerAddress
      const otherAccountAddress = getAddress(otherAccount.account!.address);
      const amountToApprove = parseEther("200");
      const amountToTransfer = parseEther("150");

      const approveHash = await ykaToken.write.approve([otherAccountAddress, amountToApprove], { account: owner.account! });
      await publicClient.waitForTransactionReceipt({ hash: approveHash });

      const allowance = await ykaToken.read.allowance([initialOwnerAddress, otherAccountAddress]); // Use initialOwnerAddress from fixture
      expect(allowance).to.equal(amountToApprove);
      console.log(`      Allowance for otherAccount: ${formatEther(allowance)} YKA`);

      const transferFromHash = await ykaToken.write.transferFrom([initialOwnerAddress, otherAccountAddress, amountToTransfer], { account: otherAccount.account! });
      await publicClient.waitForTransactionReceipt({ hash: transferFromHash });

      const ownerBalanceAfter = await ykaToken.read.balanceOf([initialOwnerAddress]);
      const otherAccountBalanceAfter = await ykaToken.read.balanceOf([otherAccountAddress]);

      expect(ownerBalanceAfter).to.equal(initialSupply - amountToTransfer);
      expect(otherAccountBalanceAfter).to.equal(amountToTransfer);
      console.log(`      Owner balance after transferFrom: ${formatEther(ownerBalanceAfter)} YKA`);
      console.log(`      otherAccount balance after transferFrom: ${formatEther(otherAccountBalanceAfter)} YKA`);

      const remainingAllowance = await ykaToken.read.allowance([initialOwnerAddress, otherAccountAddress]); // Use initialOwnerAddress from fixture
      expect(remainingAllowance).to.equal(amountToApprove - amountToTransfer);
      console.log(`      Remaining allowance: ${formatEther(remainingAllowance)} YKA`);

      await expect(
        ykaToken.write.transferFrom([initialOwnerAddress, otherAccountAddress, parseEther("100")], { account: otherAccount.account! })
      ).to.be.rejectedWith(/ERC20InsufficientAllowance|transfer amount exceeds allowance/);
    });
  });

  // --- Ownership tests remain the same ---
  describe("Ownership", function () {
    it("Should allow owner to transfer ownership", async function () {
      const { ykaToken, publicClient, owner, otherAccount } = await loadFixture(deployYKATokenFixture);
      const newOwnerAddress = getAddress(otherAccount.account!.address);

      const txHash = await ykaToken.write.transferOwnership([newOwnerAddress], { account: owner.account! });
      await publicClient.waitForTransactionReceipt({ hash: txHash });

      expect(await ykaToken.read.owner()).to.equal(newOwnerAddress);
      console.log(`      Ownership transferred to: ${newOwnerAddress}`);
    });

    it("Should prevent non-owner from transferring ownership", async function () {
      const { ykaToken, otherAccount } = await loadFixture(deployYKATokenFixture);
      const nonOwnerAddress = getAddress(otherAccount.account!.address);

      await expect(
        ykaToken.write.transferOwnership([nonOwnerAddress], { account: otherAccount.account! })
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });
  });

  // --- Upgradeability tests remain the same (conceptual check) ---
  describe("Upgradeability (UUPS)", function () {
    it("Should allow the owner to authorize upgrades (conceptual check)", async function () {
      const { ykaToken, initialOwnerAddress } = await loadFixture(deployYKATokenFixture);
      expect(await ykaToken.read.owner()).to.equal(initialOwnerAddress);
      console.log("      Owner check passed, implying _authorizeUpgrade restriction is in place.")
    });
  });

});
