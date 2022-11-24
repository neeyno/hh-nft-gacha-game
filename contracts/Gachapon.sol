// SPDX-License-Identifier: MIT
// ver 1.2
pragma solidity 0.8.13;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface Itoken {
    function mint(address to, uint256 amount) external;

    function burn(address from, uint256 amount) external returns (bool);

    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title Nft gachapon contract
 * @author neeyno
 * @notice This contract is ...
 * @dev This implements Chainlink VRF v2
 */
contract Gachapon is VRFConsumerBaseV2, ERC1155Holder, Ownable {
    //
    /* -- ERRORS -- */

    error Gachapon__RngOutOfRange();
    //error Gachapon__InsufficientBalance();

    /* -- Chainlink VRF variables -- */

    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS_SINGLE = 1;
    uint32 private constant NUM_WORDS_MULTI = 10;
    uint32 private immutable _callbackGasLimit;
    uint64 private immutable _subscriptionId;
    bytes32 private immutable _gasLane;
    VRFCoordinatorV2Interface private immutable _vrfCoordinator;

    /* -- Gacha variables -- */

    uint256 private constant FEE_SINGLE = 1000000000000000000;
    uint256 private constant FEE_MULTI = 10000000000000000000;
    uint256[] private _chanceArray;
    mapping(uint256 => address) private _requestIdToSender;
    IERC1155 private _nft;
    Itoken private _token;

    /* -- EVENTS -- */

    event PullRequest(uint256 indexed requestId, address indexed sender, uint32 numWords);
    event FulfilledSingle(uint256 indexed requestId, address indexed owner, uint256 nftId);
    event FulfilledMulti(uint256 indexed requestId, address indexed owner, uint256[] nftId);

    /* -- FUNCTIONS -- */

    constructor(
        uint256[] memory chanceArray,
        address vrfCoordinatorV2,
        uint64 subscriptionId,
        bytes32 gasLane, // keyHash
        uint32 callbackGasLimit
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        _chanceArray = chanceArray;
        _vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        _subscriptionId = subscriptionId;
        _gasLane = gasLane;
        _callbackGasLimit = callbackGasLimit;
    }

    function pullSingle() external returns (uint256 requestId) {
        address sender = _msgSender();

        if (!_token.burn(sender, FEE_SINGLE)) revert();

        requestId = _vrfCoordinator.requestRandomWords(
            _gasLane,
            _subscriptionId,
            REQUEST_CONFIRMATIONS,
            _callbackGasLimit,
            NUM_WORDS_SINGLE
        );

        _requestIdToSender[requestId] = sender;
        emit PullRequest(requestId, sender, NUM_WORDS_SINGLE);
    }

    function pullMulti() external returns (uint256 requestId) {
        address sender = _msgSender();

        if (!_token.burn(sender, FEE_MULTI)) revert();
        // if (_token.balanceOf(sender) < FEE_MULTI) revert Gachapon__InsufficientBalance();
        // _token.burn(sender, FEE_MULTI);

        requestId = _vrfCoordinator.requestRandomWords(
            _gasLane,
            _subscriptionId,
            REQUEST_CONFIRMATIONS,
            _callbackGasLimit,
            NUM_WORDS_MULTI
        );

        _requestIdToSender[requestId] = sender;
        emit PullRequest(requestId, sender, NUM_WORDS_MULTI);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        address owner = _requestIdToSender[requestId];
        uint256[] memory chanceArray = _chanceArray;

        if (randomWords.length == 1) {
            uint256 nftId = _getIdFromRNG(randomWords[0], chanceArray);

            _nft.safeTransferFrom(address(this), owner, nftId, 1, "");
            emit FulfilledSingle(requestId, owner, nftId);
        } else {
            uint256[] memory batchNftId = new uint256[](NUM_WORDS_MULTI);
            uint256[] memory batchNftAmount = new uint256[](NUM_WORDS_MULTI);

            for (uint256 i = 0; i < NUM_WORDS_MULTI; ) {
                batchNftId[i] = (_getIdFromRNG(randomWords[i], chanceArray));
                batchNftAmount[i] = 1;
                unchecked {
                    ++i;
                }
            }
            _nft.safeBatchTransferFrom(address(this), owner, batchNftId, batchNftAmount, "");
            emit FulfilledMulti(requestId, owner, batchNftId);
        }
    }

    function setNft(address nftAddress) external onlyOwner {
        _nft = IERC1155(nftAddress);
    }

    function setToken(address tokenAddress) external onlyOwner {
        _token = Itoken(tokenAddress);
    }

    function _getIdFromRNG(uint256 randomNum, uint256[] memory chanceArray)
        private
        pure
        returns (uint256)
    {
        // transform the result to a number between 1 and maxChanceValue inclusively
        uint256 rng = (randomNum % chanceArray[0]) + 1;
        uint256 len = chanceArray.length - 1;

        for (uint256 i = 0; i < len; ) {
            unchecked {
                if (rng <= chanceArray[i] && rng > chanceArray[i + 1]) {
                    return i;
                }
                ++i;
            }
        }
        revert Gachapon__RngOutOfRange();
    }

    // function _getEnergyBlock(uint256 prevEnergy, uint256 blockNum) private pure returns (uint256) {
    //     // not implemented

    //     if (prevEnergy == 0) {
    //         return blockNum;
    //     } else {
    //         uint256 energy = blockNum - prevEnergy;
    //         if (energy < PULL_COST) {
    //             revert Gachapon__InsufficientEnergy();
    //         }
    //         energy = energy > PULL_COST * 5 ? PULL_COST * 4 : energy - PULL_COST; // limit of the energy
    //         return blockNum - energy;
    //     }
    // }

    /* -- Getter FUNCTIONS -- */

    function getChanceArray() external view returns (uint256[] memory) {
        return _chanceArray;
    }

    function getUserByRequest(uint256 requestId) external view returns (address) {
        return _requestIdToSender[requestId];
    }

    function getNftAddress() external view returns (IERC1155) {
        return _nft;
    }

    function getVrfCoordinator() external view returns (VRFCoordinatorV2Interface) {
        return _vrfCoordinator;
    }
}
