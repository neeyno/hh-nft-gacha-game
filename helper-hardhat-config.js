const { ethers } = require("hardhat")
require("dotenv").config()

const networkConfig = {
    5: {
        name: "goerli",
        nftSupply: [20, 8, 3],
        vrfCoordinatorV2: "0x2ca8e0c643bde4c2e08ab1fa0da3401adad7734d",
        subscriptionId: "6595",
        gasLane: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
        callbackGasLimit: "220000", //	220000
    },
    31337: {
        name: "hardhat",
        nftSupply: [20, 8, 3],
        gasLane: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
        callbackGasLimit: "500000",
    },
}

const developmentChains = ["hardhat", "localhost"]

module.exports = {
    networkConfig,
    developmentChains,
}
