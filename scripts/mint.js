const { ethers, network } = require("hardhat")
//const { developmentChains } = require("../helper-hardhat-config")

const amountInEth = "500"
const address = "0xEadf072FF241DD8CA1DC63DE3D2831Da520840Fd"

async function pullMulti(address, amount) {
    const accounts = await ethers.getSigners()
    deployer = accounts[0]

    const amountMint = ethers.utils.parseUnits(amount, 18)
    const addressTo = address || deployer.address

    // const gacha = await ethers.getContract("Gachapon")
    // const nft = await ethers.getContract("ExoticNFT")
    const token = await ethers.getContract("ExoticToken", deployer)

    const txResponse = await token.mint(addressTo, amountMint)
    await txResponse.wait(1)

    console.log("------------------------------------------")
}

pullMulti(address, amountInEth)
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
