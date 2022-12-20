const imagesLocation = "./images/"
const { storeImages } = require("../utils/uploadToPinata")

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

let imageURI = []

async function upload() {
    if (process.env.UPLOAD_TO_PINATA == "true") {
        console.log("uploading to Pinata...")
        //tokenURIs = await handleTokenURIs()
        imageURI = await handleImageURIs()
        console.log(imageURI)
        console.log("------------------------------------------")
    }
}

async function handleImageURIs() {
    const imageUris = []
    const { responsesArray: imageUploadResponsesArray, files } = await storeImages(imagesLocation)

    // store the image in ipfs
    for (imageId in imageUploadResponsesArray) {
        const hash = `ipfs://${imageUploadResponsesArray[imageId].IpfsHash}`
        imageUris.push(hash)
        console.log(imageId + ": " + hash)
    }
    console.log("Images uploaded!")
    return imageUris
}

upload()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
