const { ethers, network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

async function pullMulti() {
    const accounts = await ethers.getSigners()
    deployer = accounts[0]

    const gacha = await ethers.getContract("Gachapon")
    const nft = await ethers.getContract("GachaNFT")

    const txRes = await gacha.connect(deployer).pullMulti()
    const txReceipt = await txRes.wait(1)
    const reqId = txReceipt.events[1].args.requestId
    console.log("Pull request: " + reqId)

    const filter = gacha.filters.FulfilledMulti(reqId)

    await new Promise(async (resolve, reject) => {
        // setting up the listener
        gacha.once(filter, async (requestId, owner, nftId) => {
            try {
                console.log("Request fulfilled multi!")
                console.log([requestId.toString(), owner, nftId.toString()])
                // const playerBalance = await nft.balanceOf(owner, nftId)
                // console.log(`Balance: ${playerBalance.toString()}`)

                resolve()
            } catch (error) {
                console.log(error)
                reject(error)
            }
        })

        // fire the event, and the listener will pick it up

        if (developmentChains.includes(network.name)) {
            const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
            await vrfCoordinatorV2Mock.fulfillRandomWords(reqId, gacha.address)
        }
    })
}

pullMulti()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
