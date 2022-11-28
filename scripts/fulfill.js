const { ethers, network } = require("hardhat")
const { BigNumber } = require("ethers")
const { developmentChains } = require("../helper-hardhat-config")

async function pullMulti() {
    const accounts = await ethers.getSigners()
    deployer = accounts[0]

    const gacha = await ethers.getContract("Gachapon")
    //const nft = await ethers.getContract("ExoticNFT")

    // const txRes = await gacha.connect(deployer).pullMulti()
    // const txReceipt = await txRes.wait(1)
    // const reqId = txReceipt.events[2].args.requestId
    // console.log("Pull request: " + reqId)

    const reqId = BigNumber.from(1)

    if (developmentChains.includes(network.name)) {
        const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        await vrfCoordinatorV2Mock.fulfillRandomWords(reqId, gacha.address)
    } else {
        console.log("not in developmentChains")
    }
}

pullMulti()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
