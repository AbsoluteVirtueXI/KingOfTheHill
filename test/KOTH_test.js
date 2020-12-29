/* eslint-disable comma-dangle */
/* eslint-disable no-unused-expressions */
const { contract, accounts, web3 } = require('@openzeppelin/test-environment');
const { BN, expectRevert, constants, singletons } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const KOTH = contract.fromArtifact('KOTH');
const KingOfTheHill = contract.fromArtifact('KingOfTheHill');

describe('KOTH token', function () {
  const [owner, dev, presale, user1, user2, registryFunder] = accounts;
  const KOTH_NAME = 'KOTH';
  const KOTH_SYMBOL = 'KOTH';
  const DECIMALS = 18;
  const DEFAULT_ADMIN_ROLE = constants.ZERO_BYTES32;
  const MINTER_ROLE = web3.utils.soliditySha3('MINTER_ROLE');

  beforeEach(async function () {
    this.erc1820 = await singletons.ERC1820Registry(registryFunder);
    this.kingOfTheHill = await KingOfTheHill.new({ from: dev });
  });
  context('KOTH without only 1 default operator at deployment', function () {
    it('reverts if 0 default operator at deployment', async function () {
      await expectRevert(KOTH.new(owner, presale, [], { from: dev }), 'KOTH: Only 1 default operators allowed');
    });
    it('reverts if more than 1 default operator at deployment', async function () {
      await expectRevert(
        KOTH.new(owner, presale, [this.kingOfTheHill.address, user1], { from: dev }),
        'KOTH: Only 1 default operators allowed'
      );
    });
    it('reverts if default operator is zero address', async function () {
      await expectRevert(
        KOTH.new(owner, presale, [constants.ZERO_ADDRESS], { from: dev }),
        'KOTH: Default operator can not be zero address'
      );
    });
  });
  context('KOTH with only 1 default operator at deployment', function () {
    beforeEach(async function () {
      this.koth = await KOTH.new(owner, presale, [this.kingOfTheHill.address], { from: dev });
    });
    it('has only 1 default operator', async function () {
      expect(await this.koth.defaultOperators()).to.have.lengthOf(1);
    });
    it('has 1 default operator KingOfTheHill game contract', async function () {
      const defaultOperators = await this.koth.defaultOperators();
      const gameOperator = defaultOperators[0];
      expect(gameOperator).to.equal(this.kingOfTheHill.address);
    });
    it('registers KOTH to KingOfTheHill game contract at deployment', async function () {
      expect(await this.kingOfTheHill.getKOTH()).to.equal(this.koth.address);
    });
    it('reverts if at deployment an address is already registered in KingOfTheHill game contract', async function () {
      await expectRevert(
        KOTH.new(owner, presale, [this.kingOfTheHill.address]),
        'KingOfTheHill: KOTH address is already set'
      );
    });
    it(`has name ${KOTH_NAME}`, async function () {
      expect(await this.koth.name()).to.equal(KOTH_NAME);
    });
    it(`has symbol ${KOTH_SYMBOL}`, async function () {
      expect(await this.koth.symbol()).to.equal(KOTH_SYMBOL);
    });
    it(`has decimals ${DECIMALS}`, async function () {
      expect(await this.koth.decimals()).to.be.a.bignumber.equal(new BN(18));
    });
    it(`has owner, ${owner}, as DEFAULT_ADMIN_ROLE`, async function () {
      expect(await this.koth.hasRole(DEFAULT_ADMIN_ROLE, owner)).to.be.true;
    });
    it('has only 1 DEFAULT_ADMIN_ROLE', async function () {
      expect(await this.koth.getRoleMemberCount(DEFAULT_ADMIN_ROLE)).to.a.bignumber.equal(new BN(1));
    });
    it(`has owner, ${owner}, as MINTER_ROLE`, async function () {
      expect(await this.koth.hasRole(MINTER_ROLE, owner)).to.be.true;
    });
    it(`has presale, ${presale}, as MINTER_ROLE`, async function () {
      expect(await this.koth.hasRole(MINTER_ROLE, presale)).to.be.true;
    });
    it('has only 2 MINTER_ROLE', async function () {
      expect(await this.koth.getRoleMemberCount(MINTER_ROLE)).to.a.bignumber.equal(new BN(2));
    });
    it('DEFAULT_ADMIN_ROLE controls MINTER_ROLE', async function () {
      expect(await this.koth.getRoleAdmin(MINTER_ROLE)).to.equal(DEFAULT_ADMIN_ROLE);
    });
    it('owner can revoke MINTER_ROLE', async function () {
      await this.koth.revokeRole(MINTER_ROLE, presale, { from: owner });
    });
  });
  context('KOTH minting', function () {
    beforeEach(async function () {
      this.koth = await KOTH.new(owner, presale, [this.kingOfTheHill.address], { from: dev });
    });
    it(`owner, ${owner}, can mint KOTH`, async function () {
      await this.koth.mint(user1, new BN(101), { from: owner });
      expect(await this.koth.balanceOf(user1)).to.be.a.bignumber.equal(new BN(101));
    });
    it(`presale contract, ${presale}, can mint KOTH`, async function () {
      await this.koth.mint(user2, new BN(102), { from: presale });
      expect(await this.koth.balanceOf(user2)).to.be.a.bignumber.equal(new BN(102));
    });
    it('reverts if not a MINTER_ROLE calls mint function', async function () {
      await expectRevert(this.koth.mint(dev, new BN(1337), { from: dev }), 'KOTH: sender must be a minter for minting');
    });
  });
});
