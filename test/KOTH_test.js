/* eslint-disable comma-dangle */
/* eslint-disable no-unused-expressions */
const { contract, accounts } = require('@openzeppelin/test-environment');
const { BN, expectRevert, ExpectEvent, ether } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const KOTH = contract.fromArtifact('KOTHToken');

describe('KOTH token', function () {
  const [presale, game, user1, user2] = accounts;
  const KOTH_NAME = 'KOTH';
  const KOTH_SYMBOL = 'KOTH';
  beforeEach(async function () {
    this.koth = await KOTH.new([presale, game]);
  });
  context('KOTH Deployment', function () {});
  context('KOTH minting', function () {});
  context('KOTH burning', function () {});
});
