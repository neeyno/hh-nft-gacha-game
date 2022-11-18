const { network, ethers } = require("hardhat")
const { networkConfig } = require("../helper-hardhat-config")

async function balance() {
    const accounts = await ethers.getSigners()
    deployer = accounts[0]
    const chainId = network.config.chainId

    const gacha = await ethers.getContract("Gachapon")
    const nft = await ethers.getContract("GachaNFT")
    const nftSupply = networkConfig[chainId]["nftSupply"]

    let nftBalance = []
    for (let id = 0; id < nftSupply.length - 1; id++) {
        const idBalance = await nft.balanceOf(gacha.address, id)
        nftBalance.push(idBalance.toString())
    }

    console.log(`Gacha nft balance: ${nftBalance}`)

    console.log("------------------------------------------")
}

balance()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
