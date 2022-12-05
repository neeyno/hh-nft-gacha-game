// SPDX-License-Identifier: MIT
// ver 1.2
pragma solidity 0.8.13;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface Itoken {
    function mint(address to, uint256 amount) external returns (bool);

    function burn(address from, uint256 amount) external returns (bool);
}

/**
 * @title Nft gacha contract
 * @author neeyno
 * @dev This contract implements Chainlink VRFv2 and simple gacha-mechanics
 */
contract Gachapon is VRFConsumerBaseV2, ERC1155Holder, Ownable {
    //
    /* -- ERRORS -- */

    error Gachapon__RngOutOfRange();
    error Gachapon__InsufficientValue();
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

    uint256 private constant FEE_SINGLE = 50000000000000000000;
    uint256 private constant FEE_MULTI = 500000000000000000000;
    uint256 private immutable _packPrice;
    uint256[] private _chanceArray;
    mapping(uint256 => address) private _requestIdToSender;
    IERC1155 private _nft;
    Itoken private _token;

    /* -- EVENTS -- */

    event PullRequested(uint256 indexed requestId, address indexed sender, uint32 numWords);
    event PullFulfilled(uint256 indexed requestId, address indexed owner, uint256[] nftId);

    /* -- FUNCTIONS -- */

    constructor(
        uint256[] memory chanceArray,
        address vrfCoordinatorV2,
        uint64 subscriptionId,
        bytes32 gasLane, // keyHash
        uint32 callbackGasLimit,
        uint256 price
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        _chanceArray = chanceArray;
        _vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        _subscriptionId = subscriptionId;
        _gasLane = gasLane;
        _callbackGasLimit = callbackGasLimit;
        _packPrice = price;
    }

    /**
     * @dev The function mints in-game tokens to the buyer address for a fixed amount of Eth.
     * msg.value greater than _packPrice is required.
     */
    function buyTokenPack() external payable {
        if (msg.value < _packPrice) revert Gachapon__InsufficientValue();
        _token.mint(msg.sender, FEE_SINGLE * 27);
    }

    /**
     * withdraws ETH from this contract to the address of the owner.
     */
    function withdraw() external {
        payable(owner()).call{value: address(this).balance}("");
    }

    /**
     * @dev Single pull function - burns fixed amount of in-game tokens thats equal to FEE_SINGLE
     * and requests single(1) random number from Chainlink.
     * @dev The function reverts if there is not enough tokens on a sender's balance
     * @return requestId - a uniq id assigned to a user pull
     */
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
        emit PullRequested(requestId, sender, NUM_WORDS_SINGLE);
    }

    /**
     * @dev Multi pull function - burns fixed amount of in-game tokens thats equal to FEE_MULTI
     * and requests multi(10) random numbers from Chainlink VRF.
     * @dev The function reverts if there is not enough tokens on a sender's balance
     * @return requestId - a uniq id assigned to a user pull
     */
    function pullMulti() external returns (uint256 requestId) {
        address sender = _msgSender();

        if (!_token.burn(sender, FEE_MULTI)) revert();

        requestId = _vrfCoordinator.requestRandomWords(
            _gasLane,
            _subscriptionId,
            REQUEST_CONFIRMATIONS,
            _callbackGasLimit,
            NUM_WORDS_MULTI
        );

        _requestIdToSender[requestId] = sender;
        emit PullRequested(requestId, sender, NUM_WORDS_MULTI);
    }

    /**
     * @dev This is function that Chainlink VRF node calls to fulfill request
     * and send NFTs to the owner.
     * @param requestId is given when a user calls pull funtions
     * @param randomWords are transformed into a fixed-range random NFT id
     */
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        address owner = _requestIdToSender[requestId];
        uint256[] memory chanceArray = _chanceArray;

        if (randomWords.length == NUM_WORDS_SINGLE) {
            randomWords[0] = _getIdFromRNG(randomWords[0], chanceArray);
            _nft.safeTransferFrom(address(this), owner, randomWords[0], NUM_WORDS_SINGLE, "");
        } else {
            uint256[] memory batchNftAmount = new uint256[](NUM_WORDS_MULTI);
            for (uint256 i = 0; i < NUM_WORDS_MULTI; ) {
                randomWords[i] = (_getIdFromRNG(randomWords[i], chanceArray));
                batchNftAmount[i] = 1;
                unchecked {
                    ++i;
                }
            }
            _nft.safeBatchTransferFrom(address(this), owner, randomWords, batchNftAmount, "");
        }
        emit PullFulfilled(requestId, owner, randomWords);
    }

    function setNft(address nftAddress) external onlyOwner {
        _nft = IERC1155(nftAddress);
    }

    function setToken(address tokenAddress) external onlyOwner {
        _token = Itoken(tokenAddress);
    }

    /**
     * @dev Transforms an initial randomWords to a number
     * between 1 and max chance value inclusively
     */
    function _getIdFromRNG(
        uint256 randomNum,
        uint256[] memory chanceArray
    ) private pure returns (uint256) {
        unchecked {
            randomNum = (randomNum % chanceArray[0]) + 1;
            for (uint256 i = 0; i < chanceArray.length - 1; ) {
                if (randomNum > chanceArray[i + 1]) {
                    //&& rng <= chanceArray[i]) {
                    return i;
                }
                ++i;
            }
        }
        revert Gachapon__RngOutOfRange();
    }

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

    function getTokenAddress() external view returns (Itoken) {
        return _token;
    }

    function getVrfCoordinator() external view returns (VRFCoordinatorV2Interface) {
        return _vrfCoordinator;
    }
}
