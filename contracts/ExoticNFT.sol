// SPDX-License-Identifier: MIT

pragma solidity 0.8.13;

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
//import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
//import "@openzeppelin/contracts/token/ERC1155/extensions/IERC1155MetadataURI.sol";
//import "base64-sol/base64.sol";
// import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
//import "./ERC1155.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ExoticNFT is ERC1155Supply, Ownable {
    using Strings for uint256;
    //
    uint256 private constant LEGENDARY_0 = 0;
    uint256 private constant LEGENDARY_1 = 1;
    uint256 private constant LEGENDARY_2 = 2;
    uint256 private constant EPIC_0 = 3;
    uint256 private constant EPIC_1 = 4;
    uint256 private constant EPIC_3 = 5;
    uint256 private constant COMMON_0 = 6;
    uint256 private constant COMMON_1 = 7;
    uint256 private constant COMMON_2 = 8;

    string private constant base64jsonPrefix = "data:application/json;base64,";
    string[9] private _imageURI;
    string[9] private _name = [
        "LEGENDARY0",
        "LEGENDARY1",
        "LEGENDARY2"
        "EPIC0",
        "EPIC1",
        "EPIC2",
        "COMMON0",
        "COMMON1",
        "COMMON2"
    ];
    //uint256[93] private _idsArray; // = [0, 0, 0, 1, 1, 1, 2, 2, 2...];
    uint256 private blockTimeLimit;

    /**
     * @dev Initializes the contract setting the ImageURI and items id array.
     */
    constructor(string[9] memory imageUri) ERC1155("") {
        _imageURI = imageUri;
        //_idsArray = idsArray;
    }

    function mint(
        address account,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) external onlyOwner {
        //uint256 _id = rangeId(id); // modified
        _mint(account, id, amount, data);
    }

    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) external onlyOwner {
        //uint256[93] memory idsArray = _idsArray; // modified
        // for (uint256 i = 0; i < ids.length; ) {
        //     ids[i] = calcId(ids[i]); //0.0745116x+1.93851
        //     unchecked {
        //         ++i;
        //     }
        // }
        _mintBatch(to, ids, amounts, data);
    }

    function burn(address account, uint256 id, uint256 value) external {
        require(
            account == _msgSender() || isApprovedForAll(account, _msgSender()),
            "ERC1155: caller is not token owner nor approved"
        );

        _burn(account, id, value);
    }

    function burnBatch(address account, uint256[] memory ids, uint256[] memory values) external {
        require(
            account == _msgSender() || isApprovedForAll(account, _msgSender()),
            "ERC1155: caller is not token owner nor approved"
        );

        _burnBatch(account, ids, values);
    }

    function idRange(uint256 id) public pure returns (uint256) {
        unchecked {
            if (id > 17) {
                return (4 * id + 528) / 100;
            } else if (id > 2) {
                return (2 * id + 24) / 10;
            } else {
                return id;
            }
        }
    }

    ///
    function maxChanceValue() public pure returns (uint256) {
        return 93;
    }

    function uri(uint256 id) public view override returns (string memory) {
        //uint256 _id = _idsArray[id];
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
                                Strings.toString(totalSupply(id)),
                                '"}], "image":"',
                                _imageURI[id],
                                '"}'
                            )
                        )
                    )
                )
            );
    }
}
