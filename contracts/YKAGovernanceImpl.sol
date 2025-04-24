// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./YKAGovernance.sol";
import {IGovernorUpgradeable} from "@openzeppelin/contracts-upgradeable/governance/IGovernorUpgradeable.sol";
import {GovernorCountingSimpleUpgradeable} from "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorCountingSimpleUpgradeable.sol";
import {GovernorUpgradeable} from "@openzeppelin/contracts-upgradeable/governance/GovernorUpgradeable.sol";

contract YKAGovernanceImpl is GovernorCountingSimpleUpgradeable, YKAGovernance {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @custom:oz-upgrades-validate-as-initializer
    function initialize(
        address _token,
        address _timelock
    ) public override initializer {
        // Initialize all parent contracts in the correct order
        __Governor_init("YKAGovernance");
        __GovernorCountingSimple_init();
        __GovernorVotes_init(IVotesUpgradeable(_token));
        __GovernorTimelockControl_init(
            TimelockControllerUpgradeable(payable(_timelock))
        );
        __UUPSUpgradeable_init();
    }

    // COUNTING_MODE must be defined as pure.
    function COUNTING_MODE()
        public
        pure
        override(GovernorCountingSimpleUpgradeable, IGovernorUpgradeable)
        returns (string memory)
    {
        return "support=bravo";
    }

    // Override _quorumReached with actual implementation
    function _quorumReached(uint256 proposalId)
        internal
        view
        override(GovernorCountingSimpleUpgradeable, GovernorUpgradeable)
        returns (bool)
    {
        return super._quorumReached(proposalId);
    }

    // Override _voteSucceeded with actual implementation
    function _voteSucceeded(uint256 proposalId)
        internal
        view
        override(GovernorCountingSimpleUpgradeable, GovernorUpgradeable)
        returns (bool)
    {
        return super._voteSucceeded(proposalId);
    }

    // Implement hasVoted with actual logic
    function hasVoted(uint256 proposalId, address account)
        public
        view
        override(IGovernorUpgradeable, GovernorCountingSimpleUpgradeable)
        returns (bool)
    {
        return super.hasVoted(proposalId, account);
    }

    // Provide a concrete proposalThreshold
    function proposalThreshold() public pure override returns (uint256) {
        return 1000e18; // 1000 tokens
    }

    // Override _cancel required by base contracts
    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(GovernorUpgradeable, YKAGovernance) returns (uint256) {
        return YKAGovernance._cancel(targets, values, calldatas, descriptionHash);
    }

    // Override _execute required by base contracts
    function _execute(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(GovernorUpgradeable, YKAGovernance) {
        YKAGovernance._execute(proposalId, targets, values, calldatas, descriptionHash);
    }

    // Override _executor required by base contracts
    function _executor()
        internal
        view
        override(GovernorUpgradeable, YKAGovernance)
        returns (address)
    {
        return YKAGovernance._executor();
    }

    // Override castVoteWithReason required by base contracts
    function castVoteWithReason(
        uint256 proposalId,
        uint8 support,
        string calldata reason
    ) public override(GovernorUpgradeable, YKAGovernance) returns (uint256) {
        return YKAGovernance.castVoteWithReason(proposalId, support, reason);
    }

    // Override propose required by base contracts
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public override(GovernorUpgradeable, YKAGovernance) returns (uint256) {
        return YKAGovernance.propose(targets, values, calldatas, description);
    }

    // Override state required by base contracts
    function state(uint256 proposalId)
        public
        view
        override(GovernorUpgradeable, YKAGovernance)
        returns (ProposalState)
    {
        return YKAGovernance.state(proposalId);
    }

    // Override supportsInterface required by base contracts
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(GovernorUpgradeable, YKAGovernance)
        returns (bool)
    {
        return YKAGovernance.supportsInterface(interfaceId);
    }
}
