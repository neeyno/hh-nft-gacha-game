const { network, ethers } = require("hardhat")
const { networkConfig, NFT_SUPPLY } = require("../helper-hardhat-config")

async function balance() {
    const accounts = await ethers.getSigners()
    deployer = accounts[0]
    const chainId = network.config.chainId

    const gacha = await ethers.getContract("Gachapon")
    const nft = await ethers.getContract("ExoticNFT")
    //const nftSupply = networkConfig[chainId]["nftSupply"]

    const addrArray = [...Array(NFT_SUPPLY.length)].map((_) => gacha.address)
    const idArray = [...Array(NFT_SUPPLY.length)].map((_, i) => i)

    const gachaNftBalances = await nft.balanceOfBatch(addrArray, idArray)
    console.log(`Gacha nft balance: ${gachaNftBalances.toString()}`)

    console.log("------------------------------------------")
}

balance()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
