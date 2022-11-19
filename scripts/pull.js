const { ethers } = require("hardhat")

async function pullSingle() {
    const accounts = await ethers.getSigners()
    deployer = accounts[0]

    const gacha = await ethers.getContract("Gachapon")
    const nft = await ethers.getContract("GachaNFT")

    await new Promise(async (resolve, reject) => {
        // setting up the listener
        gacha.once("PullFulfilled", async (requestId, owner, nftId) => {
            try {
                console.log("PullFulfilled!")
                console.log([requestId.toString(), owner, nftId.toString()])
                const playerBalance = await nft.balanceOf(owner, nftId)
                console.log(`Balance: ${playerBalance.toString()}`)

                resolve()
            } catch (error) {
                console.log(error)
                reject(error)
            }
        })

        // fire the event, and the listener will pick it up

        const txRes = await gacha.connect(deployer).pullSingle()
        const txReceipt = await txRes.wait(1)
        const { requestId, sender } = txReceipt.events[1].args

        console.log(requestId + " Pull requested...")

        await txRes.wait(3)
    })
}

pullSingle()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
