// SPDX-License-Identifier: MIT

pragma solidity 0.8.13;

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
//import "base64-sol/base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

//import "@openzeppelin/contracts/access/Ownable.sol";

contract ExoticNFT is ERC1155Supply {
    using Strings for uint256;

    string private constant base64jsonPrefix = "data:application/json;base64,";
    //uint256 private blockTimeLimit;
    mapping(uint256 => string) private _imageURI;
    mapping(uint256 => string) private _nfts;

    /**
     * @dev Initializes the contract setting the ImageURI and items id array.
     */
    constructor(string[] memory imageUri, string[] memory names) ERC1155("") {
        if (imageUri.length != names.length) revert("length mismatch");
        uint256[] memory ids = new uint256[](names.length);
        uint256[] memory amounts = new uint256[](names.length);
        for (uint256 i = 0; i < names.length; ) {
            _imageURI[i] = imageUri[i];
            _nfts[i] = names[i];
            ids[i] = i;
            amounts[i] = 100;
            unchecked {
                ++i;
            }
        }
        _mintBatch(msg.sender, ids, amounts, "");
    }

    // function mint(
    //     address account,
    //     uint256 id,
    //     uint256 amount,
    //     bytes memory data
    // ) external onlyOwner {
    //     //uint256 _id = rangeId(id); // modified
    //     _mint(account, id, amount, data);
    // }

    // function mintBatch(
    //     address to,
    //     uint256[] memory ids,
    //     uint256[] memory amounts,
    //     bytes memory data
    // ) external onlyOwner {
    //     //uint256[93] memory idsArray = _idsArray; // modified
    //     // for (uint256 i = 0; i < ids.length; ) {
    //     //     ids[i] = calcId(ids[i]); //0.0745116x+1.93851
    //     //     unchecked {
    //     //         ++i;
    //     //     }
    //     // }
    //     _mintBatch(to, ids, amounts, data);
    // }

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

    ///
    function maxChanceValue() public pure returns (uint256) {
        return 93;
    }

    // function newbalanceOf(address account, uint256 id) public view returns(uint256) {
    //     uint256 fullBalance = _balances[account];
    //     //uint256 x = (3*id +30)/10;
    //     return (fullBalance % (10**calxY(id+1))) / 10**calxY(id);
    // }

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
                                _nfts[id],
                                '", "description": "Test gacha NFT collection", ',
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
