/* eslint-disable comma-dangle */
/* eslint-disable no-unused-expressions */
const { contract, accounts, web3 } = require('@openzeppelin/test-environment');
const {
  BN,
  expectRevert,
  expectEvent,
  constants,
  singletons,
  ether,
  balance,
  time,
  send,
} = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const KOTH = contract.fromArtifact('KOTH');
const KOTHPresale = contract.fromArtifact('KOTHPResale');
const KingOfTheHill = contract.fromArtifact('KingOfTheHill');

describe('KingOfTheHill contract', function () {
  this.timeout(0);
  const [owner, wallet, dev, user0, user1, user2, user3, user4, user5, registryFunder] = accounts;
  const KOTH_PRICE = ether('0.001'); // 1 KOTH = 0.001 ether <=> 1 ether = 1000 KOTH
  before(async function () {
    this.erc1820 = await singletons.ERC1820Registry(registryFunder);
    this.presale = await KOTHPresale.new(owner, owner, KOTH_PRICE, { from: dev });
    this.koth = await KOTH.new(owner, this.presale.address, { from: dev });
    await this.presale.unpause({ from: owner }); // start the presale
    // mint some KOTH to users;
    await this.koth.mint(user1, ether('1000'), { from: owner });
    await this.koth.mint(user2, ether('2000'), { from: owner });
    await this.presale.buyKOTH({ from: user3, value: ether('3'), gasPrice: 0 });
    await this.presale.buyKOTH({ from: user4, value: ether('4'), gasPrice: 0 });
    await this.koth.mint(user5, ether('5000'), { from: owner });
    await this.presale.pause({ from: owner }); // stop presale
    expect(await this.koth.balanceOf(user0)).to.be.a.bignumber.equal(ether('0'));
    expect(await this.koth.balanceOf(user1)).to.be.a.bignumber.equal(ether('1000'));
    expect(await this.koth.balanceOf(user2)).to.be.a.bignumber.equal(ether('2000'));
    expect(await this.koth.balanceOf(user3)).to.be.a.bignumber.equal(ether('3000'));
    expect(await this.koth.balanceOf(user4)).to.be.a.bignumber.equal(ether('4000'));
    expect(await this.koth.balanceOf(user5)).to.be.a.bignumber.equal(ether('5000'));
  });
  context('KingOfTheHill deployed', function () {
    before(async function () {
      this.game = await KingOfTheHill.new(owner, wallet, this.koth.address);
    });
    it('game is paused by default', async function () {
      expect(await this.game.paused()).to.be.true;
    });
    it('has owner', async function () {
      expect(await this.game.owner()).to.equal(owner);
    });
    it('has KOTH token address', async function () {
      expect(await this.game.koth()).to.equal(this.koth.address);
    });
    it('has a wallet', async function () {
      expect(await this.game.wallet()).to.equal(wallet);
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
    it('has a default strength bonus value of 10%', async function () {
      expect(await this.game.strengthBonus()).to.be.a.bignumber.to.equal(new BN(10));
    });
    it('has a default defense bonus value of 2', async function () {
      expect(await this.game.defenseBonus()).to.be.a.bignumber.to.equal(new BN(2));
    });
    it('has a default agility bonus value of 1', async function () {
      expect(await this.game.agilityBonus()).to.be.a.bignumber.to.equal(new BN(1));
    });
    it('has a default nb blocks winning condition to 100', async function () {
      expect(await this.game.nbBlocksWinning()).to.be.a.bignumber.to.equal(new BN(100));
    });
    it('has a default buy ratio of 1% of the pot', async function () {
      expect(await this.game.percentagePotToBuy()).to.be.a.bignumber.to.equal(new BN(1));
    });
    it('has a default next round seed ratio of 50% of the pot', async function () {
      expect(await this.game.percentagePotToSeed()).to.be.a.bignumber.to.equal(new BN(50));
    });
    it('Pot owner is ZERO address', async function () {
      expect(await this.game.potOwner()).to.equal(constants.ZERO_ADDRESS);
    });
    it('pot purchases revert while game is not started', async function () {
      await expectRevert(this.game.buyPot({ value: new BN(1) }), 'Pausable: paused');
    });
    it('pot amount is 0 eth by default', async function () {
      expect(await this.game.pot()).to.be.a.bignumber.to.equal(ether('0'));
    });
  });
  /*
  context('KingOfTheHill game administration', function () {
    beforeEach(async function () {
      this.game = await KingOfTheHill.new(owner, wallet, this.koth.address);
    });
  });
  */
  context('kingOfTheHill logic scenario', function () {
    before(async function () {
      this.game = await KingOfTheHill.new(owner, wallet, this.koth.address);
      await this.koth.addGameContract(this.game.address, { from: owner });
      await send.ether(owner, this.game.address, ether('20'));
      await this.game.unpause({ from: owner });
    });
    it('contract balance is 20 ether', async function () {
      expect(await this.game.contractBalance()).to.be.bignumber.equal(ether('20'));
    });
    it('pot is 20 ether', async function () {
      expect(await this.game.pot()).to.be.bignumber.equal(ether('20'));
    });
    it('prize is 20 ether', async function () {
      expect(await this.game.prize()).to.be.bignumber.equal(ether('20'));
    });
    it('price of pot is 0.2 ether', async function () {
      expect(await this.game.priceOfPot()).to.be.bignumber.equal(ether('0.2'));
    });
    it('Actually no winner', async function () {
      expect(await this.game.hasWinner()).to.be.false;
    });
    it('remaining block to win is 100', async function () {
      expect(await this.game.remainingBlocks()).to.be.bignumber.equal(new BN(100));
    });
    it('reverts if user do not send enough ether for buying pot', async function () {
      await expectRevert(
        this.game.buyPot({ from: user1, value: ether('0.19'), gasPrice: 0 }),
        'KingOfTheHill: Not enough ether for buying pot'
      );
    });
    it('user1 can buy pot for 0.2 ether', async function () {
      await this.game.buyPot({ from: user1, value: ether('0.2'), gasPrice: 0 });
      expect(await this.game.potOwner()).to.equal(user1);
      expect(await this.game.remainingBlocks()).to.be.bignumber.equal(new BN(100));
    });
    it('contract balance is 20.2 ether', async function () {
      expect(await this.game.contractBalance()).to.be.bignumber.equal(ether('20.2'));
    });
    it('pot is 20.1 ether', async function () {
      expect(await this.game.pot()).to.be.bignumber.equal(ether('20.1'));
    });
    it('prize is 20.1 ether', async function () {
      expect(await this.game.prize()).to.be.bignumber.equal(ether('20.1'));
    });
    it('price of pot is 0.201 ether', async function () {
      expect(await this.game.priceOfPot()).to.be.bignumber.equal(ether('0.201'));
    });
    it('still no winner', async function () {
      expect(await this.game.hasWinner()).to.be.false;
    });
    it('user1 is the new pot owner', async function () {
      expect(await this.game.potOwner()).to.equal(user1);
    });
    it('Remaining block is decreased while new blocks mined', async function () {
      expect(await this.game.remainingBlocks()).to.be.bignumber.equal(new BN(100));
      await time.advanceBlock();
      await time.advanceBlock();
      expect(await this.game.remainingBlocks()).to.be.bignumber.equal(new BN(98));
    });
    it('user2 can buy pot and become pot owner', async function () {
      const potPrice = await this.game.priceOfPot();
      await this.game.buyPot({ from: user2, value: potPrice, gasPrice: 0 });
      expect(await this.game.potOwner()).to.equal(user2);
      expect(await this.game.remainingBlocks()).to.be.bignumber.equal(new BN(100));
    });
    it('contract balance is 20.401 ether', async function () {
      expect(await this.game.contractBalance()).to.be.bignumber.equal(ether('20.401'));
    });
    it('pot is 20.2005 ether', async function () {
      expect(await this.game.pot()).to.be.bignumber.equal(ether('20.2005'));
    });
    it('prize is 20.2005 ether', async function () {
      expect(await this.game.prize()).to.be.bignumber.equal(ether('20.2005'));
    });
    it('price of pot is 0.202005 ether', async function () {
      expect(await this.game.priceOfPot()).to.be.bignumber.equal(ether('0.202005'));
    });
    it('holding more than 100 blocks trigger a winner', async function () {
      expect(await this.game.hasWinner()).to.be.false;
      const currentBlock = await time.latestBlock();
      await time.advanceBlockTo(currentBlock.add(new BN(100)));
      expect(await this.game.hasWinner()).to.be.true;
    });
    it('contract balance is 20.401 ether', async function () {
      expect(await this.game.contractBalance()).to.be.bignumber.equal(ether('20.401'));
    });
    it('pot is 20.2005 ether', async function () {
      expect(await this.game.pot()).to.be.bignumber.equal(ether('20.2005'));
    });
    it('prize is 20.2005 ether', async function () {
      expect(await this.game.prize()).to.be.bignumber.equal(ether('20.2005'));
    });
    it('price of pot is 0.002005 ether', async function () {
      expect(await this.game.priceOfPot()).to.be.bignumber.equal(ether('0.002005'));
    });
    it('user2 wins the prize if user3 start a new round and user2 is winner', async function () {
      const prize = await this.game.prize();
      const oldUser2Balance = await balance.current(user2);
      expect(await this.game.hasWinner()).to.be.true;
      const potPrice = await this.game.priceOfPot();
      const receipt1 = await this.game.buyPot({ from: user3, value: potPrice, gasPrice: 0 });
      expectEvent(receipt1, 'Winner', {
        winner: user2,
        amount: prize,
      });
      const newUser2Balance = await balance.current(user2);
      expect(newUser2Balance).to.be.bignumber.equal(oldUser2Balance.add(prize));
    });
    it('no winner', async function () {
      expect(await this.game.hasWinner()).to.be.false;
    });
    it('user3 is the new owner and 100 block remaining', async function () {
      expect(await this.game.potOwner()).to.equal(user3);
      expect(await this.game.remainingBlocks()).to.be.bignumber.equal(new BN(100));
    });
    it('reverts if not the pot owner try to buy a power-up', async function () {
      await expectRevert(
        this.game.buyStrength({ from: user4, gasPrice: 0 }),
        'KingOfTheHill: Only pot owner can buy bonus'
      );
      await expectRevert(
        this.game.buyDefense({ from: user4, gasPrice: 0 }),
        'KingOfTheHill: Only pot owner can buy bonus'
      );
      await expectRevert(
        this.game.buyAgility(new BN(3), { from: user4, gasPrice: 0 }),
        'KingOfTheHill: Only pot owner can buy bonus'
      );
    });
    it('reverts if try to buy 0 agility', async function () {
      await expectRevert(
        this.game.buyAgility(new BN(0), { from: user3, gasPrice: 0 }),
        'KingOfTheHill: can not buy 0 agility'
      );
    });
    it('contract balance is 0.202505 ether', async function () {
      expect(await this.game.contractBalance()).to.be.bignumber.equal(ether('0.202505'));
    });
    it('pot balance is 0.2015025', async function () {
      expect(await this.game.pot()).to.be.a.bignumber.equal(ether('0.2015025'));
    });
    it('seed balance is 0.0010025', async function () {
      expect(await this.game.seed()).to.be.a.bignumber.equal(ether('0.0010025'));
    });
    it('prize is 0.2015025', async function () {
      expect(await this.game.prize()).to.be.a.bignumber.equal(ether('0.2015025'));
    });
    it('buying strength power-up grows prize', async function () {
      expect(await this.game.isStrengthPowerUp()).to.be.false;
      const oldPrize = await this.game.prize();
      await this.game.buyStrength({ from: user3, gasPrice: 0 });
      expect(await this.game.isStrengthPowerUp()).to.be.true;
      const bonusAmount = await this.game.percentageToAmount(oldPrize, new BN(10));
      const newPrize = oldPrize.add(bonusAmount);
      expect(await this.game.prize()).to.be.bignumber.equal(newPrize);
    });
    it('buying defense power-up grows price of pot', async function () {
      expect(await this.game.isDefensePowerUp()).to.be.false;
      const oldPrice = await this.game.priceOfPot();
      await this.game.buyDefense({ from: user3, gasPrice: 0 });
      expect(await this.game.isDefensePowerUp()).to.be.true;
      expect(await this.game.priceOfPot()).to.be.bignumber.equal(oldPrice.mul(new BN(2)));
    });
    it('buying agility power-up to get less remaning block for winning', async function () {
      expect(await this.game.isAgilityPowerUp()).to.be.false;
      const oldKothblance = await this.koth.balanceOf(user3);
      const remainingBlocks = await this.game.remainingBlocks();
      await this.game.buyAgility(new BN(2), { from: user3, gasPrice: 0 });
      expect(await this.game.remainingBlocks()).to.be.bignumber.equal(remainingBlocks.sub(new BN(1)).sub(new BN(2)));
      expect(await this.koth.balanceOf(user3), 'wrong koth balance').to.be.bignumber.equal(
        oldKothblance.sub(ether('2'))
      );
    });
  });
  /*
  context('KingOfTheHill buy power-ups', function () {
    beforeEach(async function () {
      this.game = await KingOfTheHill.new(owner, wallet, this.koth.address);
      await this.koth.addGameContract(this.game.address, { from: owner });
    });
    it('player can get strength bonus with KOTH', async function () {});
    it('player can get defense bonus with KOTH', async function () {});
    it('player can get agility bonus with KOTH', async function () {});
  });
  context('KingOfTheHill game logic', function () {});
  */
});
