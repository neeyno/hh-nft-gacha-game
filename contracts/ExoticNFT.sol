// SPDX-License-Identifier: MIT

pragma solidity 0.8.13;

//import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
//import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
//import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";
import "base64-sol/base64.sol";

contract ExoticNFT is ERC1155URIStorage {
    //
    string private constant base64jsonPrefix = "data:application/json;base64,";
    uint256 private constant COMMON = 0;
    uint256 private constant EPIC = 1;
    uint256 private constant LEGENDARY = 2;
    string[3] private _imageURI;
    string[3] private _name = ["COMMON", "EPIC", "LEGENDARY"];
    mapping(uint256 => uint256) private _totalSupply;

    //uint8[625] private _idsArray = [0, 0, 0];

    constructor(string[3] memory imageUri, uint256[3] memory supply) ERC1155("") {
        _imageURI = imageUri;
        _mint(msg.sender, COMMON, supply[COMMON], "");
        _mint(msg.sender, EPIC, supply[EPIC], "");
        _mint(msg.sender, LEGENDARY, supply[LEGENDARY], "");
    }

    function burn(address account, uint256 id, uint256 value) public {
        require(
            account == _msgSender() || isApprovedForAll(account, _msgSender()),
            "ERC1155: caller is not token owner nor approved"
        );

        _burn(account, id, value);
    }

    function burnBatch(address account, uint256[] memory ids, uint256[] memory values) public {
        require(
            account == _msgSender() || isApprovedForAll(account, _msgSender()),
            "ERC1155: caller is not token owner nor approved"
        );

        _burnBatch(account, ids, values);
    }

    function uri(uint256 id) public view override returns (string memory) {
        // id = _idsArray[id];
        return
            string(
                abi.encodePacked(
                    base64jsonPrefix,
                    Base64.encode(
                        bytes(
                            abi.encodePacked(
                                '{"name":"',
                                _name[id],
                                ' NFT", "description": "Test gacha NFT collection", ',
                                '"attributes": [{"trait_type": "Rarity", "value": "1/',
                                Strings.toString(_totalSupply[id]),
                                '"}], "image":"',
                                _imageURI[id],
                                '"}'
                            )
                        )
                    )
                )
            );
    }

    /**
     * @dev Total amount of tokens in with a given id.
     */
    function totalSupply(uint256 id) public view returns (uint256) {
        return _totalSupply[id];
    }

    /**
     * @dev Indicates whether any token exist with a given id, or not.
     */
    function exists(uint256 id) public view returns (bool) {
        return totalSupply(id) > 0;
    }

    /**
     * @dev See {ERC1155-_beforeTokenTransfer}.
     */
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override(ERC1155) {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);

        if (from == address(0)) {
            for (uint256 i = 0; i < ids.length; ++i) {
                _totalSupply[ids[i]] += amounts[i];
            }
        }

        if (to == address(0)) {
            for (uint256 i = 0; i < ids.length; ++i) {
                uint256 id = ids[i];
                uint256 amount = amounts[i];
                uint256 supply = _totalSupply[id];
                require(supply >= amount, "ERC1155: burn amount exceeds totalSupply");
                unchecked {
                    _totalSupply[id] = supply - amount;
                }
            }
        }
    }
}
