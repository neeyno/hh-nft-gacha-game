// SPDX-License-Identifier: MIT

pragma solidity 0.8.13;

//import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
//import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
//import "@openzeppelin/contracts/token/ERC1155/extensions/IERC1155MetadataURI.sol";
//import "base64-sol/base64.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ExoticNFT is ERC1155, Ownable {
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
    string[] private _imageURI;
    string[] private _name = [
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
    uint8[] private _idsArray; // = [0, 0, 0, 1, 1, 1, 2, 2, 2...];
    uint256 private blockTimeLimit;

    mapping(uint256 => uint256) private _totalSupply;

    /**
     * @dev Initializes the contract setting the ImageURI and items id array.
     */
    constructor(string[] memory imageUri, uint8[] memory idsArray) ERC1155("") {
        _imageURI = imageUri;
        _idsArray = idsArray;
    }

    function mint(
        address account,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) external onlyOwner {
        uint8 _id = _idsArray[id]; // modified
        _mint(account, _id, amount, data);
    }

    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) external onlyOwner {
        uint8[] memory idsArray = _idsArray; // modified
        for (uint256 i = 0; i < idsArray.length; ) {
            ids[i] = idsArray[ids[i]];
            unchecked {
                ++i;
            }
        }
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

    /**
     * @dev See {ERC1155-_beforeTokenTransfer}.
     */
    function _beforeTokenTransfer(
        address /*operator*/,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory /*data*/
    ) internal override(ERC1155) {
        //super._beforeTokenTransfer(operator, from, to, ids, amounts, data);

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

    function maxChanceValue() public view returns (uint256) {
        return _idsArray.length;
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
}
