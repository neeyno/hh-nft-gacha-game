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
              nft = await ethers.getContract("ExoticNFT")
              //token = await ethers.getContract("ExoticToken")
              gacha = await ethers.getContract("Gachapon")
          })

          describe("fulfillRandomWords", function () {
              it("should request random number from VRF Chainlink and fulfill single pull", async () => {
                  const txResponse = await gacha.connect(deployer).pullSingle()
                  const txReceipt = await txResponse.wait(1)
                  const pullRequestId = txReceipt.events[2].args.requestId
                  const filter = gacha.filters.PullFulfilled(pullRequestId)
                  console.log("...")

                  await new Promise(async (resolve, reject) => {
                      // setting up the listener
                      gacha.once(filter, async (requestId, owner, nftId) => {
                          try {
                              console.log("PullFulfilled! nft id: " + nftId.toString())
                              const playerBalance = await nft.balanceOf(deployer.address, nftId[0])

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
                  })
              })
              it("should request random number from VRF Chainlink and fulfill multi pull", async () => {
                  const txResponse = await gacha.connect(deployer).pullMulti()
                  const txReceipt = await txResponse.wait(1)
                  const pullRequestId = txReceipt.events[2].args.requestId
                  const filter = gacha.filters.PullFulfilled(pullRequestId)
                  console.log("...")

                  await new Promise(async (resolve, reject) => {
                      // setting up the listener
                      gacha.once(filter, async (requestId, owner, nftId) => {
                          try {
                              console.log("PullFulfilled! nft ids: " + nftId.toString())
                              const addrArray = [...Array(3)].map((_) => deployer.address)

                              const batchBalance = await nft.balanceOfBatch(addrArray, [0, 1, 2])
                              let totalDeployerBalance = BigNumber.from(1) // 1(not 0) - because of previous single pull
                              batchBalance.map((value) => {
                                  totalDeployerBalance = totalDeployerBalance.add(value)
                              })

                              assert.equal(owner, deployer.address)
                              assert.equal(requestId.toString(), pullRequestId.toString())
                              assert.equal(totalDeployerBalance.toString(), "11")

                              resolve()
                          } catch (error) {
                              console.log(error)
                              reject(error)
                          }
                      })

                      // fire the event, and the listener will pick it up
                  })
              })
          })
      })
