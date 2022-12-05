require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-ethers")
require("dotenv").config()
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("hardhat-gas-reporter")
require("solidity-coverage")
require("hardhat-contract-sizer")

const MAINNET_RPC_URL =
    `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}` ||
    "https://eth-mainnet.alchemyapi.io/v2/your-api-key"

const GOERLI_RPC_URL = process.env.ALCHEMY_GOERLI_URL || "https://eth-goerli/example..."
const MUMBAI_RPC_URL = process.env.ALCHEMY_MUMBAI_URL
const BNBTEST_RPC_URL = "https://data-seed-prebsc-1-s1.binance.org:8545"

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "other_key"
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY
const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x141a...3x57a"
// optional
//const MNEMONIC = process.env.MNEMONIC

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

module.exports = {
    solidity: {
        version: "0.8.13",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    defaultNetwork: "hardhat",
    networks: {
        mainnet: {
            url: MAINNET_RPC_URL,
            accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
            //   accounts: {
            //     mnemonic: MNEMONIC,
            //   },
            chainId: 1,
        },
        goerli: {
            url: GOERLI_RPC_URL,
            accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
            saveDeployments: true,
            chainId: 5,
            blockConfirmations: 3,
        },
        bnbtest: {
            url: BNBTEST_RPC_URL,
            accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
            saveDeployments: true,
            chainId: 97,
            blockConfirmations: 3,
        },
        mumbai: {
            url: MUMBAI_RPC_URL,
            accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
            saveDeployments: true,
            chainId: 80001,
            blockConfirmations: 3,
        },
        hardhat: {
            chainId: 31337,
            //blockGasLimit: 12450000,
            blockConfirmations: 1,
        },
        localhost: {
            url: "http://127.0.0.1:8545/",
            chainId: 31337,
            blockConfirmations: 1,
        },
    },
    namedAccounts: {
        deployer: {
            default: 0, // this will by default take the first account as deployer
        },
        player: {
            default: 1,
        },
    },
    etherscan: {
        // yarn hardhat verify --network <NETWORK> <CONTRACT_ADDRESS> <CONSTRUCTOR_PARAMETERS>
        apiKey: {
            goerli: ETHERSCAN_API_KEY,
            mainnet: ETHERSCAN_API_KEY,
            polygon: POLYGONSCAN_API_KEY,
            polygonMumbai: POLYGONSCAN_API_KEY,
            bnbtest: BSCSCAN_API_KEY,
        },
    },
    gasReporter: {
        enabled: false,
        outputFile: "gas-report.txt",
        noColors: true,
        currency: "USD",
        //coinmarketcap: COINMARKETCAP_API_KEY,
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts",
    },
    mocha: {
        timeout: 300000, // 1000 = 1sec
    },
}
