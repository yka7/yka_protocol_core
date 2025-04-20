import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers, upgrades } from "hardhat";
import { expect } from "chai";
import { Contract, ContractTransactionResponse } from "ethers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { YKAToken, MockYKATokenV2 } from "../../typechain-types";

// Extend chai with hardhat matchers
import "@nomicfoundation/hardhat-chai-matchers";

interface TestContext {
  ykaToken: YKAToken;
  owner: SignerWithAddress;
  otherAccount: SignerWithAddress;
  initialOwnerAddress: string;
  initialSupply: bigint;
  implementation: string;
}

interface MockYKATokenV2Interface extends YKAToken {
  version(): Promise<bigint>;
  setVersion(version: number): Promise<ContractTransactionResponse>;
}

describe("YKAToken Ownership", function () {
  async function deployFixture(): Promise<TestContext> {
    const [owner, otherAccount] = await ethers.getSigners();
    const initialOwnerAddress = await owner.getAddress();
    const initialSupplyString = "1000000";
    const initialSupply = ethers.parseEther(initialSupplyString);

    // Deploy YKAToken through proxy
    const YKATokenFactory = await ethers.getContractFactory("YKAToken");
    const ykaToken = await upgrades.deployProxy(YKATokenFactory, [
      initialSupply,
      initialOwnerAddress
    ], { initializer: 'initialize' });

    await ykaToken.waitForDeployment();
    const implementation = await upgrades.erc1967.getImplementationAddress(await ykaToken.getAddress());

    return {
      ykaToken,
      owner,
      otherAccount,
      initialOwnerAddress,
      initialSupply,
      implementation
    };
  }

  describe("Ownership Management", function () {
    it("Should allow owner to transfer ownership", async function () {
      const { ykaToken, owner, otherAccount } = await loadFixture(deployFixture);
      const newOwnerAddress = await otherAccount.getAddress();

      await ykaToken.connect(owner).transferOwnership(newOwnerAddress);
      expect(await ykaToken.owner()).to.equal(newOwnerAddress);
      console.log(`      Ownership transferred to: ${newOwnerAddress}`);
    });

    it("Should prevent non-owner from transferring ownership", async function () {
      const { ykaToken, otherAccount } = await loadFixture(deployFixture);
      const nonOwnerAddress = await otherAccount.getAddress();

      await expect(
        ykaToken.connect(otherAccount).transferOwnership(nonOwnerAddress)
      ).to.be.revertedWithCustomError(ykaToken, "OwnableUnauthorizedAccount");
    });

    it("Should emit OwnershipTransferred event", async function () {
      const { ykaToken, owner, otherAccount, initialOwnerAddress } = await loadFixture(deployFixture);
      const newOwnerAddress = await otherAccount.getAddress();

      await expect(ykaToken.connect(owner).transferOwnership(newOwnerAddress))
        .to.emit(ykaToken, "OwnershipTransferred")
        .withArgs(initialOwnerAddress, newOwnerAddress);

      expect(await ykaToken.owner()).to.equal(newOwnerAddress);

      await expect(
        ykaToken.connect(owner).transferOwnership(initialOwnerAddress)
      ).to.be.revertedWithCustomError(ykaToken, "OwnableUnauthorizedAccount");
    });

    it("Should prevent transfer to zero address", async function () {
      const { ykaToken, owner } = await loadFixture(deployFixture);
      const zeroAddress = ethers.ZeroAddress;

      await expect(
        ykaToken.connect(owner).transferOwnership(zeroAddress)
      ).to.be.revertedWithCustomError(ykaToken, "OwnableInvalidOwner");
    });

    it("Should handle transfer to same address", async function () {
      const { ykaToken, owner, initialOwnerAddress } = await loadFixture(deployFixture);

      await expect(
        ykaToken.connect(owner).transferOwnership(initialOwnerAddress)
      ).to.not.be.reverted;

      expect(await ykaToken.owner()).to.equal(initialOwnerAddress);
    });

    it("Should handle consecutive ownership transfers", async function () {
      const { ykaToken, owner, otherAccount } = await loadFixture(deployFixture);
      const account1 = otherAccount;
      const [, account2] = await ethers.getSigners();

      // First transfer
      await ykaToken.connect(owner).transferOwnership(await account1.getAddress());

      // Second transfer
      await ykaToken.connect(account1).transferOwnership(await account2.getAddress());

      expect(await ykaToken.owner()).to.equal(await account2.getAddress());
    });
  });

  describe("Upgrade Authorization", function () {
    it("Should deploy implementation successfully", async function () {
      const { implementation } = await loadFixture(deployFixture);
      expect(implementation).to.match(/^0x[a-fA-F0-9]{40}$/);
      console.log(`      Implementation deployed at: ${implementation}`);
    });

    it("Should have correct implementation after deployment", async function () {
      const { ykaToken, implementation } = await loadFixture(deployFixture);
      const proxyAddress = await ykaToken.getAddress();
      expect(implementation).to.not.equal(proxyAddress);
    });

    it("Should allow owner to authorize upgrade", async function () {
      const { ykaToken, owner } = await loadFixture(deployFixture);

      // Deploy new implementation
      const YKATokenV2Factory = await ethers.getContractFactory("YKAToken");
      const upgradeTx = await upgrades.upgradeProxy(
        await ykaToken.getAddress(),
        YKATokenV2Factory
      );

      await expect(upgradeTx.waitForDeployment()).to.not.be.reverted;
    });

    it("Should prevent non-owner from authorizing upgrade", async function () {
      const { ykaToken, otherAccount } = await loadFixture(deployFixture);

      // Deploy new implementation
      const YKATokenV2Factory = await ethers.getContractFactory("YKAToken", otherAccount);

      await expect(
        upgrades.upgradeProxy(await ykaToken.getAddress(), YKATokenV2Factory)
      ).to.be.revertedWithCustomError(ykaToken, "OwnableUnauthorizedAccount");
    });

    it("Should preserve state after upgrade", async function () {
      const { ykaToken, owner, initialSupply } = await loadFixture(deployFixture);

      // Get initial state
      const initialBalance = await ykaToken.balanceOf(await owner.getAddress());

      // Upgrade to V2
      const YKATokenV2Factory = await ethers.getContractFactory("MockYKATokenV2");
      const ykaTokenV2 = await upgrades.upgradeProxy(
        await ykaToken.getAddress(),
        YKATokenV2Factory
      );
      await ykaTokenV2.waitForDeployment();

      // Verify state is preserved
      const postUpgradeBalance = await ykaTokenV2.balanceOf(await owner.getAddress());
      expect(postUpgradeBalance).to.equal(initialBalance);
      expect(await ykaTokenV2.owner()).to.equal(await owner.getAddress());

      // Test new V2 functionality
      const v2Instance = ykaTokenV2 as unknown as MockYKATokenV2;
      await v2Instance.connect(owner).setVersion(2);
      expect(await v2Instance.version()).to.equal(2n);
    });

    it("Should handle multiple upgrades correctly", async function () {
      const { ykaToken, owner } = await loadFixture(deployFixture);

      // First upgrade
      const YKATokenV2Factory = await ethers.getContractFactory("MockYKATokenV2");
      const ykaTokenV2 = await upgrades.upgradeProxy(
        await ykaToken.getAddress(),
        YKATokenV2Factory
      );
      await ykaTokenV2.waitForDeployment();

      // Set version in V2
      const v2Instance = ykaTokenV2 as unknown as MockYKATokenV2;
      await v2Instance.connect(owner).setVersion(2);
      expect(await v2Instance.version()).to.equal(2n);

      // Deploy another implementation (back to V1)
      const YKATokenFactory = await ethers.getContractFactory("YKAToken");
      const upgradeTx = await upgrades.upgradeProxy(
        await ykaToken.getAddress(),
        YKATokenFactory
      );
      await upgradeTx.waitForDeployment();

      // Verify owner is still preserved
      expect(await ykaToken.owner()).to.equal(await owner.getAddress());
    });

    it("Should prevent upgrade to invalid implementation", async function () {
      const { ykaToken, owner } = await loadFixture(deployFixture);
      const invalidAddress = "0x0000000000000000000000000000000000000001";

      const YKATokenV2Factory = await ethers.getContractFactory("MockYKATokenV2");
      await expect(
        upgrades.validateUpgrade(await ykaToken.getAddress(), YKATokenV2Factory, { kind: "uups" })
      ).to.not.be.reverted;

      // Try to upgrade to an invalid address (this should be caught by OpenZeppelin Upgrades)
      // Try to interact with an invalid implementation
      // Create a contract factory with the specific function we want to test
      const proxyInterface = new ethers.Interface([
        "function upgradeTo(address newImplementation)"
      ]);

      const proxyContract = new ethers.Contract(
        await ykaToken.getAddress(),
        proxyInterface,
        owner
      );

      // Attempt to upgrade to an invalid address
      await expect(
        proxyContract.upgradeTo(invalidAddress)
      ).to.be.reverted;
    });
  });
});