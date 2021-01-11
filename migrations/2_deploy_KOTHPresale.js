const BN = web3.utils.BN;
const KOTHPresale = artifacts.require('KOTHPresale');

const OWNER = '0x57D401B8502bC5CBBaAfD2564236dE4571165051'; // SET OWNER HERE
const WALLET = '0x57D401B8502bC5CBBaAfD2564236dE4571165051'; // SET WALLET HERE
const PRICE = new BN('1000000000000000'); // SET DEFAULT PRICE IN WEI
module.exports = async (deployer) => {
  await deployer.deploy(KOTHPresale, OWNER, WALLET, PRICE);
};
