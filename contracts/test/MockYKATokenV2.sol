// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../YKAToken.sol";

contract MockYKATokenV2 is YKAToken {
    /**
     * @dev Override version function to test upgrades
     */
    function version() public view virtual override returns (uint256) {
        return _version;
    }

    // Add a new function to test upgrade success
    function setVersion(uint256 newVersion) external onlyOwner {
        _version = newVersion;
    }

    // Override initialize but ensure proper initialization chain
    function initialize(
        uint256 _initialSupply,
        address _initialOwner
    ) public virtual override initializer {
        super.initialize(_initialSupply, _initialOwner);
        _version = 2; // Set version to 2 for V2
    }
}