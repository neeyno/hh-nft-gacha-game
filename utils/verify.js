const { run } = require("hardhat")

// async function verify(contractAddress, args) {
const verify = async (contractAddress, args, contractName) => {
    console.log("Verifying contract ...")
    try {
        await run("verify:verify", {
            contract: contractName,
            address: contractAddress,
            constructorArguments: args,
        })
    } catch (e) {
        if (e.message.toLowerCase().includes("already verified")) {
            console.log("Already verified!")
        } else {
            console.log(e)
        }
    }
}

module.exports = { verify }

// await run("verify:verify", {
//     address: contractAddress,
//     constructorArguments: args,
//     contract: "contracts/Name.sol:ContractName",
// })
