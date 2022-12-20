const { assert, expect } = require("chai")
const { BigNumber } = require("ethers")
const { ethers, deployments, network } = require("hardhat")
const { developmentChains, networkConfig, CHANCE_ARRAY } = require("../../helper-hardhat-config")

const chainId = network.config.chainId

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Gacha unit test", function () {
          let token, nft, gacha, vrfCoordinatorV2Mock, deployer, player

          const FEE_SINGLE = ethers.utils.parseUnits("50", 18)
          const FEE_MULTI = ethers.utils.parseUnits("500", 18)
          const TOKEN_PACK_PRICE = networkConfig[chainId]["tokenPrice"]

          before(async () => {
              const accounts = await ethers.getSigners()
              deployer = accounts[0]
              player = accounts[1]
          })

          beforeEach(async function () {
              await deployments.fixture(["mock", "main", "setup"])
              gacha = await ethers.getContract("Gachapon")
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")

              nft = await ethers.getContractAt("ExoNFT", await gacha.getNftAddress())
              token = await ethers.getContractAt("ExoticToken", await gacha.getTokenAddress())
          })

          describe("Contructor", function () {
              it("should set VRFCoordinatorV2 address", async function () {
                  const vrfAddress = await gacha.getVrfCoordinator()
                  assert.equal(vrfAddress, vrfCoordinatorV2Mock.address)
              })

              it("should set token pack price", async function () {
                  const packPrice = await gacha.getPackPrice()
                  assert.equal(packPrice.toString(), TOKEN_PACK_PRICE)
              })
          })

          describe("Setup gacha", function () {
              it("deploys nft contract and sets max chance value", async function () {
                  const nftAddress = await gacha.getNftAddress()
                  expect(nftAddress).to.be.properAddress

                  const maxChanceVal = await gacha.getMaxChance()
                  assert.equal(maxChanceVal.toString(), "444")
              })

              it("deploys token contract", async function () {
                  const tokenAddress = await gacha.getTokenAddress()
                  expect(tokenAddress).to.be.properAddress
              })
          })

          describe("Buy token pack", function () {
              it("reverts if player doesn't send enouth ETH", async () => {
                  await expect(gacha.connect(player).buyTokenPack()).to.be.revertedWith(
                      "Gacha_InsufficientValue()"
                  )
              })

              it("mints tokens to the buyer", async () => {
                  await expect(() =>
                      gacha.connect(player).buyTokenPack({ value: TOKEN_PACK_PRICE })
                  ).to.changeTokenBalance(token, player, ethers.utils.parseUnits("1421", 18))
              })
          })

          describe("Single pull", function () {
              beforeEach(async function () {
                  await gacha.connect(player).buyTokenPack({ value: TOKEN_PACK_PRICE })
              })

              it("reverts if the player has insufficient token balance", async () => {
                  await expect(gacha.connect(deployer).pullSingle()).to.be.revertedWith(
                      "ERC20: burn amount exceeds balance"
                  )
              })

              it("tracks player when they pull", async () => {
                  const txRes = await gacha.connect(player).pullSingle()
                  const txReceipt = await txRes.wait(1)
                  const { requestId, sender, numWords } = txReceipt.events[2].args

                  const contractPlayer = await gacha.getUserByRequest(requestId)

                  assert.equal(contractPlayer, player.address)
                  assert.equal(sender, player.address)
              })

              it("emits event on single pull", async () => {
                  await expect(gacha.connect(player).pullSingle())
                      .to.emit(gacha, "PullRequested")
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
              beforeEach(async function () {
                  gacha.connect(player).buyTokenPack({ value: TOKEN_PACK_PRICE })
              })

              it("reverts if the player has insufficient balance", async () => {
                  await expect(gacha.connect(deployer).pullMulti()).to.be.revertedWith(
                      "ERC20: burn amount exceeds balance"
                  )
              })

              it("tracks player when they pull", async () => {
                  const txRes = await gacha.connect(player).pullMulti()
                  const txReceipt = await txRes.wait(1)
                  const { requestId, sender } = txReceipt.events[2].args

                  const contractPlayer = await gacha.getUserByRequest(requestId)

                  assert.equal(contractPlayer, player.address)
                  assert.equal(sender, player.address)
              })

              it("emits event on multi pull", async () => {
                  await expect(gacha.connect(player).pullMulti())
                      .to.emit(gacha, "PullRequested")
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
              beforeEach(async function () {
                  gacha.connect(player).buyTokenPack({ value: TOKEN_PACK_PRICE })
              })
              it("should transfer Single nft", async () => {
                  const tx = await gacha.connect(player).pullSingle()
                  const txReceipt = await tx.wait(1)
                  const requestId = txReceipt.events[2].args.requestId

                  const filter = nft.filters.TransferSingle(gacha.address)

                  await new Promise(async (resolve, reject) => {
                      // setting up the listener
                      nft.once(filter, async (operator, from, to, id, value) => {
                          try {
                              const addrArray = [...Array(12)].map((_) => player.address)
                              const idArray = [...Array(12)].map((_, i) => i)
                              const batchBalance = await nft.balanceOfBatch(addrArray, idArray)
                              let totalPlayerBalance = BigNumber.from(0)
                              batchBalance.map((value) => {
                                  totalPlayerBalance = totalPlayerBalance.add(value)
                              })

                              assert.equal(operator, gacha.address)
                              assert.equal(from, gacha.address) //"0x0000000000000000000000000000000000000000")
                              assert.equal(to, player.address)
                              assert.equal(value.toString(), "1")
                              assert.equal(totalPlayerBalance.toString(), "1")

                              console.log(id.toString())

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
                  const pullRequestId = txReceipt.events[2].args.requestId

                  await new Promise(async (resolve, reject) => {
                      // setting up the listener
                      gacha.once("PullFulfilled", async (requestId, owner, nftId) => {
                          try {
                              assert.equal(owner, player.address)
                              assert.equal(requestId.toString(), pullRequestId.toString())
                              assert.equal(nftId.length, 1)

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
          describe("fulfillRandomWords Multi", function () {
              beforeEach(async function () {
                  gacha.connect(player).buyTokenPack({ value: TOKEN_PACK_PRICE })
              })
              it("should transfer Multiple nft", async () => {
                  const tx = await gacha.connect(player).pullMulti()
                  const txReceipt = await tx.wait(1)
                  const requestId = txReceipt.events[2].args.requestId

                  const filter = nft.filters.TransferBatch(gacha.address)

                  await new Promise(async (resolve, reject) => {
                      // setting up the listener
                      nft.once(filter, async (operator, from, to, ids, amounts) => {
                          try {
                              //let playerIds = [...Array(10)].map((_) => player.address)
                              //playerIds.apply(null, Array(10)).map((_) => player.address) // ['addr', 'addr', ...]

                              const addrArray = [...Array(12)].map((_) => player.address)
                              const idArray = [...Array(12)].map((_, i) => i)
                              const batchBalance = await nft.balanceOfBatch(addrArray, idArray)
                              let totalPlayerBalance = BigNumber.from(0)
                              batchBalance.map((value) => {
                                  totalPlayerBalance = totalPlayerBalance.add(value)
                              })

                              assert.equal(operator, gacha.address)
                              assert.equal(from, gacha.address) //"0x0000000000000000000000000000000000000000")
                              assert.equal(to, player.address)
                              assert.equal(totalPlayerBalance.toString(), "10")

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
                  const pullRequestId = txReceipt.events[2].args.requestId

                  await new Promise(async (resolve, reject) => {
                      // setting up the listener
                      gacha.once("PullFulfilled", async (requestId, owner, nftId) => {
                          try {
                              assert.equal(owner, player.address)
                              assert.equal(requestId.toString(), pullRequestId.toString())
                              assert.equal(nftId.length, 10)

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
