// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Import necessary OpenZeppelin contracts
import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {ERC20PermitUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import {ERC20BurnableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import {ERC20VotesUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20VotesUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title YKAToken
 * @dev This contract implements the YKA ERC20 token.
 * It is based on OpenZeppelin's ERC20 implementation with extensions:
 * - ERC20Burnable: Allows tokens to be destroyed (burned).
 * - ERC20Permit: Allows approvals via signatures (gasless approvals).
 * - ERC20Votes: Provides voting functionality for governance.
 * - Ownable: Provides basic access control mechanism.
 * - Initializable: Designed for use with upgradeable proxies.
 * - UUPSUpgradeable: Enables UUPS proxy pattern for upgrades.
 */
contract YKAToken is
    Initializable,
    ERC20Upgradeable,
    ERC20PermitUpgradeable,
    ERC20BurnableUpgradeable,
    ERC20VotesUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    // --- State Variables ---

    // Storage variables
    uint256 internal _version;

    /**
     * @dev Returns the current version of the contract
     */
    function version() public virtual view returns (uint256) {
        return _version;
    }

    // --- Errors ---

    /// @dev Error thrown if the zero address is provided where it's not allowed.
    error ZeroAddress();
    /// @dev Error thrown when an unauthorized account attempts an owner-restricted operation.
    error OwnableUnauthorizedAccount(address account);
    /// @dev Error thrown when an invalid owner address is provided.
    error OwnableInvalidOwner(address owner);
    /// @dev Error thrown when transfer amount exceeds allowance.
    error ERC20InsufficientAllowance();

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
        virtual
        initializer
    {
        if (_initialOwner == address(0)) revert ZeroAddress();

        // Initialize inherited contracts in the correct order
        __ERC20_init("YKA Token", "YKA"); // Set token name and symbol
        __ERC20Permit_init("YKA Token"); // Initialize permit extension with the token name
        __ERC20Burnable_init(); // Initialize burnable extension
        __ERC20Votes_init();    // Initialize votes extension
        _version = 1; // Set initial version

        __Ownable_init(); // Set the initial owner (no argument in recent versions)
        __UUPSUpgradeable_init(); // Initialize UUPS upgradeable

        // Transfer ownership to the specified initial owner
        transferOwnership(_initialOwner);

        // Mint initial supply to the owner
        _mint(_initialOwner, _initialSupply);
    }

    /**
     * @dev Authorizes an upgrade to a new implementation contract.
     * Only the current owner (as defined by OwnableUpgradeable) can authorize an upgrade.
     * @param newImplementation The address of the new implementation contract.
     */
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {
        // Empty implementation: the onlyOwner modifier is sufficient
    }

    // --- Overridden transferFrom with custom allowance error ---

    /**
     * @dev Overrides ERC20Upgradeable's transferFrom to provide a custom error when allowance is insufficient.
     */
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    )
        public
        virtual
        override
        returns (bool)
    {
        uint256 currentAllowance = allowance(sender, _msgSender());
        if (currentAllowance < amount) revert ERC20InsufficientAllowance();
        return super.transferFrom(sender, recipient, amount);
    }

    // --- Additional functions required by ERC20Votes ---

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20Upgradeable, ERC20VotesUpgradeable) {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(
        address to,
        uint256 amount
    ) internal override(ERC20Upgradeable, ERC20VotesUpgradeable) {
        super._mint(to, amount);
    }

    function _burn(
        address account,
        uint256 amount
    ) internal override(ERC20Upgradeable, ERC20VotesUpgradeable) {
        super._burn(account, amount);
    }

    // --- Public/External Functions ---
    // (Inherits standard ERC20 functions like transfer, approve, balanceOf, etc.)
    // (Inherits burn functions from ERC20BurnableUpgradeable)
    // (Inherits permit function from ERC20PermitUpgradeable)
    // (Inherits ownership functions like transferOwnership, renounceOwnership from OwnableUpgradeable)
    // (Inherits upgrade functions like upgradeTo from UUPSUpgradeable)

    // --- Reserved Storage Space for Upgrades ---
    // Prevents storage collisions when upgrading
    // The number of slots should be sufficient to avoid collisions with future inherited contracts.
    // OpenZeppelin calculates this based on inheritance, but 50 is usually safe.
    uint256[46] private __gap;
}
