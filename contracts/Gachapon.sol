// SPDX-License-Identifier: MIT
// ver 1.1
pragma solidity 0.8.13;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
//import "./IERC1155Mint.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

/**
 * @title Nft gachapon contract
 * @author neeyno
 * @notice This contract is ...
 * @dev This implements Chainlink VRF v2
 */
contract Gachapon is VRFConsumerBaseV2, ERC1155Holder {
    //
    /* -- ERRORS -- */

    error Gachapon__RngOutOfRange();
    error Gachapon__InsufficientEnergy();
    //error Gachapon__ItemsOutOfStock();

    /* -- Chainlink VRF variables -- */

    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;
    uint32 private immutable i_callbackGasLimit;
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_gasLane;
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;

    /* -- Gacha variables -- */

    uint256 private constant PULL_COST = 50;
    IERC1155 private _nft;
    uint256 private _maxChanceValue;
    uint256[] private _chanceArray;
    mapping(address => uint256) private _senderToBlock;
    mapping(uint256 => address) private _requestIdToSender;

    /* -- EVENTS -- */

    event PullRequested(uint256 indexed requestId, address indexed sender);
    event PullFulfilled(uint256 indexed requestId, address indexed owner, uint256 nftId);

    /* -- FUNCTIONS -- */

    constructor(
        address nftAddress,
        uint256[] memory chanceArray,
        address vrfCoordinatorV2,
        uint64 subscriptionId,
        bytes32 gasLane, // keyHash
        uint32 callbackGasLimit
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        _nft = IERC1155(nftAddress);
        _chanceArray = chanceArray;
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_subscriptionId = subscriptionId;
        i_gasLane = gasLane;
        i_callbackGasLimit = callbackGasLimit;
        uint256 sum;
        for (uint256 i = 0; i < chanceArray.length; ) {
            sum += chanceArray[i];
            unchecked {
                ++i;
            }
        }
        _maxChanceValue = sum;
    }

    function pullSingle() external returns (uint256 requestId) {
        address sender = _msgSender();
        //_senderToBlock[sender] = _getEnergyBlock(_senderToBlock[sender], block.number); //energyBlock;

        requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        _requestIdToSender[requestId] = sender;
        emit PullRequested(requestId, sender);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        address owner = _requestIdToSender[requestId];
        uint256 nftId = _getIdFromRNG(randomWords[0], _chanceArray, _maxChanceValue);
        _nft.safeTransferFrom(address(this), owner, nftId, 1, "0x");
        emit PullFulfilled(requestId, owner, nftId);
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

    function _getIdFromRNG(
        uint256 randomNum,
        uint256[] memory chanceArray,
        uint256 maxChanceValue
    ) private pure returns (uint256) {
        // uint256[] memory chanceArray = _chanceArray;
        // uint256 cumulativeSum = _cumulativeSum;

        // transform the result to a number between 1 and maxChanceValue inclusively
        uint256 rng = (randomNum % maxChanceValue) + 1;
        for (uint256 i = 0; i < chanceArray.length; ) {
            if (rng <= maxChanceValue && rng > maxChanceValue - chanceArray[i]) {
                return i;
            }
            maxChanceValue = maxChanceValue - chanceArray[i];
            unchecked {
                ++i;
            }
        }
        revert Gachapon__RngOutOfRange();
    }

    function _getEnergyBlock(uint256 prevEnergy, uint256 blockNum) private pure returns (uint256) {
        // not implemented

        if (prevEnergy == 0) {
            //prevEnergy = block.number; // 1 free pull
            //return block.number;
            return blockNum;
        } else {
            uint256 energy = blockNum - prevEnergy;
            if (energy < PULL_COST) {
                revert Gachapon__InsufficientEnergy();
            }
            energy = energy > PULL_COST * 5 ? PULL_COST * 4 : energy - PULL_COST; // limit of the energy
            return blockNum - energy;
        }
    }

    function _msgSender() private view returns (address) {
        return msg.sender;
    }

    /* -- Getter FUNCTIONS -- */

    function getChanceArray() external view returns (uint256[] memory) {
        return _chanceArray;
    }

    function getMaxChance() external view returns (uint256) {
        return _maxChanceValue;
    }

    function getUserByRequest(uint256 requestId) external view returns (address) {
        return _requestIdToSender[requestId];
    }

    // function getUserEnergy(address user) external view returns (uint256) {
    //     return _senderToBlock[user];
    // }

    function getNftAddress() external view returns (IERC1155) {
        return _nft;
    }

    function getVrfCoordinator() external view returns (VRFCoordinatorV2Interface) {
        return i_vrfCoordinator;
    }
}
