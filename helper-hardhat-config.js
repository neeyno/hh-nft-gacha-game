const { ethers } = require("hardhat")
require("dotenv").config()

const networkConfig = {
    5: {
        name: "goerli",
        //tokenSupply: "102000000000000000000000", //102000 * 10e18,
        nftSupply: [100, 30, 5],
        vrfCoordinatorV2: "0x2ca8e0c643bde4c2e08ab1fa0da3401adad7734d",
        subscriptionId: "5455",
        gasLane: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
        callbackGasLimit: "2500000", //	2,500,000
    },
    31337: {
        name: "hardhat",
        nftSupply: [12, 5, 3],
        gasLane: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
        callbackGasLimit: "2500000",
    },
}

const developmentChains = ["hardhat", "localhost"]

module.exports = {
    networkConfig,
    developmentChains,
}
