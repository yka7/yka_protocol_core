// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28; // Specify the Solidity version

// Import necessary OpenZeppelin contracts
import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {ERC20PermitUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import {ERC20BurnableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol"; // Import UUPSUpgradeable

/**
 * @title YKAToken
 * @dev This contract implements the YKA ERC20 token.
 * It is based on OpenZeppelin's ERC20 implementation with extensions:
 * - ERC20Burnable: Allows tokens to be destroyed (burned).
 * - ERC20Permit: Allows approvals via signatures (gasless approvals).
 * - Ownable: Provides basic access control mechanism.
 * - Initializable: Designed for use with upgradeable proxies.
 * - UUPSUpgradeable: Enables UUPS proxy pattern for upgrades.
 */
contract YKAToken is
    Initializable, // Allows the contract to be initialized after deployment (for proxies)
    ERC20PermitUpgradeable, // Inherits ERC20 standard, adds permit functionality
    ERC20BurnableUpgradeable, // Adds burn functionality
    OwnableUpgradeable, // Adds ownership control
    UUPSUpgradeable // Enables UUPS upgrade mechanism
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
     * Can only be called once.
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

        // Initialize inherited contracts in the correct order
        __ERC20_init("YKA Token", "YKA"); // Set token name and symbol
        __ERC20Permit_init("YKA Token"); // Initialize permit extension with the token name
        __ERC20Burnable_init(); // Initialize burnable extension
        __Ownable_init(_initialOwner); // Set the initial owner
        __UUPSUpgradeable_init(); // Initialize UUPS upgradeable

        // Mint initial supply to the owner
        _mint(_initialOwner, _initialSupply);
    }

    // --- Internal Functions ---

    /**
     * @dev Overrides the default _update function from both ERC20Upgradeable and ERC20PermitUpgradeable.
     * This is necessary when inheriting from multiple contracts that define the same function.
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
        override(ERC20Upgradeable)
    {
        super._update(from, to, value);
    }

    /**
     * @dev Hook that is called before any token transfer.
     * (Inherited from ERC20Upgradeable)
     * Currently, no additional logic is added here.
     */
    // function _beforeTokenTransfer(address from, address to, uint256 amount)
    //     internal
    //     override(ERC20Upgradeable)
    // {
    //     super._beforeTokenTransfer(from, to, amount);
    //     // Add custom logic here if needed
    // }

    // --- UUPS Upgrade Authorization ---

    /**
     * @dev Authorizes an upgrade to a new implementation contract.
     * Only the current owner (as defined by OwnableUpgradeable) can authorize an upgrade.
     * @param newImplementation The address of the new implementation contract.
     */
    function _authorizeUpgrade(address newImplementation)
        internal
        override // Override the function from UUPSUpgradeable
        onlyOwner // Restrict access to the owner
    {} // Empty implementation means only the owner can upgrade

    // --- Public/External Functions ---

    // (Inherits standard ERC20 functions like transfer, approve, balanceOf, etc.)
    // (Inherits burn functions from ERC20Burnable)
    // (Inherits permit function from ERC20Permit)
    // (Inherits ownership functions like transferOwnership, renounceOwnership from Ownable)
    // (Inherits upgrade functions like upgradeTo from UUPSUpgradeable)

    // --- Reserved Storage Space for Upgrades ---
    // Prevents storage collisions when upgrading
    // The number of slots should be sufficient to avoid collisions with future inherited contracts.
    // OpenZeppelin calculates this based on inheritance, but 50 is usually safe.
    uint256[49] private __gap; // Reserve storage slots for future upgrades
}
