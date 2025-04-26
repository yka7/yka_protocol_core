// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Import necessary OpenZeppelin contracts
import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {ERC20PermitUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import {ERC20BurnableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import {ERC20VotesUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20VotesUpgradeable.sol";
import {Ownable2StepUpgradeable} from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract YKAToken is
    Initializable,
    ERC20Upgradeable,
    ERC20PermitUpgradeable,
    ERC20BurnableUpgradeable,
    ERC20VotesUpgradeable,
    Ownable2StepUpgradeable,
    UUPSUpgradeable
{
    // --- State Variables ---
    uint256 internal _version;

    // --- Errors ---
    error ZeroAddress();
    error OwnableUnauthorizedAccount(address account);
    error OwnableInvalidOwner(address owner);
    error ERC20InsufficientAllowance();
    error ERC20InsufficientBalance();
    error BatchParamsInvalid();

    // --- Initializer ---
    function initialize(
        uint256 _initialSupply,
        address _initialOwner
    ) public virtual initializer {
        if (_initialOwner == address(0)) revert OwnableInvalidOwner(_initialOwner);

        __ERC20_init("YKA Token", "YKA");
        __ERC20Permit_init("YKA Token");
        __ERC20Burnable_init();
        __ERC20Votes_init();
        __Ownable2Step_init(); // Use Ownable2Step directly
        __UUPSUpgradeable_init();

        _version = 1;

        // Transfer ownership to _initialOwner
        transferOwnership(_initialOwner);

        // Mint initial supply
        _mint(_initialOwner, _initialSupply);
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}

    // Override transferFrom to provide custom error for insufficient allowance
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public virtual override returns (bool) {
        if (recipient == address(0)) revert ZeroAddress();
        uint256 currentAllowance = allowance(sender, _msgSender());
        if (currentAllowance < amount) revert ERC20InsufficientAllowance();
        if (balanceOf(sender) < amount) revert ERC20InsufficientBalance();
        return super.transferFrom(sender, recipient, amount);
    }

    function transfer(
        address recipient,
        uint256 amount
    ) public virtual override returns (bool) {
        if (recipient == address(0)) revert ZeroAddress();
        if (balanceOf(_msgSender()) < amount) revert ERC20InsufficientBalance();
        return super.transfer(recipient, amount);
    }

    // Required overrides by ERC20Votes
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20Upgradeable, ERC20VotesUpgradeable) {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(address to, uint256 amount)
        internal
        override(ERC20Upgradeable, ERC20VotesUpgradeable)
    {
        super._mint(to, amount);
    }

    function _burn(address account, uint256 amount)
        internal
        override(ERC20Upgradeable, ERC20VotesUpgradeable)
    {
        super._burn(account, amount);
    }

    // --- Polygon Optimized Functions ---
    function batchTransfer(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external returns (bool) {
        uint256 length = recipients.length;
        if (length == 0 || length != amounts.length) revert BatchParamsInvalid();

        address sender = _msgSender();
        uint256 totalAmount;

        assembly {
            let i := 0
            let amountsOffset := amounts.offset
            for {} lt(i, length) {} {
                totalAmount := add(totalAmount, calldataload(add(amountsOffset, mul(i, 0x20))))
                i := add(i, 1)
            }
        }

        if (balanceOf(sender) < totalAmount) revert ERC20InsufficientBalance();

        for (uint256 i = 0; i < length;) {
            address recipient = recipients[i];
            if (recipient == address(0)) revert ZeroAddress();
            _transfer(sender, recipient, amounts[i]);
            unchecked { ++i; }

            if (i > 0 && i % 100 == 0 && i < length) {
                emit BatchProcessed(i, length);
            }
        }

        return true;
    }

    event BatchProcessed(uint256 processed, uint256 total);

    function batchTransferFrom(
        address sender,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external returns (bool) {
        uint256 length = recipients.length;
        if (length == 0 || length != amounts.length) revert BatchParamsInvalid();

        address spender = _msgSender();
        uint256 totalAmount;

        assembly {
            let i := 0
            let amountsOffset := amounts.offset
            for {} lt(i, length) {} {
                totalAmount := add(totalAmount, calldataload(add(amountsOffset, mul(i, 0x20))))
                i := add(i, 1)
            }
        }

        if (allowance(sender, spender) < totalAmount) revert ERC20InsufficientAllowance();
        if (balanceOf(sender) < totalAmount) revert ERC20InsufficientBalance();

        for (uint256 i = 0; i < length;) {
            address recipient = recipients[i];
            if (recipient == address(0)) revert ZeroAddress();
            _transfer(sender, recipient, amounts[i]);
            unchecked { ++i; }

            if (i > 0 && i % 100 == 0 && i < length) {
                emit BatchProcessed(i, length);
            }
        }

        _approve(sender, spender, allowance(sender, spender) - totalAmount);

        return true;
    }

    // --- Reserved Storage Space for Upgrades ---
    uint256[46] private __gap;
}
