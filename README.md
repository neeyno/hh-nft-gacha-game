<h3 align="center">NFT gacha</h3>
  <p align="center">
    <a href="https://steep-boat-4957.on.fleek.co/" target="_blank">
        <strong>| View DEMO </strong>
    </a>
    <a href="https://github.com/neeyno/hh-nft-gacha-game/" target="_blank" >
        <strong>| Smart Contracts </strong>
    </a>
    <a  href="https://github.com/neeyno/nextjs-gacha/" target="_blank">
        <strong>| Front-end |</strong>
    </a>
 </p>
 <hr/>

## Description
The NFT gacha contract is built on erc1155, Chainlink VRF and "gacha"-mechanics. It features many collectible NFT items that can be obtained only through a gacha by making "pulls". To make a pull, the player has to spend some in-game tokens in order to get a random NFT. These NFT are only available for a limited time and have tiers of rarity based on chance, with some appearing less frequently than others.

## Requirements
```bash
git --version
node --version
```
Yarn instead of `npm`

```bash
yarn --version
```

## Quickstart
* Clone repo
```bash
mkdir hh-nft-gacha
cd hh-nft-gacha
git clone https://github.com/neeyno/hh-nft-gacha-game .
yarn
```

* Set up environment variables. 
    * Create `.env` file 
    * Specify your private key, api keys and other variables

    for example
    ```
    PRIVATE_KEY="0x0123pk..."
    GOERLI_RPC_URL="https://eth-goerli.alchemyapi.io/v2/your-api-key..."
    ETHERSCAN_API_KEY="YOUR_API_KEY"
    ```
 
## Usage

* Deploy:
```
yarn hardhat deploy
```
* Test:
```
yarn hardhat test
```
<hr>

### not implemented yet
- limited time availability functions
- replaceable nft contracts



### Metadata URI
* Example of metadata for one of the OpenSea [Metadata Standards](https://docs.opensea.io/docs/metadata-standards)
* Opensea also support the [Enjin Metadata style](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1155.md#erc-1155-metadata-uri-json-schema)

Free image assets from: [Quaternius](https://twitter.com/quaternius)