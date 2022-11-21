const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { developmentChains, networkConfig, NFT_SUPPLY } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    //const tokenSupply = networkConfig[chainId]["tokenSupply"]
    const nftValue = [100, 1000, 10000]
    const nftSupply = NFT_SUPPLY
    let supply = 0
    nftValue.forEach((value, i) => {
        supply += value * nftSupply[i]
    })

    const tokenSupply = ethers.utils.parseUnits(supply.toString(), 18)
    log(`Token supply ${ethers.utils.formatUnits(tokenSupply.toString(), 18)}`)

    const tokenArgs = [tokenSupply]
    const token = await deploy("ExoticToken", {
        contract: "ExoticToken",
        from: deployer,
        args: tokenArgs, //
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(token.address, tokenArgs)
    }

    log("------------------------------------------")
}

module.exports.tags = ["token", "main"]
