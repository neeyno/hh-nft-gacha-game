// SPDX-License-Identifier: MIT

pragma solidity 0.8.13;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
//import "./IERC1155Mint.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

/* ERRORS */

error Gachapon__RngOutOfRange();
error Gachapon__InsufficientEnergy();
error Gachapon__ItemsOutOfStock();

/**
 * @title Nft gachapon contract
 * @author neeyno
 * @notice This contract is ...
 * @dev This implements Chainlink VRF v2
 */
contract Gachapon is VRFConsumerBaseV2, ERC1155Holder {
    //Chainlink VRF variables
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;
    uint32 private immutable callbackGasLimit;
    uint64 private immutable subscriptionId;
    bytes32 private immutable gasLane;
    VRFCoordinatorV2Interface private immutable vrfCoordinator;
    // VRF helpers

    /* Gacha variables */
    uint256 private constant PULL_FEE = 50;
    IERC1155 private immutable nft;
    uint256 private pullCounter = 16; // or 0
    uint256[] private chanceArray = [8, 5, 3];
    mapping(address => uint256) private senderToBlock;
    mapping(uint256 => address) private requestIdToSender;

    /* EVENTS */
    event PullRequest(uint256 requestId, address sender);
    event ItemTransfer(uint256 itemType, address owner);

    modifier inStock() {
        if (pullCounter == 0) {
            revert Gachapon__ItemsOutOfStock();
        }
        _;
        pullCounter = pullCounter - 1;
    }

    /* FUNCTIONS */

    constructor(
        address _nftAddress,
        uint256[] memory _chanceArray,
        address _vrfCoordinatorV2,
        uint64 _subscriptionId,
        bytes32 _gasLane, // keyHash
        uint32 _callbackGasLimit
    ) VRFConsumerBaseV2(_vrfCoordinatorV2) {
        nft = IERC1155(_nftAddress);
        chanceArray = _chanceArray;
        vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinatorV2);
        subscriptionId = _subscriptionId;
        gasLane = _gasLane;
        callbackGasLimit = _callbackGasLimit;
    }

    function pull() external returns (uint256 requestId) {
        if (pullCounter == 0) {
            revert Gachapon__ItemsOutOfStock();
        }
        uint256 _block = senderToBlock[msg.sender];
        if (_block == 0) {
            _block = block.number - PULL_FEE * 2;
        } else {
            uint256 energy = block.number - _block;
            if (energy < PULL_FEE) {
                revert Gachapon__InsufficientEnergy();
            }
            uint256 energyLimit = energy > PULL_FEE * 5 ? PULL_FEE * 5 : energy;
            _block = block.number - energyLimit + PULL_FEE;
        }
        senderToBlock[msg.sender] = _block;
        requestId = vrfCoordinator.requestRandomWords(
            gasLane,
            subscriptionId,
            REQUEST_CONFIRMATIONS,
            callbackGasLimit,
            NUM_WORDS
        );
        requestIdToSender[requestId] = msg.sender;
        emit PullRequest(requestId, msg.sender);
    }

    // function fulfill() public {
    //     address owner = msg.sender;
    //     uint8 rng = 255 % chanceArray[2];
    //     uint8 itemType = getKeyFromRNG(rng);
    //     chanceArray[itemType] -= 1;
    //     nft.safeTransferFrom(address(this), owner, itemType, 1, "");
    // }

    function fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords)
        internal
        override
    {
        address owner = requestIdToSender[requestId];
        uint256 rng = 1 + (randomWords[0] % pullCounter);
        uint256 itemType = getTypeFromRNG(rng);
        pullCounter -= 1;
        chanceArray[itemType] -= 1;
        nft.safeTransferFrom(address(this), owner, itemType, 1, "");
        emit ItemTransfer(itemType, owner);
    }

    // function getKeyFromRNG(uint256 rng) public view returns (uint256) {
    //     uint8 cumulativeSum = 0;
    //     uint8[3] memory _chanceArray = chanceArray;
    //     for (uint8 i; i < _chanceArray.length; ) {
    //         if (rng > cumulativeSum && rng <= cumulativeSum + _chanceArray[i]) {
    //             return i;
    //         }
    //         cumulativeSum = cumulativeSum + _chanceArray[i];
    //         unchecked {
    //             ++i;
    //         }
    //     }
    //     revert Gachapon__RNGOutOfRange();
    // }

    function getTypeFromRNG(uint256 rng) private view returns (uint256) {
        uint256 cumulativeSum = pullCounter;
        uint256[] memory _chanceArray = chanceArray;
        for (uint256 i; i < _chanceArray.length; ) {
            if (rng <= cumulativeSum && rng > cumulativeSum - _chanceArray[i]) {
                return i;
            }
            cumulativeSum = cumulativeSum - _chanceArray[i];
            unchecked {
                ++i;
            }
        }
        revert Gachapon__RngOutOfRange();
    }

    /* Getter FUNCTIONS */

    function getChanceArray() external view returns (uint256[] memory) {
        return chanceArray;
    }

    // function getPullCounter() public view returns (uint256 _pullCounter) {
    //     uint256[3] memory _chanceArray = chanceArray;
    //     uint256 len = _chanceArray.length;
    //     for (uint256 i; i < len; ) {
    //         _pullCounter = _chanceArray[i];
    //         unchecked {
    //             ++i;
    //         }
    //     }
    // }
}
