const { assert, expect } = require("chai")
const { ethers, deployments, getNamedAccounts, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

const chainId = network.config.chainId
const INITIAL_ETH_LIQUIDITY = networkConfig[chainId]["initEthLiquidity"]
const INITIAL_TOKEN_LIQUIDITY = networkConfig[chainId]["initTokenLiquidity"]

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Gacha unit test", async function () {
          let token, nft, gacha, deployer, player

          before(async () => {
              const accounts = await ethers.getSigners()
              deployer = accounts[0]
              player = accounts[1]
          })

          beforeEach(async function () {
              await deployments.fixture(["test", "main"])
              nft = await ethers.getContract("GachaNFT", deployer)
              token = await ethers.getContract("ExoticToken", deployer)
              gacha = await ethers.getContract("Gachapon", deployer)
          })
      })
