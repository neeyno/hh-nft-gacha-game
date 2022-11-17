const { assert, expect } = require("chai")
const { BigNumber } = require("ethers")
const { ethers, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

const chainId = network.config.chainId

developmentChains.includes(network.name)
    ? describe.skip
    : describe("Gacha staging test", function () {
          let token, nft, gacha, deployer, player

          before(async () => {
              const accounts = await ethers.getSigners()
              deployer = accounts[0]
              //player = accounts[1]
          })

          beforeEach(async function () {
              nft = await ethers.getContract("GachaNFT")
              //token = await ethers.getContract("ExoticToken")
              gacha = await ethers.getContract("Gachapon")
          })

          describe("fulfillRandomWords", function () {
              it("should request and fulfill single pull, give random number from VRF Chainlink", async () => {
                  let pullRequestId

                  await new Promise(async (resolve, reject) => {
                      // setting up the listener
                      gacha.once("PullFulfilled", async (requestId, owner, nftId) => {
                          try {
                              console.log("... PullFulfilled! nft id: " + nftId)
                              const playerBalance = await nft.balanceOf(owner, nftId)

                              assert.equal(owner, deployer.address)
                              assert.equal(requestId.toString(), pullRequestId.toString())
                              assert.equal(playerBalance.toString(), "1")

                              resolve()
                          } catch (error) {
                              console.log(error)
                              reject(error)
                          }
                      })

                      // fire the event, and the listener will pick it up

                      const txResponse = await gacha.connect(deployer).pullSingle()
                      const txReceipt = await txResponse.wait(1)
                      pullRequestId = txReceipt.events[1].args.requestId
                      console.log("...")
                  })
              })
          })
      })
