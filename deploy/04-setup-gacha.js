const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    const tokenSupply = ethers.utils.parseEther("35800")
    const nftSupply = networkConfig[chainId]["nftSupply"]

    const nft = await ethers.getContract("GachaNFT", deployer)
    const token = await ethers.getContract("ExoticToken", deployer)
    const gacha = await ethers.getContract("Gachapon", deployer)

    await token.transfer(gacha.address, tokenSupply)

    for (let id = 0; id < nftSupply.length; id++) {
        await nft.safeTransferFrom(deployer, gacha.address, id, nftSupply[id], "0x")
    }

    const tokenBalance = await token.balanceOf(gacha.address)

    let nftBalance = []
    for (let id = 0; id < nftSupply.length; id++) {
        const idBalance = await nft.balanceOf(gacha.address, id)
        nftBalance.push(idBalance.toString())
    }
    console.log(`Gacha tokens: ${ethers.utils.formatUnits(tokenBalance, 18)}`)
    console.log(`Gacha nfs: ${nftBalance}`)
}
