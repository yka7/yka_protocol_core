import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { parseEther, formatEther, getAddress, zeroAddress } from "viem";

// Describe the test suite for the YKAToken contract
describe("YKAToken", function () {
  // Define the initial state for tests using a fixture
  async function deployYKATokenFixture() {
    // --- Setup ---
    const initialSupply = parseEther("1000000"); // 1 million tokens

    // Get test accounts
    const [owner, otherAccount] = await hre.viem.getWalletClients();

    // --- Deployment ---
    const deployedContract = await hre.viem.deployContract("YKAToken", [], {});

    // Initialize the contract
    await deployedContract.write.initialize([initialSupply, owner.account.address], {
      account: owner.account,
    });

    return {
      ykaToken: deployedContract,
      initialSupply,
      owner,
      otherAccount,
    };
  }

  // --- Test Cases ---

  // Test suite for Deployment
  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { ykaToken, owner } = await loadFixture(deployYKATokenFixture);
      // Check if the contract's owner matches the deployer's address
      expect(await ykaToken.read.owner()).to.equal(getAddress(owner.account.address)); // Compare checksummed addresses
    });

    it("Should assign the total supply of tokens to the owner", async function () {
      const { ykaToken, owner, initialSupply } = await loadFixture(deployYKATokenFixture);
      // Check if the owner's balance matches the initial supply
      const ownerBalance = await ykaToken.read.balanceOf([owner.account.address]);
      expect(ownerBalance).to.equal(initialSupply);
      console.log(`      Owner balance: ${formatEther(ownerBalance)} YKA`);
    });

    it("Should have the correct name and symbol", async function () {
      const { ykaToken } = await loadFixture(deployYKATokenFixture);
      // Check if the token name is "YKA Token"
      expect(await ykaToken.read.name()).to.equal("YKA Token");
      // Check if the token symbol is "YKA"
      expect(await ykaToken.read.symbol()).to.equal("YKA");
      console.log(`      Token Name: ${await ykaToken.read.name()}`);
      console.log(`      Token Symbol: ${await ykaToken.read.symbol()}`);
    });

    it("Should have the correct decimals", async function () {
      const { ykaToken } = await loadFixture(deployYKATokenFixture);
      // Standard ERC20 tokens usually have 18 decimals
      expect(await ykaToken.read.decimals()).to.equal(18);
      console.log(`      Decimals: ${await ykaToken.read.decimals()}`);
    });
  });

  // Test suite for Transactions
  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      const { ykaToken, owner, otherAccount } = await loadFixture(deployYKATokenFixture);
      const amountToSend = parseEther("100"); // Amount to transfer

      // Transfer tokens from owner to otherAccount
      await ykaToken.write.transfer([otherAccount.account.address, amountToSend], {
        account: owner.account, // Specify the sender account
      });

      // Check otherAccount's balance
      const otherAccountBalance = await ykaToken.read.balanceOf([otherAccount.account.address]);
      expect(otherAccountBalance).to.equal(amountToSend);
      console.log(`      otherAccount balance after transfer: ${formatEther(otherAccountBalance)} YKA`);

      // Check owner's remaining balance
      const ownerBalance = await ykaToken.read.balanceOf([owner.account.address]);
      const initialSupply = (await loadFixture(deployYKATokenFixture)).initialSupply; // Reload initial supply
      expect(ownerBalance).to.equal(initialSupply - amountToSend); // initialSupply is bigint
      console.log(`      Owner balance after transfer: ${formatEther(ownerBalance)} YKA`);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const { ykaToken, owner, otherAccount } = await loadFixture(deployYKATokenFixture);
      const initialOwnerBalance = await ykaToken.read.balanceOf([owner.account.address]);
      const amountToSend = initialOwnerBalance + parseEther("1"); // Try to send more than the owner has

      // Expect the transaction to revert
      await expect(
        ykaToken.write.transfer([otherAccount.account.address, amountToSend], {
          account: owner.account,
        })
      ).to.be.rejectedWith(/ERC20InsufficientBalance|transfer amount exceeds balance/); // Check for common ERC20 error messages
      console.log(`      Attempted to send: ${formatEther(amountToSend)} YKA`);
      console.log(`      Owner balance: ${formatEther(initialOwnerBalance)} YKA`);
    });

    // Add more tests here for approval, transferFrom, burn, permit, etc.
    it("Should allow burning tokens", async function () {
      const { ykaToken, owner, initialSupply } = await loadFixture(deployYKATokenFixture);
      const amountToBurn = parseEther("500");

      // Burn tokens from owner's account
      await ykaToken.write.burn([amountToBurn], { account: owner.account });

      // Check owner's balance after burning
      const ownerBalanceAfterBurn = await ykaToken.read.balanceOf([owner.account.address]);
      expect(ownerBalanceAfterBurn).to.equal(initialSupply - amountToBurn);

      // Check total supply after burning
      const totalSupplyAfterBurn = await ykaToken.read.totalSupply();
      expect(totalSupplyAfterBurn).to.equal(initialSupply - amountToBurn);

      console.log(`      Owner balance after burn: ${formatEther(ownerBalanceAfterBurn)} YKA`);
      console.log(`      Total supply after burn: ${formatEther(totalSupplyAfterBurn)} YKA`);
    });

    it("Should handle approvals and transferFrom", async function () {
      const { ykaToken, owner, otherAccount, initialSupply } = await loadFixture(deployYKATokenFixture);
      const amountToApprove = parseEther("200");
      const amountToTransfer = parseEther("150");

      // Owner approves otherAccount to spend tokens
      await ykaToken.write.approve([otherAccount.account.address, amountToApprove], { account: owner.account });

      // Check allowance
      const allowance = await ykaToken.read.allowance([owner.account.address, otherAccount.account.address]);
      expect(allowance).to.equal(amountToApprove);
      console.log(`      Allowance for otherAccount: ${formatEther(allowance)} YKA`);

      // otherAccount transfers tokens from owner's account
      await ykaToken.write.transferFrom([owner.account.address, otherAccount.account.address, amountToTransfer], { account: otherAccount.account });

      // Check balances after transferFrom
      const ownerBalanceAfter = await ykaToken.read.balanceOf([owner.account.address]);
      const otherAccountBalanceAfter = await ykaToken.read.balanceOf([otherAccount.account.address]);

      // Check the balances are correct
      expect(ownerBalanceAfter).to.equal(initialSupply - amountToTransfer);
      expect(otherAccountBalanceAfter).to.equal(amountToTransfer);

      console.log(`      Owner balance after transferFrom: ${formatEther(ownerBalanceAfter)} YKA`);
      console.log(`      otherAccount balance after transferFrom: ${formatEther(otherAccountBalanceAfter)} YKA`);

      // Check remaining allowance
      const remainingAllowance = await ykaToken.read.allowance([owner.account.address, otherAccount.account.address]);
      expect(remainingAllowance).to.equal(amountToApprove - amountToTransfer);

      console.log(`      Owner balance after transferFrom: ${formatEther(ownerBalanceAfter)} YKA`);
      console.log(`      otherAccount balance after transferFrom: ${formatEther(otherAccountBalanceAfter)} YKA`);
      console.log(`      Remaining allowance: ${formatEther(remainingAllowance)} YKA`);

      // Test transferring more than allowance
      await expect(
        ykaToken.write.transferFrom([owner.account.address, otherAccount.account.address, parseEther("100")], { account: otherAccount.account })
      ).to.be.rejectedWith(/ERC20InsufficientAllowance|transfer amount exceeds allowance/);
    });

  });

  // Add more test suites as needed (e.g., for Ownable functions, Permit)
});
