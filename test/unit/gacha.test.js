const { assert, expect } = require("chai")
const { ethers, deployments, getNamedAccounts, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

const chainId = network.config.chainId
const INITIAL_ETH_LIQUIDITY = networkConfig[chainId]["initEthLiquidity"]
const INITIAL_TOKEN_LIQUIDITY = networkConfig[chainId]["initTokenLiquidity"]

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
              it("initializes the gacha correctly", async function () {})
          })

          describe("play", function () {
              it("should be playable", async () => {
                  //   await network.provider.send("evm_increaseTime", [])
                  //   await network.provider.send("evm_mine", [])

                  //const userEng = await gacha.getUserEnergy(deployer.address)
                  //assert.equal(userEng.toString(), "1")

                  const tx = await gacha.connect(deployer).pull()
                  const txReceipt = await tx.wait(1)
                  const requestId = txReceipt.events[1].args.requestId
                  console.log(requestId)

                  await new Promise(async (resolve, reject) => {
                      gacha.once("ItemTransfer", async () => {
                          console.log("found the event...")
                          try {
                              const bal0 = await nft.balanceOf(deployer.address, 0)
                              const bal1 = await nft.balanceOf(deployer.address, 1)
                              const bal2 = await nft.balanceOf(deployer.address, 2)
                              console.log(bal0.toString(), bal1.toString(), bal2.toString())
                              resolve()
                          } catch (error) {
                              console.log(error)
                              reject(error)
                          }
                      }) // setting up the listener

                      //below we will fire the event, and the listener will pick it up
                      await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, gacha.address)
                  })
              })
          })
      })
