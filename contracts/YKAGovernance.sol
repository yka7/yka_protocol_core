// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {GovernorUpgradeable} from "@openzeppelin/contracts-upgradeable/governance/GovernorUpgradeable.sol";
import {GovernorVotesUpgradeable} from "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorVotesUpgradeable.sol";
import {GovernorTimelockControlUpgradeable} from "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorTimelockControlUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {IVotesUpgradeable} from "@openzeppelin/contracts-upgradeable/governance/utils/IVotesUpgradeable.sol";
import {TimelockControllerUpgradeable} from "@openzeppelin/contracts-upgradeable/governance/TimelockControllerUpgradeable.sol";
import {IGovernorUpgradeable} from "@openzeppelin/contracts-upgradeable/governance/IGovernorUpgradeable.sol";

/**
 * @title YKAGovernance
 * @dev YKAトークンのガバナンス機能を提供するコントラクト
 * OpenZeppelinのGovernorをベースに、アップグレード可能な設計を採用
 */
abstract contract YKAGovernance is
    Initializable,
    GovernorUpgradeable,
    GovernorVotesUpgradeable,
    GovernorTimelockControlUpgradeable,
    UUPSUpgradeable
{
    /// @custom:storage-location erc7201:yka.governance.storage
    struct YKAGovernanceStorage {
        // 提案データ構造
        mapping(uint256 => ProposalDetails) _proposalDetails;
        // 委任トラッキング
        mapping(address => address) _delegates;
    }

    // カスタムストレージスロット
    bytes32 private constant STORAGE_LOCATION =
        bytes32(uint256(keccak256("yka.governance.storage")) - 1);

    struct ProposalDetails {
        address proposer;
        uint256 startBlock;
        uint256 endBlock;
        bool executed;
        mapping(address => Vote) votes;
    }

    struct Vote {
        bool hasVoted;
        bool support;
        uint256 votes;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev コントラクトの初期化
     * @param _token 投票トークンのアドレス
     * @param _timelock タイムロックコントローラーのアドレス
     */
    /// @custom:oz-upgrades-validate-as-initializer
    function initialize(
        address _token,
        address _timelock
    ) public virtual initializer {
        __Governor_init("YKAGovernance");
        __GovernorVotes_init(IVotesUpgradeable(_token));
        __GovernorTimelockControl_init(
            TimelockControllerUpgradeable(payable(_timelock))
        );
        __UUPSUpgradeable_init();
    }

    /**
     * @dev 投票遅延期間の設定
     * @return 投票開始までのブロック数
     */
    function votingDelay() public pure virtual override returns (uint256) {
        return 1 days / 12; // 約1日（12秒/ブロックと仮定）
    }

    /**
     * @dev 投票期間の設定
     * @return 投票期間のブロック数
     */
    function votingPeriod() public pure virtual override returns (uint256) {
        return 7 days / 12; // 約1週間
    }

    /**
     * @dev 定足数の設定
     * @param totalSupply トークンの総供給量
     * @return 必要な最小投票数
     */
    function quorum(uint256 totalSupply)
        public
        pure
        virtual
        override
        returns (uint256)
    {
        return (totalSupply * 4) / 100; // 4%
    }

    /**
     * @dev アップグレード権限のチェック
     * @param newImplementation 新しい実装コントラクトのアドレス
     */
    function _authorizeUpgrade(address newImplementation)
        internal
        virtual
        override
    {
        // ガバナンスコントラクト自身のみがアップグレードを許可
        require(
            msg.sender == address(this),
            "YKAGovernance: unauthorized upgrade"
        );
    }

    /**
     * @dev プロポーザルの状態を確認
     * @param proposalId プロポーザルID
     * @return プロポーザルの状態
     */
    function state(uint256 proposalId)
        public
        view
        virtual
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
        returns (ProposalState)
    {
        ProposalDetails storage details = _getStorage()._proposalDetails[proposalId];

        if (details.executed) {
            return ProposalState.Executed;
        }

        return super.state(proposalId);
    }

    /**
     * @dev 提案のキャンセル
     */
    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    )
        internal
        virtual
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
        returns (uint256)
    {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    /**
     * @dev 提案の実行
     */
    function _execute(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    )
        internal
        virtual
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
    {
        super._execute(proposalId, targets, values, calldatas, descriptionHash);

        ProposalDetails storage details = _getStorage()._proposalDetails[proposalId];
        details.executed = true;
    }

    /**
     * @dev 実行者アドレスの取得
     */
    function _executor()
        internal
        view
        virtual
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
        returns (address)
    {
        return super._executor();
    }

    /**
     * @dev カスタムストレージの取得
     */
    function _getStorage() private pure returns (YKAGovernanceStorage storage s) {
        bytes32 slot = STORAGE_LOCATION;
        assembly {
            s.slot := slot
        }
    }

    /**
     * @dev 提案作成後の処理
     */
    function _afterCreate(uint256 proposalId, address proposer)
        internal
        virtual
    {
        ProposalDetails storage details = _getStorage()._proposalDetails[proposalId];
        details.proposer = proposer;
        details.startBlock = proposalSnapshot(proposalId);
        details.endBlock = proposalDeadline(proposalId);
    }

    /**
     * @dev 投票の実行
     * @param proposalId 提案ID
     * @param support 賛成・反対・棄権
     * @param reason 投票理由（オプション）
     */
    function castVoteWithReason(
        uint256 proposalId,
        uint8 support,
        string calldata reason
    )
        public
        virtual
        override(IGovernorUpgradeable, GovernorUpgradeable)
        returns (uint256)
    {
        uint256 weight = super.castVoteWithReason(
            proposalId,
            support,
            reason
        );

        ProposalDetails storage details = _getStorage()._proposalDetails[proposalId];
        Vote storage vote = details.votes[msg.sender];
        vote.hasVoted = true;
        vote.support = support == 1;
        vote.votes = weight;

        return weight;
    }

    /**
     * @dev 委任先の設定
     * @param delegatee 委任先アドレス
     */
    function delegate(address delegatee) public {
        require(
            delegatee != address(0),
            "YKAGovernance: invalid delegatee"
        );
        _getStorage()._delegates[msg.sender] = delegatee;
        emit DelegateChanged(
            msg.sender,
            _getStorage()._delegates[msg.sender],
            delegatee
        );
    }

    /**
     * @dev 委任先の取得
     * @param delegator 委任元アドレス
     * @return 委任先アドレス
     */
    function delegates(address delegator)
        public
        view
        returns (address)
    {
        return _getStorage()._delegates[delegator];
    }

    /**
     * @dev proposal作成時のバリデーション
     */
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    )
        public
        virtual
        override(IGovernorUpgradeable, GovernorUpgradeable)
        returns (uint256)
    {
        require(
            getVotes(msg.sender, (block.number - 1)) >= proposalThreshold(),
            "YKAGovernance: proposer votes below threshold"
        );

        uint256 proposalId = super.propose(
            targets,
            values,
            calldatas,
            description
        );
        _afterCreate(proposalId, msg.sender);
        return proposalId;
    }

    /**
     * @dev インターフェースサポートの確認
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // イベント定義
    event DelegateChanged(
        address indexed delegator,
        address indexed fromDelegate,
        address indexed toDelegate
    );
}