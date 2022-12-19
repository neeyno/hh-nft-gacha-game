// SPDX-License-Identifier: MIT

pragma solidity 0.8.13;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ExoticToken is ERC20, Ownable, Pausable {
    uint256 private constant AMOUNT_TOKEN_PACK = 1421e18;

    constructor() ERC20("Exotic Token", "EXT") {
        _pause();
    }

    function mint(address to) external onlyOwner returns (bool) {
        _mint(to, AMOUNT_TOKEN_PACK);
        return true;
    }

    function burn(address from, uint256 amount) external onlyOwner returns (bool) {
        _burn(from, amount);
        return true;
    }

    function setPaused() external onlyOwner returns (bool) {
        paused() ? _unpause() : _pause();
        return paused();
    }

    function _transfer(address from, address to, uint256 value) internal override {
        _requireNotPaused();
        super._transfer(from, to, value);
    }

    function _approve(address owner, address spender, uint256 amount) internal override {
        _requireNotPaused();
        super._approve(owner, spender, amount);
    }
}
