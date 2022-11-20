const { assert, expect } = require("chai")
const { BigNumber } = require("ethers")
const { ethers, deployments, network } = require("hardhat")
const { developmentChains, CHANCE_ARRAY } = require("../../helper-hardhat-config")

const chainId = network.config.chainId

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Gacha unit test", function () {
          let token, nft, gacha, vrfCoordinatorV2Mock, deployer, player

          before(async () => {
              const accounts = await ethers.getSigners()
              deployer = accounts[0]
              player = accounts[1]
          })

          beforeEach(async function () {
              await deployments.fixture(["mock", "main", "setup"])
              nft = await ethers.getContract("GachaNFT")
              token = await ethers.getContract("ExoticToken")
              gacha = await ethers.getContract("Gachapon")
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
          })

          describe("Contructor", function () {
              it("should set nft contract address", async function () {
                  const nftAddress = await gacha.getNftAddress()
                  assert.equal(nftAddress, nft.address)
              })

              it("should set VRFCoordinatorV2 address", async function () {
                  const vrfAddress = await gacha.getVrfCoordinator()
                  assert.equal(vrfAddress, vrfCoordinatorV2Mock.address)
              })

              it("initializes with given chance array", async function () {
                  const actualChances = await gacha.getChanceArray()
                  assert.equal(actualChances.toString(), CHANCE_ARRAY.toString())
              })
          })

          describe("Single pull", function () {
              //it("should be playable", async () => {})

              it("records player when they pull", async () => {
                  const txRes = await gacha.connect(player).pullSingle()
                  const txReceipt = await txRes.wait(1)
                  const { requestId, sender, numWords } = txReceipt.events[1].args

                  const contractPlayer = await gacha.getUserByRequest(requestId)

                  assert.equal(contractPlayer, player.address)
                  assert.equal(sender, player.address)
              })

              it("emits event on single pull", async () => {
                  await expect(gacha.connect(player).pullSingle())
                      .to.emit(gacha, "PullRequest")
                      .withArgs(BigNumber.from(1), player.address, BigNumber.from(1))
              })

              it("vrf coordinator receives the request", async function () {
                  await expect(gacha.connect(player).pullSingle()).to.emit(
                      vrfCoordinatorV2Mock,
                      "RandomWordsRequested"
                  )
              })
          })
          describe("Multi pull", function () {
              it("records player when they pull", async () => {
                  const txRes = await gacha.connect(player).pullMulti()
                  const txReceipt = await txRes.wait(1)
                  const { requestId, sender } = txReceipt.events[1].args

                  const contractPlayer = await gacha.getUserByRequest(requestId)

                  assert.equal(contractPlayer, player.address)
                  assert.equal(sender, player.address)
              })

              it("emits event on multi pull", async () => {
                  await expect(gacha.connect(player).pullMulti())
                      .to.emit(gacha, "PullRequest")
                      .withArgs(BigNumber.from(1), player.address, BigNumber.from(10))
              })

              it("vrf coordinator receives the request", async function () {
                  await expect(gacha.connect(player).pullMulti()).to.emit(
                      vrfCoordinatorV2Mock,
                      "RandomWordsRequested"
                  )
              })
          })

          describe("fulfillRandomWords Single", function () {
              it("should transfer Single nft", async () => {
                  const tx = await gacha.connect(player).pullSingle()
                  const txReceipt = await tx.wait(1)
                  const requestId = txReceipt.events[1].args.requestId

                  const filter = nft.filters.TransferSingle(gacha.address)

                  await new Promise(async (resolve, reject) => {
                      // setting up the listener
                      nft.once(filter, async (operator, from, to, id, value) => {
                          try {
                              //console.log(operator, from, to, id, value)
                              const playerBalance = await nft.balanceOf(player.address, id)
                              assert.equal(operator, gacha.address)
                              assert.equal(from, gacha.address)
                              assert.equal(to, player.address)
                              assert.equal(value.toString(), "1")
                              assert.equal(playerBalance.toString(), "1")

                              resolve()
                          } catch (error) {
                              console.log(error)
                              reject(error)
                          }
                      })

                      // fire the event, and the listener will pick it up
                      await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, gacha.address)
                      console.log("...")
                  })
              })

              it("fulfills Single pull and emits event", async () => {
                  const tx = await gacha.connect(player).pullSingle()
                  const txReceipt = await tx.wait(1)
                  const pullRequestId = txReceipt.events[1].args.requestId

                  await new Promise(async (resolve, reject) => {
                      // setting up the listener
                      gacha.once("FulfilledSingle", async (requestId, owner, nftId) => {
                          try {
                              const playerBalance = await nft.balanceOf(owner, nftId)

                              assert.equal(owner, player.address)
                              assert.equal(requestId.toString(), pullRequestId.toString())
                              assert.equal(playerBalance.toString(), "1")

                              resolve()
                          } catch (error) {
                              console.log(error)
                              reject(error)
                          }
                      })

                      // fire the event, and the listener will pick it up
                      await vrfCoordinatorV2Mock.fulfillRandomWords(pullRequestId, gacha.address)
                      console.log("...")
                  })
              })
          })
          describe("fulfillRandomWords Multi", function () {
              it("should transfer Multiple nft", async () => {
                  const tx = await gacha.connect(player).pullMulti()
                  const txReceipt = await tx.wait(1)
                  const requestId = txReceipt.events[1].args.requestId

                  const filter = nft.filters.TransferBatch(gacha.address)

                  await new Promise(async (resolve, reject) => {
                      // setting up the listener
                      nft.once(filter, async (operator, from, to, ids, amounts) => {
                          try {
                              //console.log(operator, from, to, id, value)
                              let playerIds = [...Array(10)].map((_) => player.address)
                              //playerIds.apply(null, Array(10)).map((_) => player.address) // ['addr', 'addr', ...]
                              const playerBalance = await nft.balanceOfBatch(playerIds, ids)

                              assert.equal(operator, gacha.address)
                              assert.equal(from, gacha.address)
                              assert.equal(to, player.address)

                              console.log(playerBalance.toString())
                              console.log(ids.toString())

                              resolve()
                          } catch (error) {
                              console.log(error)
                              reject(error)
                          }
                      })

                      // fire the event, and the listener will pick it up
                      await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, gacha.address)
                      console.log("...")
                  })
              })

              it("fulfills Multi pull and emits event", async () => {
                  const tx = await gacha.connect(player).pullMulti()
                  const txReceipt = await tx.wait(1)
                  const pullRequestId = txReceipt.events[1].args.requestId

                  await new Promise(async (resolve, reject) => {
                      // setting up the listener
                      gacha.once("FulfilledMulti", async (requestId, owner, nftId) => {
                          try {
                              let playerIds = [...Array(10)].map((_) => player.address)
                              //playerIds.apply(null, Array(10)).map((_) => player.address) // ['addr', 'addr', ...]
                              const playerBalance = await nft.balanceOfBatch(playerIds, nftId)

                              assert.equal(owner, player.address)
                              assert.equal(requestId.toString(), pullRequestId.toString())
                              console.log(playerBalance.toString())
                              console.log(nftId.toString())

                              resolve()
                          } catch (error) {
                              console.log(error)
                              reject(error)
                          }
                      })

                      // fire the event, and the listener will pick it up
                      await vrfCoordinatorV2Mock.fulfillRandomWords(pullRequestId, gacha.address)
                      console.log("...")
                  })
              })
          })
      })
