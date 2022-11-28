// SPDX-License-Identifier: MIT

pragma solidity 0.8.13;

import "@openzeppelin/contracts/security/Pausable.sol";
//import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ExoticToken is ERC20, Pausable {
    constructor(uint256 initialSupply) ERC20("Exotic Token", "EXT") {
        _mint(msg.sender, initialSupply);
    }

    // These functions should have restricted access
    // but they are available to the public for testing reasons.
    function mint(address to, uint256 amount) external returns (bool) {
        _mint(to, amount);
        return true;
    }

    function burn(address from, uint256 amount) external returns (bool) {
        _burn(from, amount);
        return true;
    }

    function setPaused() external {
        paused() ? _unpause() : _pause();
    }

    //

    function _transfer(
        address from,
        address to,
        uint256 value
    ) internal override {
        _requireNotPaused();
        super._transfer(from, to, value);
    }

    function _approve(
        address owner,
        address spender,
        uint256 amount
    ) internal override {
        _requireNotPaused();
        super._approve(owner, spender, amount);
    }
}
