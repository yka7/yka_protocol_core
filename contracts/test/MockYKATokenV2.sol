// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../YKAToken.sol";

contract MockYKATokenV2 is YKAToken {
    /**
     * @dev Returns the current version of the contract
     */
    function version() public view virtual returns (uint256) {
        return _version + 1; // Simple modification for testing
    }

    // Add a new function to test upgrade success
    function setVersion(uint256 newVersion) external onlyOwner {
        _version = newVersion;
    }

    // Override initialize but ensure proper initialization chain
    function initialize(
        uint256 _initialSupply,
        address _initialOwner
    ) public override reinitializer(2) {
        super.initialize(_initialSupply, _initialOwner);
        _version = 2; // Set version to 2 for V2
    }
}