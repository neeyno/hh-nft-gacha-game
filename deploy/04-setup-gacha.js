const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    //const tokenSupply = ethers.utils.parseEther("35800")
    const nftValue = [100, 1000, 10000]
    const nftSupply = networkConfig[chainId]["nftSupply"]
    let supply = 0
    nftValue.forEach((value, i) => {
        supply += value * nftSupply[i]
    })
    //const tokenSupply = ethers.utils.parseUnits(supply.toString(), 18)

    const nft = await ethers.getContract("GachaNFT", deployer)
    //const token = await ethers.getContract("ExoticToken", deployer)
    const gacha = await ethers.getContract("Gachapon", deployer)

    //await token.transfer(nft.address, tokenSupply)

    for (let id = 0; id < nftSupply.length; id++) {
        await nft.safeTransferFrom(deployer, gacha.address, id, nftSupply[id], "0x")
    }

    //const tokenBalance = await token.balanceOf(nft.address)

    let nftBalance = []
    for (let id = 0; id < nftSupply.length; id++) {
        const idBalance = await nft.balanceOf(gacha.address, id)
        nftBalance.push(idBalance.toString())
    }

    //log(`Gacha token balance: ${ethers.utils.formatUnits(tokenBalance, 18)}`)
    log(`Gacha nft balance: ${nftBalance}`)

    log("------------------------------------------")
}

module.exports.tags = ["setup"]
