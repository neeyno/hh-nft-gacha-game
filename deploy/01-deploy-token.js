const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { developmentChains, networkConfig, NFT_SUPPLY } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    const tokenSupply = ethers.utils.parseUnits("1000", 18)
    //const gacha = await ethers.getContract("Gachapon")

    const tokenArgs = [] //[tokenSupply]
    const token = await deploy("ExoticToken", {
        contract: "ExoticToken",
        from: deployer,
        args: tokenArgs, //
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(token.address, tokenArgs, `${token.sourceName}:${token.contractName}`)
    }

    log("------------------------------------------")
}

module.exports.tags = ["token", "main"]
