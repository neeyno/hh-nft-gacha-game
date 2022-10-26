// SPDX-License-Identifier: MIT

pragma solidity 0.8.13;

//import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";
//import "@openzeppelin/contracts/access/Ownable.sol";
import "base64-sol/base64.sol";

contract GachaNFT is ERC1155URIStorage {
    uint256 private constant COMMON = 0;
    uint256 private constant EPIC = 1;
    uint256 private constant LEGENDARY = 2;
    string[3] private imageURI;
    string[3] private name = ["COMMON", "EPIC", "LEGENDARY"];
    uint256[3] private rarity = [220, 30, 5];
    uint256[3] private tokenValue = [100, 1000, 10000];

    string private constant base64jsonPrefix = "data:application/json;base64,";

    constructor(string[3] memory _imageUri) ERC1155("") {
        imageURI = _imageUri;
        _mint(msg.sender, COMMON, rarity[COMMON], "");
        _mint(msg.sender, EPIC, rarity[EPIC], "");
        _mint(msg.sender, LEGENDARY, rarity[LEGENDARY], "");
    }

    // function mint(address to, uint8 nftType) external onlyOwner returns (bool) {
    //     _mint(to, nftType, 1, "");
    //     return true;
    // }

    function uri(uint256 id) public view virtual override returns (string memory) {
        return
            string(
                abi.encodePacked(
                    base64jsonPrefix,
                    Base64.encode(
                        bytes(
                            abi.encodePacked(
                                '{"name":"',
                                name[id],
                                ' Token Pack", "description": "Gacha game NFT collection", ',
                                '"attributes": [{"trait_type": "Rarity", "value":',
                                rarity[id],
                                '},{"trait_type": "Tokens", "value":',
                                tokenValue[id],
                                '], "image":"',
                                imageURI[id],
                                '"}'
                            )
                        )
                    )
                )
            );
    }

    error __zeroBalance();

    function claimNFT(uint256 tokenId, uint256 amount) external {
        // if (balanceOf(msg.sender, tokenId == 0)) {
        //     revert __zeroBalance();
        // }
        _burn(msg.sender, tokenId, amount);

        //transfer
    }
}
