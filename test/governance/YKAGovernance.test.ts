import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import type { YKAGovernanceImpl } from '../../typechain-types/contracts/YKAGovernanceImpl';
import type { YKAToken } from '../../typechain-types/contracts/YKAToken';

describe("YKAGovernance", () => {
    let governance: YKAGovernanceImpl;
    let token: YKAToken;
    let timelock: any; // 型をanyに変更
    let owner: HardhatEthersSigner;
    let addr1: HardhatEthersSigner;
    let addr2: HardhatEthersSigner;
    let addrs: HardhatEthersSigner[];

    beforeEach(async () => {
        // ... (既存のコード)
    });

    // ... (既存のテストケース)
});