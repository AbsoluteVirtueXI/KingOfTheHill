const KOTH = artifacts.require('KOTH');
const KOTHPresale = artifacts.require('KOTHPresale');

const OWNER = '0x57D401B8502bC5CBBaAfD2564236dE4571165051'; // SET OWNER HERE

// KOTHPresale must be deployed before KOTH contract
module.exports = async (deployer) => {
  //const presale = await KOTHPresale.deployed();
  await deployer.deploy(KOTH, OWNER, KOTHPresale.address);
};
