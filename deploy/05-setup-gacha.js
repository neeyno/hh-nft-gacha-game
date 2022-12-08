const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig, CHANCE_ARRAY } = require("../helper-hardhat-config")
const { genArray } = require("../utils/genArray")

let imageURI = [
    "QmX9p4ntWLY5TgKnMQCG6m3vQeUjGcSjJX5aFG31iXnmnU",
    "QmX9p4ntWLY5TgKnMQCG6m3vQeUjGcSjJX5aFG31iXnmnU",
    "QmX9p4ntWLY5TgKnMQCG6m3vQeUjGcSjJX5aFG31iXnmnU",
    "QmSvPV6zVwcwzkXu14eLQsbKn9f3F7fHbbuZQLc1dw4v1e",
    "QmSvPV6zVwcwzkXu14eLQsbKn9f3F7fHbbuZQLc1dw4v1e",
    "QmSvPV6zVwcwzkXu14eLQsbKn9f3F7fHbbuZQLc1dw4v1e",
    "QmS3XLUz1124a26d3VhNt7FGwS7PixfC8Y8ShDDnQqGKiN",
    "QmS3XLUz1124a26d3VhNt7FGwS7PixfC8Y8ShDDnQqGKiN",
    "QmS3XLUz1124a26d3VhNt7FGwS7PixfC8Y8ShDDnQqGKiN",
]

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    const abi = ethers.utils.defaultAbiCoder

    // const nft = await ethers.getContract("ExoticNFT", deployer)
    // const token = await ethers.getContract("ExoticToken", deployer)
    const nft = await ethers.getContractFactory("ExoticNFT")
    const token = await ethers.getContractFactory("ExoticToken")

    // ExoticNFT bytecode
    const idsArray = genArray(CHANCE_ARRAY)
    //abi.encodePacked(bytecode, abi.encode(x, y))
    const nftArgs = abi.encode(["string[9]"], [imageURI]) //, idsArray])
    const nftCode = ethers.utils.solidityPack(["bytes", "bytes"], [nft.bytecode, nftArgs])

    // ExoticToken bytecode
    //abi.encodePacked(bytecode, abi.encode(x, y))
    const tokenCode = token.bytecode //ethers.utils.solidityPack("bytes", token.bytecode)

    const gacha = await ethers.getContract("Gachapon", deployer)

    try {
        await gacha.setNft(nftCode)
        await gacha.setToken(tokenCode)
    } catch (error) {
        console.log(error)
    }
    // const addrArray = [...Array(NFT_SUPPLY.length)].map((_) => gacha.address)
    // const idArray = [...Array(NFT_SUPPLY.length)].map((_, i) => i)
    // const tx = await nft.safeBatchTransferFrom(deployer, gacha.address, idArray, NFT_SUPPLY, "0x")
    // await tx.wait(1)
    // const gachaNftBalances = await nft.balanceOfBatch(addrArray, idArray)
    // log(`Gacha nft balance: ${gachaNftBalances.toString()}`)

    const nftAddress = await gacha.getNftAddress()
    const tokenAddress = await gacha.getTokenAddress()

    log(`nft address: ${nftAddress}\ntoken address: ${tokenAddress}`)

    log("------------------------------------------")
}

module.exports.tags = ["setup"]
