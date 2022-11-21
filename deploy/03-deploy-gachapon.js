const { network } = require("hardhat")
const { developmentChains, networkConfig, CHANCE_ARRAY } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

const FUND_AMOUNT = "1000000000000000000000" // 1000 * 1e18

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log, get } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    const nft = await deployments.get("GachaNFT")
    const nftAddress = nft.address

    let vrfCoordinatorV2mock, vrfCoordinatorV2address, subscriptionId
    if (developmentChains.includes(network.name)) {
        log("getting mock...")
        //vrfCoordinatorV2mock = await deployments.get("VRFCoordinatorV2Mock")
        vrfCoordinatorV2mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
        vrfCoordinatorV2address = vrfCoordinatorV2mock.address

        // Create a subscription using the mock
        const txRes = await vrfCoordinatorV2mock.createSubscription()
        const txReceipt = await txRes.wait(1)
        subscriptionId = txReceipt.events[0].args.subId

        // Fund subscription using the mock
        await vrfCoordinatorV2mock.fundSubscription(subscriptionId.toNumber(), FUND_AMOUNT)
    } else {
        vrfCoordinatorV2address = networkConfig[chainId]["vrfCoordinatorV2"]
        subscriptionId = networkConfig[chainId]["subscriptionId"]
    }

    const gachaArgs = [
        nftAddress,
        CHANCE_ARRAY,
        vrfCoordinatorV2address,
        subscriptionId,
        networkConfig[chainId]["gasLane"],
        networkConfig[chainId]["callbackGasLimit"],
    ]

    const gacha = await deploy("Gachapon", {
        contract: "Gachapon",
        from: deployer,
        args: gachaArgs,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (developmentChains.includes(network.name)) {
        log("adding consumer...")
        await vrfCoordinatorV2mock.addConsumer(subscriptionId.toNumber(), gacha.address)
    }

    // if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    //     log("verifying...")
    //     await verify(gacha.address, gachaArgs)
    // }

    log("------------------------------------------")
}

module.exports.tags = ["gacha", "main"]
