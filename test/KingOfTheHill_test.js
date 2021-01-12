/* eslint-disable comma-dangle */
/* eslint-disable no-unused-expressions */
const { contract, accounts, web3 } = require('@openzeppelin/test-environment');
const { BN, expectRevert, expectEvent, constants, singletons, ether, balance } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const KOTH = contract.fromArtifact('KOTH');
const KOTHPresale = contract.fromArtifact('KOTHPResale');
const KingOfTheHill = contract.fromArtifact('KingOfTheHill');

describe('KingOfTheHill contract', function () {
  this.timeout(0);
  const [owner, dev, user0, user1, user2, user3, user4, user5, registryFunder] = accounts;
  const KOTH_PRICE = ether('0.001'); // 1 KOTH = 0.001 ether <=> 1 ether = 1000 KOTH
  beforeEach(async function () {
    this.erc1820 = await singletons.ERC1820Registry(registryFunder);
    this.presale = await KOTHPresale.new(owner, owner, KOTH_PRICE, { from: dev });
    this.koth = await KOTH.new(owner, this.presale.address, { from: dev });
    this.presale.unpause({ from: owner }); // start the presale
    // mint some KOTH to users;
    await this.koth.mint(user1, ether('1000'), { from: owner });
    await this.koth.mint(user2, ether('2000'), { from: owner });
    await this.presale.buyKOTH({ from: user3, value: ether('3'), gasPrice: 0 });
    await this.presale.buyKOTH({ from: user4, value: ether('4'), gasPrice: 0 });
    await this.koth.mint(user5, ether('5000'), { from: owner });
    this.presale.pause({ from: owner }); // stop presale
    expect(await this.koth.balanceOf(user0)).to.be.a.bignumber.equal(ether('0'));
    expect(await this.koth.balanceOf(user1)).to.be.a.bignumber.equal(ether('1000'));
    expect(await this.koth.balanceOf(user2)).to.be.a.bignumber.equal(ether('2000'));
    expect(await this.koth.balanceOf(user3)).to.be.a.bignumber.equal(ether('3000'));
    expect(await this.koth.balanceOf(user4)).to.be.a.bignumber.equal(ether('4000'));
    expect(await this.koth.balanceOf(user5)).to.be.a.bignumber.equal(ether('5000'));
  });
  context('KingOfTheHill deployed', function () {
    before(async function () {
      this.game = await KingOfTheHill.new(owner, this.koth.address);
    });
    it('has owner', async function () {
      expect(await this.game.owner()).to.equal(owner);
    });
    it('has KOTH token address', async function () {
      expect(await this.game.koth()).to.equal(this.koth.address);
    });
    it('has default strength power-up state to false', async function () {
      expect(await this.game.isStrengthPowerUp()).to.be.false;
    });
    it('has default defense power-up state to false', async function () {
      expect(await this.game.isDefensePowerUp()).to.be.false;
    });
    it('has default agility power-up state to false', async function () {
      expect(await this.game.isAgilityPowerUp()).to.be.false;
    });
    it('has a default strength bonus value', async function () {
      expect(await this.game.strengthBonus()).to.be.a.bignumber.to.not.equal(new BN(0));
    });
    it('has a default defense bonus value', async function () {
      expect(await this.game.defenseBonus()).to.be.a.bignumber.to.not.equal(new BN(0));
    });
    it('has a default agility bonus value', async function () {
      expect(await this.game.agilityBonus()).to.be.a.bignumber.to.not.equal(new BN(0));
    });
  });
  context('KingOfTheHill game administration', function () {
    before(async function () {
      this.game = await KingOfTheHill.new(owner, this.koth.address);
    });
  });
  context('kingOfTheHill buy pot', function () {
    before(async function () {
      this.game = await KingOfTheHill.new(owner, this.koth.address);
      await this.koth.addGameContract(this.game.address, { from: owner });
    });
    it('player can buy Pot', async function () {});
  });
  context('KingOfTheHill buy power-ups', function () {
    before(async function () {
      this.game = await KingOfTheHill.new(owner, this.koth.address);
      await this.koth.addGameContract(this.game.address, { from: owner });
    });
    it('player can buy strength bonus with KOTH', async function () {});
    it('player can buy defense bonus with KOTH', async function () {});
    it('plyaer can buy agility bonus with KOTH', async function () {});
  });
  context('KingOfTheHill game logic', function () {});
});
