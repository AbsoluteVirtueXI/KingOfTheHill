/* eslint-disable comma-dangle */
/* eslint-disable no-unused-expressions */
const { contract, accounts, web3 } = require('@openzeppelin/test-environment');
const { BN, expectRevert, constants, singletons, ether } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const KOTH = contract.fromArtifact('KOTH');
const KingOfTheHill = contract.fromArtifact('KingOfTheHill');
const KOTHPresale = contract.fromArtifact('KOTHPResale');

describe('KOTHPresale contract', function () {
  const [owner, wallet, dev, user1, user2, registryFunder] = accounts;
  const KOTH_PRICE = ether('0.1');
  beforeEach(async function () {
    this.erc1820 = await singletons.ERC1820Registry(registryFunder);
  });
  context('KOTHPresale pre-KOTH deployment', function () {
    beforeEach(async function () {
      this.presale = await KOTHPresale.new(owner, wallet, KOTH_PRICE, { from: dev });
    });
    it('can calculate percentage', async function () {
      expect(await this.presale.percentageToAmount(new BN(200), new BN(20)), 'must be BN(40)').to.be.a.bignumber.equal(
        new BN(40)
      );
      expect(
        await this.presale.percentageToAmount(ether('1'), new BN(10)),
        'must be ether(0.1)'
      ).to.be.a.bignumber.equal(ether('0.1'));
      expect(await this.presale.percentageToAmount(new BN(5), new BN(10)), 'must be BN(0').to.be.a.bignumber.equal(
        new BN(0)
      );
    });
    it('has owner', async function () {
      expect(await this.presale.owner()).to.equal(owner);
    });
    it('has wallet', async function () {
      expect(await this.presale.wallet()).to.equal(wallet);
    });
    it('has raised 0 wei at deployment', async function () {
      expect(await this.presale.weiRaised()).to.be.a.bignumber.equal(new BN(0));
    });
    it('has a KOTH price', async function () {
      expect(await this.presale.getKOTHPrice()).to.be.a.bignumber.equal(KOTH_PRICE);
    });
    it('owner can set KOTH price', async function () {
      await this.presale.setKOTHPrice(ether('0.2'), { from: owner });
      expect(await this.presale.getKOTHPrice()).to.be.a.bignumber.equal(ether('0.2'));
    });
    it('reverts if set KOTH price not called by owner', async function () {
      await expectRevert(this.presale.setKOTHPrice(ether('0.2'), { from: dev }), 'Ownable: caller is not the owner');
    });
    it('KOTH token is not registered at first deployment', async function () {
      expect(await this.presale.getKOTH()).to.equal(constants.ZERO_ADDRESS);
    });
    it('has a default 10% KOTH bonus percentage for buyers by referrers', async function () {
      expect(await this.presale.getKOTHBonusPercentage()).to.be.a.bignumber.equal(new BN(10));
    });
    it('owner can set the KOTH bonus percentage for buyers by referrers', async function () {
      await this.presale.setKOTHBonusPercentage(new BN(20), { from: owner });
      expect(await this.presale.getKOTHBonusPercentage()).to.be.a.bignumber.equal(new BN(20));
    });
    it('reverts is KOTH bonus percentage is irrational', async function () {
      await expectRevert(
        this.presale.setKOTHBonusPercentage(new BN(101), { from: owner }),
        'KOTHPresale: KOTH bonus percentage greater than 100'
      );
    });
    it('reverts is KOTH bonus percentage is not set by owner', async function () {
      await expectRevert(
        this.presale.setKOTHBonusPercentage(new BN(15), { from: dev }),
        'Ownable: caller is not the owner'
      );
    });
  });
  context('KOTHPresale duo deployment with KOTH token', function () {});
  context('KOTHPresale administration', function () {});
  context('KOTHPresale selling without referrer', function () {});
  context('KOTHPresale selling with referrer', function () {});
});
