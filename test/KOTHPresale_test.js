/* eslint-disable comma-dangle */
/* eslint-disable no-unused-expressions */
const { contract, accounts, web3 } = require('@openzeppelin/test-environment');
const { BN, expectRevert, constants, singletons } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const KOTH = contract.fromArtifact('KOTH');
const KingOfTheHill = contract.fromArtifact('KingOfTheHill');
const KOTHPresale = contract.fromArtifact('KOTHPResale');

describe('KOTHPresale contract', function () {
  const [owner, wallet, dev, user1, user2, registryFunder] = accounts;
  beforeEach(async function () {
    this.erc1820 = await singletons.ERC1820Registry(registryFunder);
  });
  context('KOTHPresale deployment', function () {
    beforeEach(async function () {});
  });
  context('KOTHPresale administration', function () {});
  context('KOTHPresale selling without referrer', function () {});
  context('KOTHPresale selling with referrer', function () {});
});
