const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    log(`Network: ${network.name}`)

    if (developmentChains.includes(network.name)) {
        log("Deploying mock to the local network...")

        const baseFee = ethers.utils.parseUnits("0.25", 18) // Premium 0.25 LINK per request
        const gasPriceLink = 1e9 // 1000000000
        const vrfCoordinatorArgs = [baseFee, gasPriceLink]

        const vrfCoordinatorMock = await deploy("VRFCoordinatorV2Mock", {
            contract: "VRFCoordinatorV2Mock",
            from: deployer,
            args: vrfCoordinatorArgs,
            log: true,
            waitConfirmations: network.config.blockConfirmations || 1,
        })

        log("------------------------------------------")
    }
}

module.exports.tags = ["mock", "test"]
