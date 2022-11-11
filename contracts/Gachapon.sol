// SPDX-License-Identifier: MIT
// ver 1.1
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
    /* Chainlink VRF variables */
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;
    uint32 private immutable callbackGasLimit;
    uint64 private immutable subscriptionId;
    bytes32 private immutable gasLane;
    VRFCoordinatorV2Interface private immutable vrfCoordinator;

    /* Gacha variables */

    uint256 private constant PULL_COST = 50;
    IERC1155 private immutable nft;
    uint256 private _cumulativeSum;
    uint256[] private _chanceArray = [8, 5, 3];
    mapping(address => uint256) private _senderToBlock;
    mapping(uint256 => address) private _requestIdToSender;

    /* EVENTS */

    event PullRequest(uint256 requestId, address sender);
    event ItemTransfer(uint256 itemType, address owner);

    /* FUNCTIONS */

    constructor(
        address _nftAddress,
        uint256[] memory chanceArray,
        address _vrfCoordinatorV2,
        uint64 _subscriptionId,
        bytes32 _gasLane, // keyHash
        uint32 _callbackGasLimit
    ) VRFConsumerBaseV2(_vrfCoordinatorV2) {
        nft = IERC1155(_nftAddress);
        _chanceArray = chanceArray;
        vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinatorV2);
        subscriptionId = _subscriptionId;
        gasLane = _gasLane;
        callbackGasLimit = _callbackGasLimit;
        uint256 sum;
        for (uint256 i = 0; i < chanceArray.length; ) {
            sum = chanceArray[i];
            unchecked {
                ++i;
            }
        }
        _cumulativeSum = sum;
    }

    function pull() external returns (uint256 requestId) {
        address msgSender = _msgSender();
        uint256 energyBlock = _getEnergyBlock(msgSender); // = senderToBlock[msg.sender];
        _senderToBlock[msgSender] = energyBlock;

        requestId = vrfCoordinator.requestRandomWords(
            gasLane,
            subscriptionId,
            REQUEST_CONFIRMATIONS,
            callbackGasLimit,
            NUM_WORDS
        );

        _requestIdToSender[requestId] = msgSender;
        emit PullRequest(requestId, msgSender);
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
        address owner = _requestIdToSender[requestId];
        uint256 rng = 1 + (randomWords[0] % _cumulativeSum);
        uint256 itemType = _getTypeFromRNG(rng);
        //chanceArray[itemType] -= 1;
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

    function _getTypeFromRNG(uint256 rng) private view returns (uint256) {
        uint256[] memory chanceArray = _chanceArray;
        uint256 cumulativeSum = _cumulativeSum;
        for (uint256 i; i < chanceArray.length; ) {
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

    function _getEnergyBlock(address user) private view returns (uint256) {
        uint256 prevEnergy = _senderToBlock[user];
        if (prevEnergy == 0) {
            prevEnergy = block.number; // 1 free pull
            return prevEnergy;
        } else {
            uint256 energy = block.number - prevEnergy;
            if (energy < PULL_COST) {
                revert Gachapon__InsufficientEnergy();
            }
            energy = energy > PULL_COST * 5 ? PULL_COST * 4 : energy - PULL_COST; // limit is PULL_COST * 5
            return block.number - energy;
        }
    }

    function _msgSender() private view returns (address) {
        return msg.sender;
    }

    /* Getters FUNCTION */

    function getChanceArray() external view returns (uint256[] memory) {
        return _chanceArray;
    }
}
