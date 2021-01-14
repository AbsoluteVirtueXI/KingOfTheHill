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
