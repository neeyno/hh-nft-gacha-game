const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig, NFT_SUPPLY } = require("../helper-hardhat-config")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    const nft = await ethers.getContract("ExoticNFT", deployer)
    const token = await ethers.getContract("ExoticToken", deployer)
    const gacha = await ethers.getContract("Gachapon", deployer)

    await gacha.setNft(nft.address)
    await gacha.setToken(token.address)

    const addrArray = [...Array(NFT_SUPPLY.length)].map((_) => gacha.address)
    const idArray = [...Array(NFT_SUPPLY.length)].map((_, i) => i)

    const tx = await nft.safeBatchTransferFrom(deployer, gacha.address, idArray, NFT_SUPPLY, "0x")
    await tx.wait(1)

    const gachaNftBalances = await nft.balanceOfBatch(addrArray, idArray)
    log(`Gacha nft balance: ${gachaNftBalances.toString()}`)

    log("------------------------------------------")
}

module.exports.tags = ["setup"]
