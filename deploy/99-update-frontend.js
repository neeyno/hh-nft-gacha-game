const { network, ethers } = require("hardhat")
const fs = require("fs")

const FRONTEND_ADDRESSES_FILE = "../nextjs-nft-gg/lib/contractAddresses.json"
const FRONTEND_ABI_LOCATION = "../nextjs-nft-gg/lib/"

module.exports = async function ({ deployments }) {
    if (process.env.UPDATE_FRONTEND === true) {
        console.log("Updating frontend")
        await updateContractAddresses(deployments)
        await updateAbi()
        console.log("------------------------------------------")
    }
}

async function updateContractAddresses(deployments) {
    const token = await ethers.getContract("ExoticToken")
    const nft = await ethers.getContract("ExoticNFT")
    const gacha = await ethers.getContract("Gachapon")
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
        if (!contractAddresses[chainId]["ExoticNFT"].includes(nft.address)) {
            contractAddresses[chainId]["ExoticNFT"].push(nft.address)
        }
        if (!contractAddresses[chainId]["ExoticToken"].includes(token.address)) {
            contractAddresses[chainId]["ExoticToken"].push(token.address)
        }
    } else {
        contractAddresses[chainId] = {
            Gachapon: [gacha.address],
            ExoticNFT: [nft.address],
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

    const nft = await ethers.getContract("ExoticNFT")
    fs.writeFileSync(
        `${FRONTEND_ABI_LOCATION}nftAbi.json`,
        nft.interface.format(ethers.utils.FormatTypes.json)
    )

    const token = await ethers.getContract("ExoticToken")
    fs.writeFileSync(
        `${FRONTEND_ABI_LOCATION}tokenAbi.json`,
        token.interface.format(ethers.utils.FormatTypes.json)
    )
}

module.exports.tags = ["all", "frontend"]
