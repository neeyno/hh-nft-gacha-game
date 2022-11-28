const { ethers, network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

async function pullSingle() {
    const accounts = await ethers.getSigners()
    deployer = accounts[0]

    const gacha = await ethers.getContract("Gachapon")
    const nft = await ethers.getContract("ExoticNFT")

    const txRes = await gacha.connect(deployer).pullSingle()
    const txReceipt = await txRes.wait(1)
    const reqtId = txReceipt.events[2].args.requestId

    console.log("Pull request: " + reqtId)

    const filter = gacha.filters.PullFulfilled(reqtId)

    await new Promise(async (resolve, reject) => {
        // setting up the listener
        gacha.once(filter, async (requestId, owner, nftId) => {
            try {
                console.log("Request fulfilled!")
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
            await vrfCoordinatorV2Mock.fulfillRandomWords(reqtId, gacha.address)
        }
    })
}

pullSingle()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
