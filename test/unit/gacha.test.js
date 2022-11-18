const { assert, expect } = require("chai")
const { BigNumber } = require("ethers")
const { ethers, deployments, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

const chainId = network.config.chainId
// const INITIAL_ETH_LIQUIDITY = networkConfig[chainId]["initEthLiquidity"]
// const INITIAL_TOKEN_LIQUIDITY = networkConfig[chainId]["initTokenLiquidity"]

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
                  const expectedChances = networkConfig[chainId]["nftSupply"]
                  //expectedChances.forEach((value) => (expectedMaxChanceValue += value))

                  const actualChances = await gacha.getChanceArray()
                  //const actualMaxChanceVal = await gacha.getMaxChance()

                  //assert.equal(actualMaxChanceVal.toString(), expectedMaxChanceValue.toString())
                  assert.equal(actualChances.toString(), expectedChances.toString())
              })
          })

          describe("Single pull", function () {
              //it("should be playable", async () => {})

              it("records player when they pull", async () => {
                  const txRes = await gacha.connect(player).pullSingle()
                  const txReceipt = await txRes.wait(1)
                  const { requestId, sender } = txReceipt.events[1].args

                  const contractPlayer = await gacha.getUserByRequest(requestId)

                  assert.equal(contractPlayer, player.address)
                  assert.equal(sender, player.address)
              })

              it("emits event on pull", async () => {
                  await expect(gacha.connect(player).pullSingle())
                      .to.emit(gacha, "PullRequested")
                      .withArgs(BigNumber.from(1), player.address)
              })

              it("vrf coordinator should receive the request", async function () {
                  await expect(gacha.connect(player).pullSingle()).to.emit(
                      vrfCoordinatorV2Mock,
                      "RandomWordsRequested"
                  )
              })
          })

          describe("fulfillRandomWords", function () {
              it("should transfer nft", async () => {
                  //   await network.provider.send("evm_increaseTime", [])
                  //   await network.provider.send("evm_mine", [])

                  const tx = await gacha.connect(player).pullSingle()
                  const txReceipt = await tx.wait(1)
                  const requestId = txReceipt.events[1].args.requestId

                  const filter = nft.filters.TransferSingle(gacha.address)

                  await new Promise(async (resolve, reject) => {
                      // setting up the listener
                      nft.once(filter, async (operator, from, to, id, value) => {
                          console.log("...")
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
                  })
              })

              it("fulfills requested pull and emits event", async () => {
                  const tx = await gacha.connect(player).pullSingle()
                  const txReceipt = await tx.wait(1)
                  const pullRequestId = txReceipt.events[1].args.requestId

                  await new Promise(async (resolve, reject) => {
                      // setting up the listener
                      gacha.once("PullFulfilled", async (requestId, owner, nftId) => {
                          console.log("...")
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
                  })
              })
          })
      })
