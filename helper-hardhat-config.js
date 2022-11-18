const { ethers } = require("hardhat")
require("dotenv").config()

const networkConfig = {
    5: {
        name: "goerli",
        nftSupply: [31, 11, 3, 0],
        vrfCoordinatorV2: "0x2ca8e0c643bde4c2e08ab1fa0da3401adad7734d",
        subscriptionId: "6595",
        gasLane: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
        callbackGasLimit: "250000", //
    },
    80001: {
        name: "mumbai",
        nftSupply: [31, 11, 3, 0],
        vrfCoordinatorV2: "0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed",
        subscriptionId: "2649",
        gasLane: "0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f",
        callbackGasLimit: "250000", //
    },
    31337: {
        name: "hardhat",
        nftSupply: [31, 11, 3, 0], //[20, 8, 3],
        gasLane: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
        callbackGasLimit: "500000",
    },
}

const developmentChains = ["hardhat", "localhost"]

module.exports = {
    networkConfig,
    developmentChains,
}
