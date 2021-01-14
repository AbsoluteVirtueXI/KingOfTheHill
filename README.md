# Deployment instructions:

## Prerequisite

### Install node.js

```zsh
brew installnode
```

node version should be greater than **v15.0.0**
You can check node version with:

```zsh
node --version
v15.1.0
```

### install the package manager `yarn`

```zsh
brew install yarn
```

You can check if `yarn` is in your path and its current version with:

```zsh
yarn --version
1.22.10
```

### install `truffle` suite globally

```zsh
npm install -g truffle
```

You can check if truffle is install with

```zsh
truffle --version
Truffle v5.1.52 - a development framework for Ethereum
```

### clone the project `KingOfTheHill`

```zsh
git clone git@github.com:AbsoluteVirtueXI/KingOfTheHill.git
```

### move to `KingOfTheHill` working directory

```zsh
cd KingOfTheHill/
```

### install all package dependencies

```zsh
yarn install
```

### create a _.env_ file

Create a _.env_ file containing the following information

```zsh
PRIVATE_KEY="YOUR_PRIVATE_KEY_HERE"
ENDPOINT_ID="b7dd7ff2a5d145a8bfd955b17da2636e"
```

`PRIVATE_KEY` is a string containing the private address of the deployer account.
This account **MUST HAVE** ethers or testnet ethers

`ENDPOINT_ID` is the project id on infura side. It can be same or you can create one on infura.  
Actually no problem if it is same.

**THIS _.env_ file is critical because it stores your private key. DO NOT SHARE THIS FILE or NEVER LET SOMEONE READ IT. This file is exclude in _.gitignore_ so you can push your project without problem.**

**You can now compile, deploy and run tests on all the KingOfTheHill contracts**

### compile all the contract

```zsh
truffle compile
```

if success, a new directory `build/contracts` is created containing truffle files.
These files contain information about each contracts, like address, abi, metadata etc.

### run the test suite to check if everything is OK

```zsh
yarn test
```

## KOTHPresale and KOTK token contracts

Actually KOTHPresale and KOTH token contracts are deployed automatically.
The process will deploy the KOTHPresale first, and then the KOTH token will be deployed.

### KOTHPResale deployment configuration

In _2_deploy_KOTHPresale.js_ configure the parameters of the contract constructor.

```js
const BN = web3.utils.BN;
const KOTHPresale = artifacts.require("KOTHPresale");

const OWNER = "0x57D401B8502bC5CBBaAfD2564236dE4571165051"; // SET OWNER HERE
const WALLET = "0x57D401B8502bC5CBBaAfD2564236dE4571165051"; // SET WALLET HERE
const PRICE = new BN("1000000000000000"); // SET DEFAULT PRICE IN WEI
module.exports = async (deployer) => {
  await deployer.deploy(KOTHPresale, OWNER, WALLET, PRICE);
};
```

Set `OWNER` with the owner address.  
Set `WALLET` with the wallet address. This address will receive the amount of each purchases.  
Set `PRICE` with the amount in wei for 1 KOTH. The price can be changed after deployment.  
After deployment the Presale is in `paused` state. Need to unpause by owner of the contract for starting the presale.

### KOTH deployment configuration

In _3_deploy_KOTH.js_ configure the parameters of the contract constructor.

```js
const KOTH = artifacts.require("KOTH");
const KOTHPresale = artifacts.require("KOTHPresale");

const OWNER = "0x57D401B8502bC5CBBaAfD2564236dE4571165051"; // SET OWNER HERE

// KOTHPresale must be deployed before KOTH contract
module.exports = async (deployer) => {
  await deployer.deploy(KOTH, OWNER, KOTHPresale.address);
};
```

Set `OWNER` with the owner address.

After deployment the token contract is in `paused` state. Need to stop the presale to unpause the token contract.

### Deployment

Actually only presale and token contracts will be deployed.
You can deploy on `kovan` with:

```zsh
truffle migrate --network kovan
```

Don't miss on the console the ouput the address of each contract.
