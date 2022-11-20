const { network } = require("hardhat")
const { developmentChains, networkConfig, NFT_SUPPLY } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const { storeImages } = require("../utils/uploadToPinata")

const imagesLocation = "./images/"

const metadataTemplate = {
    name: "",
    description: "",
    image: "",
    attributes: [
        {
            trait_type: "type",
            value: 100,
        },
    ],
}

//const IMAGE_URIs = [
let imageURI = [
    "ipfs://QmdhBcooiGJ3PVG1eH7FAXH6sbwWbTatYFR5xRrC5nAdJi",
    "ipfs://Qmd7mYEzVqpaFBwb1WYkw1ViAGmKvvKk5v7kdiaJZwekKW",
    "ipfs://QmXcpktmQNbefo3c77N5aPWpZMmhUrHnbQG4EwfRPqkp8p",
]

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    // get the ipfs hashes of images
    // 1. own IPFS node, 2. Pinata, 3. nft.storage

    if (process.env.UPLOAD_TO_PINATA == "true") {
        log("uploading to Pinata...")
        //tokenURIs = await handleTokenURIs()
        imageURI = await handleImageURIs()
        log("------------------------------------------")
    }
    // await storeImages(imagesLocation)

    // const nftSupply = networkConfig[chainId]["nftSupply"]
    // const rarity = nftSupply.slice(0, -1)
    const nftArgs = [imageURI, NFT_SUPPLY]

    const nft = await deploy("GachaNFT", {
        contract: "GachaNFT",
        from: deployer,
        args: nftArgs,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    // if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    //     log("verifying...")
    //     await verify(nft.address, nftArgs)
    // }

    log("------------------------------------------")
}

async function handleImageURIs() {
    const imageUris = []
    const { responsesArray: imageUploadResponsesArray, files } = await storeImages(imagesLocation)

    // store the image in ipfs
    for (imageId in imageUploadResponsesArray) {
        const hash = `ipfs://${imageUploadResponsesArray[imageId].IpfsHash}`
        imageUris.push(hash)
        log(imageId + ": " + hash)
    }
    log("Images uploaded!")
    return imageUris
}

async function handleTokenURIs() {
    const tokenUris = []
    // store the image in ipfs
    // store the metadata in ipfs
    const { responsesArray: imageUploadResponses, files } = await storeImages(imagesLocation)

    for (imageUploadResponseId in imageUploadResponses) {
        // create metadata
        // upload metadata
        let tokenURIMetadata = { ...metadataTemplate }
        tokenURIMetadata.name = files[imageUploadResponseId].replace(".png", "")
        tokenURIMetadata.description = `Some random graphic content ${tokenURIMetadata.name}`
        tokenURIMetadata.image = `ipfs://${imageUploadResponses[imageUploadResponseId].IpfsHash}`
        console.log(`Uploading ${tokenURIMetadata.name}...`)

        // store JSON to Pinata/IPFS
        const metadataUploadResponse = await storeTokenURIMetadata(tokenURIMetadata)
        tokenUris.push(`ipfs://${metadataUploadResponse.IpfsHash}`)
    }
    console.log("Token URIs uploaded!")
    console.log(tokenUris)
    return tokenUris
}

module.exports.tags = ["nft", "main"]
