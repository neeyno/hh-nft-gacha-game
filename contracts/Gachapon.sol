// SPDX-License-Identifier: MIT
// ver 1.2
pragma solidity 0.8.13;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface Itoken {
    function mint(address to) external returns (bool);

    function burn(address from, uint256 amount) external returns (bool);
}

interface Inft is IERC1155 {
    function maxChanceValue() external view returns (uint256);

    function totalSupply(uint256 id) external view returns (uint256);

    function exists(uint256 id) external view returns (bool);
}

/* -- ERRORS -- */

error Gacha_InsufficientValue();
error Gacha_DeployFailed();
error Gacha_TransferFailed();

/**
 * @title Nft gacha contract
 * @author neeyno
 * @dev Implements Chainlink VRFv2 and simple gacha-mechanics
 */
contract Gachapon is VRFConsumerBaseV2, Ownable, ERC1155Holder {
    //
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
    uint256 private _maxChanceValue; //uint256[] private _chanceArray;
    Inft private _nft;
    Itoken private _token;
    mapping(uint256 => address) private _requestIdToSender;

    /* -- EVENTS -- */

    event PullRequested(uint256 indexed requestId, address indexed sender, uint32 numWords);
    event PullFulfilled(uint256 indexed requestId, address indexed owner, uint256[] nftId);
    event PackBought(address buyer);

    /* -- FUNCTIONS -- */

    constructor(
        address vrfCoordinatorV2,
        uint64 subscriptionId,
        bytes32 gasLane, // keyHash
        uint32 callbackGasLimit,
        uint256 packPrice
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        _vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        _subscriptionId = subscriptionId;
        _gasLane = gasLane;
        _callbackGasLimit = callbackGasLimit;
        _packPrice = packPrice;
    }

    // receive
    // fallback() external payable {}

    /**
     * @dev The function mints in-game tokens to the buyer address for a fixed amount of Eth.
     * msg.value greater than _packPrice is required.
     */
    function buyTokenPack() external payable {
        if (msg.value < _packPrice) revert Gacha_InsufficientValue();
        _token.mint(msg.sender);
        emit PackBought(msg.sender);
    }

    /**
     * withdraws ETH from this contract to the address of the owner.
     */
    // function withdraw() external {
    //     (bool success, ) = payable(owner()).call{value: address(this).balance}("");
    //     if (!success) revert Gacha_TransferFailed();
    // }

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
     * The function reverts if there is not enough tokens on a sender's balance
     * @return requestId - id assigned to a user pull
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

    function setNft(bytes memory code) external onlyOwner returns (address nftAddress) {
        assembly {
            //(create v, p, n)
            // v -amount eth to send
            // p - pointer in memory to start of code
            // n - size of code
            nftAddress := create(callvalue(), add(code, 0x20), mload(code))
        }
        if (nftAddress == address(0)) revert Gacha_DeployFailed();
        _nft = Inft(nftAddress);
        _maxChanceValue = _nft.maxChanceValue();
        //return addr;
    }

    function setToken(bytes memory code) external onlyOwner returns (address tokenAddress) {
        assembly {
            tokenAddress := create(callvalue(), add(code, 0x20), mload(code))
        }
        if (tokenAddress == address(0)) revert Gacha_DeployFailed();
        _token = Itoken(tokenAddress);
    }

    function execute(
        address payable target,
        uint256 msgValue,
        bytes memory data
    ) external payable onlyOwner returns (bytes memory) {
        (bool success, bytes memory _data) = target.call{value: msgValue}(data);
        if (!success) revert Gacha_TransferFailed();
        return _data;
    }

    /**
     * @dev This is the function that Chainlink VRF node calls to fulfill request
     * and send NFTs to the owner.
     * @param requestId is given when a user calls pull funtions
     * @param randomWords are random numbers from Chainlink VRF response.
     */
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        address owner = _requestIdToSender[requestId];
        //uint256[] memory chanceArray = _chanceArray;
        if (randomWords.length == NUM_WORDS_MULTI) {
            _fulfillMultiPull(requestId, randomWords, owner);
        } else {
            _fulfillSinglePull(requestId, randomWords, owner);
        }

        // if (randomWords.length == NUM_WORDS_SINGLE) {
        //     randomWords[0] = _getRandomId(randomWords[0], maxChanceValue);
        //     _nft.mint(owner, randomWords[0], NUM_WORDS_SINGLE, "");
        // } else {
        //     uint256[] memory batchNftAmount = new uint256[](NUM_WORDS_MULTI);
        //     for (uint256 i = 0; i < NUM_WORDS_MULTI; ) {
        //         randomWords[i] = (_getIdFromRNG(randomWords[i], chanceArray));
        //         batchNftAmount[i] = 1;
        //         unchecked {
        //             ++i;
        //         }
        //     }
        //     _nft.safeBatchTransferFrom(address(this), owner, randomWords, batchNftAmount, "");
        // }
        // emit PullFulfilled(requestId, owner, randomWords);
    }

    /**
     * @dev Transforms an initial randomWords to a number
     * between 0 and (max chance value -1) inclusively
     */
    function _fulfillMultiPull(
        uint256 requestId,
        uint256[] memory randomWords,
        address account
    ) private {
        uint256 maxChanceValue = _maxChanceValue;
        uint256[] memory batchNftAmount = new uint256[](NUM_WORDS_MULTI);
        //uint8[10] memory rng = [0, 1, 1, 2, 0, 0, 0, 0, 0, 0];
        for (uint256 i = 0; i < NUM_WORDS_MULTI; ) {
            unchecked {
                randomWords[i] = _caclFromRange(randomWords[i] % maxChanceValue);
                batchNftAmount[i] = 1;
                ++i;
            }
        }
        _nft.safeBatchTransferFrom(address(this), account, randomWords, batchNftAmount, "");
        emit PullFulfilled(requestId, account, randomWords);
    }

    function _fulfillSinglePull(
        uint256 requestId,
        uint256[] memory randomWords,
        address account
    ) private {
        randomWords[0] = _caclFromRange(randomWords[0] % _maxChanceValue);
        _nft.safeTransferFrom(address(this), account, randomWords[0], NUM_WORDS_SINGLE, "");
        emit PullFulfilled(requestId, account, randomWords);
    }

    function _caclFromRange(uint256 number) private pure returns (uint256) {
        unchecked {
            if (number > 43) {
                return (number + 756) / 100;
            } else if (number > 3) {
                return (number + 36) / 10;
            } else {
                return number;
            }
        }
    }

    // function _getIdFromRNG(
    //     uint256 randomNum,
    //     uint256[] memory chanceArray
    // ) private pure returns (uint256) {
    //     unchecked {
    //         randomNum = (randomNum % chanceArray[0]) + 1;
    //         for (uint256 i = 0; i < chanceArray.length - 1; ) {
    //             if (randomNum > chanceArray[i + 1]) {
    //                 //&& rng <= chanceArray[i]) {
    //                 return i;
    //             }
    //             ++i;
    //         }
    //     }
    //     revert Gacha_RngOutOfRange();
    // }

    /* -- Getter FUNCTIONS -- */

    function getPackPrice() external view returns (uint256) {
        return _packPrice;
    }

    function getMaxChance() external view returns (uint256) {
        return _maxChanceValue;
    }

    function getUserByRequest(uint256 requestId) external view returns (address) {
        return _requestIdToSender[requestId];
    }

    function getNftAddress() external view returns (Inft) {
        return _nft;
    }

    function getTokenAddress() external view returns (Itoken) {
        return _token;
    }

    function getVrfCoordinator() external view returns (VRFCoordinatorV2Interface) {
        return _vrfCoordinator;
    }
}
