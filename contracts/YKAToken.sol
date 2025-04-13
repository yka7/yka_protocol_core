// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28; // Specify the Solidity version

// Import necessary OpenZeppelin contracts
import {ERC20PermitUpgradeable} from "openzeppelin-contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import {ERC20BurnableUpgradeable} from "openzeppelin-contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import {OwnableUpgradeable} from "openzeppelin-contracts-upgradeable/access/OwnableUpgradeable.sol";
import {Initializable} from "openzeppelin-contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title YKAToken
 * @dev This contract implements the YKA ERC20 token.
 * It is based on OpenZeppelin's ERC20 implementation with extensions:
 * - ERC20Burnable: Allows tokens to be destroyed (burned).
 * - ERC20Permit: Allows approvals via signatures (gasless approvals).
 * - Ownable: Provides basic access control mechanism.
 * - Initializable: Designed for use with upgradeable proxies.
 */
contract YKAToken is
    Initializable, // Allows the contract to be initialized after deployment (for proxies)
    ERC20PermitUpgradeable, // Inherits ERC20 standard, adds permit functionality
    ERC20BurnableUpgradeable, // Adds burn functionality
    OwnableUpgradeable // Adds ownership control
{
    // --- State Variables ---

    // (No additional state variables needed beyond those inherited)

    // --- Errors ---

    /// @dev Error thrown if the zero address is provided where it's not allowed.
    error ZeroAddress();

    // --- Events ---

    // (Inherits events from ERC20, Ownable)

    // --- Initializer ---

    /**
     * @notice Initializes the contract after deployment (for upgradeable proxies).
     * @dev Sets the token name, symbol, initial supply, and owner.
     * @param _initialSupply The total amount of tokens to mint initially.
     * @param _initialOwner The address that will receive the initial supply and own the contract.
     */
    function initialize(
        uint256 _initialSupply,
        address _initialOwner
    )
        public
        initializer // Modifier to ensure this function is called only once
    {
        if (_initialOwner == address(0)) revert ZeroAddress();

        // Initialize inherited contracts
        __ERC20_init("YKA Token", "YKA"); // Set token name and symbol
        __ERC20Burnable_init(); // Initialize burnable extension
        __Ownable_init(_initialOwner); // Set the initial owner
        __ERC20Permit_init("YKA Token"); // Initialize permit extension with the token name

        // Mint the initial supply to the specified owner
        _mint(_initialOwner, _initialSupply);
    }

    // --- Internal Functions ---

    /**
     * @dev Overrides the default _update function to potentially add custom logic
     * before token transfers, approvals, minting, or burning.
     * Currently, it just calls the parent implementation.
     * @param from Sender address.
     * @param to Recipient address.
     * @param value Amount of tokens.
     */
    function _update(
        address from,
        address to,
        uint256 value
    )
        internal
        override(
            ERC20Upgradeable,
            ERC20PermitUpgradeable // Specify which parent functions are overridden
        )
    {
        super._update(from, to, value);
    }

    /**
     * @dev Hook that is called before any token transfer. This includes minting
     * and burning.
     *
     * Requirements:
     *
     * - When `from` and `to` are both non-zero, `amount` of ``from``'s tokens
     * must be to `to`.
     * - When `from` is zero, `amount` tokens must be minted to `to`.
     * - When `to` is zero, `amount` of ``from``'s tokens must be burned.
     * - `from` and `to` are never both zero.
     *
     * NOTE: This function is internal and can be overridden by derived contracts.
     * Currently, it does nothing beyond the standard ERC20 checks.
     */
    // function _beforeTokenTransfer(address from, address to, uint256 amount)
    //     internal
    //     override(ERC20Upgradeable)
    // {
    //     super._beforeTokenTransfer(from, to, amount);
    //     // Add custom logic here if needed before transfers
    // }

    // --- Public/External Functions ---

    // (Inherits standard ERC20 functions like transfer, approve, balanceOf, etc.)
    // (Inherits burn functions from ERC20Burnable)
    // (Inherits permit function from ERC20Permit)
    // (Inherits ownership functions like transferOwnership, renounceOwnership from Ownable)

    // --- Versioning for UUPS Proxy ---
    // Required for UUPS upgradeability pattern
    // function _authorizeUpgrade(address newImplementation) internal override onlyOwner {} // Uncomment and implement if using UUPS

    // --- Reserved Storage Space for Upgrades ---
    // Prevents storage collisions when upgrading
    uint256[49] private __gap; // Reserve storage slots for future upgrades
}
