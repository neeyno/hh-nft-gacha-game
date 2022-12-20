const { network, ethers } = require("hardhat")
require("dotenv").config()
const fs = require("fs")

const FRONTEND_ADDRESSES_FILE = "../nextjs-nft-gg/lib/contractAddresses.json"
const FRONTEND_ABI_LOCATION = "../nextjs-nft-gg/lib/"

module.exports = async function ({ getNamedAccounts, deployments }) {
    if (process.env.UPDATE_FRONTEND) {
        console.log("Updating frontend")
        await updateContractAddresses()
        await updateAbi()
        console.log("------------------------------------------")
    }
}

async function updateContractAddresses() {
    const gacha = await ethers.getContract("Gachapon")
    const nftAddress = await gacha.getNftAddress()
    const tokenAddress = await gacha.getTokenAddress()
    const token = await ethers.getContractAt("ExoticToken", tokenAddress)
    const nft = await ethers.getContractAt("ExoNFT", nftAddress)
    // const { deploy, log, get } = deployments

    // const nft = await get("ExoticNFT")
    // const token = await get("ExoticToken")
    // const gacha = await get("Gachapon")

    const contractAddresses = JSON.parse(fs.readFileSync(FRONTEND_ADDRESSES_FILE, "utf8"))
    const chainId = network.config.chainId.toString()

    if (chainId in contractAddresses) {
        if (!contractAddresses[chainId]["Gachapon"].includes(gacha.address)) {
            contractAddresses[chainId]["Gachapon"].push(gacha.address)
        }
        if (!contractAddresses[chainId]["ExoNFT"].includes(nftAddress)) {
            contractAddresses[chainId]["ExoNFT"].push(nftAddress)
        }
        if (!contractAddresses[chainId]["ExoticToken"].includes(tokenAddress)) {
            contractAddresses[chainId]["ExoticToken"].push(tokenAddress)
        }
    } else {
        contractAddresses[chainId] = {
            Gachapon: [gacha.address],
            ExoNFT: [nft.address],
            ExoticToken: [token.address],
        }
    }

    fs.writeFileSync(FRONTEND_ADDRESSES_FILE, JSON.stringify(contractAddresses))
}

async function updateAbi() {
    const gacha = await ethers.getContract("Gachapon")
    fs.writeFileSync(
        `${FRONTEND_ABI_LOCATION}gachaAbi.json`,
        gacha.interface.format(ethers.utils.FormatTypes.json)
    )

    const nft = await ethers.getContractAt("ExoNFT", await gacha.getNftAddress())
    fs.writeFileSync(
        `${FRONTEND_ABI_LOCATION}nftAbi.json`,
        nft.interface.format(ethers.utils.FormatTypes.json)
    )

    const token = await ethers.getContractAt("ExoticToken", await gacha.getTokenAddress())
    fs.writeFileSync(
        `${FRONTEND_ABI_LOCATION}tokenAbi.json`,
        token.interface.format(ethers.utils.FormatTypes.json)
    )
}

module.exports.tags = ["all", "frontend"]
