import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import type { YKAGovernanceImpl } from '../../typechain-types/contracts/YKAGovernanceImpl';
import type { YKAToken } from '../../typechain-types/contracts/YKAToken';
import type { TimelockController } from '../../typechain-types/contracts/governance/TimelockController';
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("YKAGovernance", () => {
    let governance: YKAGovernanceImpl;
    let token: YKAToken;
    let timelock: TimelockController;
    let owner: HardhatEthersSigner;
    let addr1: HardhatEthersSigner;
    let addr2: HardhatEthersSigner;
    let addrs: HardhatEthersSigner[];

    const INITIAL_SUPPLY = ethers.parseEther("10000000");
    const VOTING_TOKENS = ethers.parseEther("1000000");
    const PROPOSAL_DESCRIPTION = "Proposal #1: Transfer tokens";
    const VOTING_DELAY = 1n;
    const VOTING_PERIOD = 5n;
    const MIN_DELAY = 1;

    beforeEach(async () => {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

        // Deploy YKAToken
        const YKAToken = await ethers.getContractFactory("YKAToken");
        token = await upgrades.deployProxy(YKAToken, [INITIAL_SUPPLY, owner.address]) as YKAToken;
        await token.waitForDeployment();

        // Deploy TimelockController
        const TimelockController = await ethers.getContractFactory("TimelockController");
        timelock = await upgrades.deployProxy(TimelockController, [
            MIN_DELAY,
            [owner.address], // Proposers
            [owner.address], // Executors
            owner.address // Admin
        ]) as TimelockController;
        await timelock.waitForDeployment();

        // Deploy YKAGovernance
        const YKAGovernance = await ethers.getContractFactory("YKAGovernanceImpl");
        governance = await upgrades.deployProxy(YKAGovernance, [
            await token.getAddress(),
            await timelock.getAddress()
        ]) as YKAGovernanceImpl;
        await governance.waitForDeployment();

        // Grant roles in TimelockController
        const proposerRole = await timelock.PROPOSER_ROLE();
        const executorRole = await timelock.EXECUTOR_ROLE();

        await timelock.grantRole(proposerRole, await governance.getAddress());
        await timelock.grantRole(executorRole, ethers.ZeroAddress); // Everyone can execute

        // Transfer tokens to timelock
        await token.transfer(await timelock.getAddress(), VOTING_TOKENS);

        // Transfer tokens to addr1 and addr2 for voting
        await token.transfer(addr1.address, VOTING_TOKENS);
        await token.transfer(addr2.address, VOTING_TOKENS);

        // Delegate voting power
        await token.delegate(owner.address);
        await token.connect(addr1).delegate(addr1.address);
        await token.connect(addr2).delegate(addr2.address);

        // Ensure delegations are active
        await ethers.provider.send("evm_mine", []);
    });

    describe("Governance Setup", () => {
        it("should set correct token and timelock addresses", async () => {
            expect(await governance.token()).to.equal(await token.getAddress());
            expect(await governance.timelock()).to.equal(await timelock.getAddress());
        });

        it("should have correct voting delay and period", async () => {
            expect(await governance.votingDelay()).to.equal(VOTING_DELAY);
            expect(await governance.votingPeriod()).to.equal(VOTING_PERIOD);
        });
    });

    describe("Proposal Creation and Voting", () => {
        let proposalId: bigint;

        beforeEach(async () => {
            // Create a proposal to transfer tokens
            const transferAmount = ethers.parseEther("1000");
            const tokenInterface = new ethers.Interface([
                "function transfer(address to, uint256 amount)"
            ]);
            const calldata = tokenInterface.encodeFunctionData("transfer", [addr1.address, transferAmount]);

            const targets = [await token.getAddress()];
            const values = [0n];
            const calldatas = [calldata];

            // Check proposal threshold
            const proposalThreshold = await governance.proposalThreshold();
            const ownerBalance = await token.balanceOf(owner.address);
            expect(ownerBalance >= proposalThreshold).to.be.true;

            const tx = await governance.propose(
                targets,
                values,
                calldatas,
                PROPOSAL_DESCRIPTION
            );

            const receipt = await tx.wait();
            if (!receipt) throw new Error("No receipt found");

            const event = receipt.logs.find(
                (log) => (log as any).eventName === "ProposalCreated"
            );
            if (!event || !(event as any).args) throw new Error("ProposalCreated event not found");
            proposalId = (event as any).args[0];
        });

        it("should create a proposal successfully", async () => {
            expect(await governance.state(proposalId)).to.equal(0n); // Pending state
            await time.increase(Number(VOTING_DELAY));
            await ethers.provider.send("evm_mine", []);
            expect(await governance.state(proposalId)).to.equal(1n); // Active state
        });

        it("should allow voting on proposal", async () => {
            await time.increase(Number(VOTING_DELAY));
            await ethers.provider.send("evm_mine", []);
            await governance.connect(addr1).castVote(proposalId, 1);
            const hasVoted = await governance.hasVoted(proposalId, addr1.address);
            expect(hasVoted).to.be.true;
        });

        it("should track voting power correctly", async () => {
            await time.increase(Number(VOTING_DELAY));
            await ethers.provider.send("evm_mine", []);
            await governance.connect(addr1).castVote(proposalId, 1);
            const proposal = await governance.proposalVotes(proposalId);
            expect(proposal.forVotes).to.equal(VOTING_TOKENS);
        });

        it("should reject double voting", async () => {
            await time.increase(Number(VOTING_DELAY));
            await ethers.provider.send("evm_mine", []);
            await governance.connect(addr1).castVote(proposalId, 1);
            await expect(
                governance.connect(addr1).castVote(proposalId, 1)
            ).to.be.rejectedWith("GovernorVotingSimple: vote already cast");
        });
    });

    describe("Proposal Execution", () => {
        let proposalId: bigint;
        let descHash: string;
        let targets: string[];
        let values: bigint[];
        let calldatas: string[];
        const transferAmount = ethers.parseEther("1000");

        beforeEach(async () => {
            // Create a proposal to transfer tokens
            const tokenInterface = new ethers.Interface([
                "function transfer(address to, uint256 amount)"
            ]);
            const calldata = tokenInterface.encodeFunctionData("transfer", [addr1.address, transferAmount]);

            targets = [await token.getAddress()];
            values = [0n];
            calldatas = [calldata];
            descHash = ethers.id(PROPOSAL_DESCRIPTION);

            const tx = await governance.propose(targets, values, calldatas, PROPOSAL_DESCRIPTION);
            const receipt = await tx.wait();
            if (!receipt) throw new Error("No receipt found");

            const event = receipt.logs.find((log) => (log as any).eventName === "ProposalCreated");
            if (!event || !(event as any).args) throw new Error("ProposalCreated event not found");
            proposalId = (event as any).args[0];

            await time.increase(Number(VOTING_DELAY));
            await ethers.provider.send("evm_mine", []);
        });

        it("should execute successful proposal", async () => {
            // Record initial balance
            const initialBalance = await token.balanceOf(addr1.address);

            // Cast votes with enough voting power
            await governance.connect(owner).castVote(proposalId, 1);
            await governance.connect(addr1).castVote(proposalId, 1);
            await governance.connect(addr2).castVote(proposalId, 1);

            // Skip voting period
            await time.increase(Number(VOTING_PERIOD));
            await ethers.provider.send("evm_mine", []);

            // Check proposal state
            const stateAfterVoting = await governance.state(proposalId);
            console.log("Proposal state after voting:", stateAfterVoting.toString());

            // Queue the proposal
            await governance.queue(targets, values, calldatas, descHash);
            console.log("Proposal queued");

            // Skip timelock delay
            await time.increase(MIN_DELAY);
            await ethers.provider.send("evm_mine", []);

            // Execute the proposal
            await governance.execute(targets, values, calldatas, descHash);
            console.log("Proposal executed");

            // Verify execution
            expect(await governance.state(proposalId)).to.equal(7n); // Executed state
            expect(await token.balanceOf(addr1.address)).to.equal(initialBalance + transferAmount);
        });
    });
});