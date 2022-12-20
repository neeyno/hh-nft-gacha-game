// SPDX-License-Identifier: MIT

pragma solidity 0.8.13;

//import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ExoticToken is ERC20 {
    uint256 private constant AMOUNT_TOKEN_PACK = 1421e18;
    address private immutable _owner;

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    constructor() ERC20("Exotic Token", "EXT") {
        _owner = _msgSender();
    }

    function mint(address to) external onlyOwner returns (bool) {
        _mint(to, AMOUNT_TOKEN_PACK);
        return true;
    }

    function burn(address from, uint256 amount) external onlyOwner returns (bool) {
        _burn(from, amount);
        return true;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() private view {
        require(_owner == _msgSender(), "Ownable: caller is not the owner");
    }

    function _transfer(address from, address to, uint256 value) internal override {
        _requireNotDisabled();
        super._transfer(from, to, value);
    }

    function _approve(address owner, address spender, uint256 amount) internal override {
        _requireNotDisabled();
        super._approve(owner, spender, amount);
    }

    function _requireNotDisabled() private {
        revert("Function disabled");
    }
}
