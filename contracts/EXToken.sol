// SPDX-License-Identifier: MIT

pragma solidity 0.8.13;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ExoticToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("Exotic Token", "EXT") {
        _mint(msg.sender, initialSupply);
    }

    // к примеру
    function approve(address любойАддрессСТокенами, uint256 amount) public virtual override returns (bool) {
        address owner = _msgSender();
        _approve(любойАддрессСТокенами, spender, amount);
        return true;
    }
}
