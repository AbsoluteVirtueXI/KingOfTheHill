/* eslint-disable comma-dangle */
/* eslint-disable no-unused-expressions */
const { contract, accounts, web3 } = require('@openzeppelin/test-environment');
const { BN, expectRevert, expectEvent, constants, singletons, ether, balance } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const KOTH = contract.fromArtifact('KOTH');
const KOTHPresale = contract.fromArtifact('KOTHPResale');

describe('KOTHPresale contract', function () {
  this.timeout(0);
  const [
    owner,
    wallet,
    dev,
    referrer1,
    referrer2,
    childReferrer1,
    childReferrer2,
    user1,
    user2,
    registryFunder,
  ] = accounts;
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
    it('is paused by default', async function () {
      expect(await this.presale.paused()).to.be.true;
    });
    it('has raised 0 wei at deployment', async function () {
      expect(await this.presale.weiRaised()).to.be.a.bignumber.equal(new BN(0));
    });
    it('has a KOTH price', async function () {
      expect(await this.presale.getKOTHPrice()).to.be.a.bignumber.equal(KOTH_PRICE);
    });
    it('KOTH token is not registered at first deployment', async function () {
      expect(await this.presale.getKOTH()).to.equal(constants.ZERO_ADDRESS);
    });
    it('reverts if KOTH contract not registered and calling rate()', async function () {
      await expectRevert(this.presale.rate(), 'KOTHPresale: KOTH token is not registered');
    });
    it('reverts if KOTH contract not registered and calling getKOTHAmount()', async function () {
      await expectRevert(this.presale.getKOTHAmount(ether('1')), 'KOTHPresale: KOTH token is not registered');
    });
    it('reverts if KOTH token not registered and calling getPurchasePrice()', async function () {
      await expectRevert(this.presale.getPurchasePrice(ether('10')), 'KOTHPresale: KOTH token is not registered');
    });
    it('reverts when buying tokens without referrer and KOTH token not registered', async function () {
      await this.presale.unpause({ from: owner });
      await expectRevert(
        this.presale.buyKOTH({ from: user1, value: ether('1') }),
        'KOTHPresale: KOTH token is not registered'
      );
    });
    it('reverts when buying tokens with a referrer and KOTH token not registered', async function () {
      await this.presale.unpause({ from: owner });
      await expectRevert(
        this.presale.buyKOTHWithReferrer(referrer1, { from: user1, value: ether('1') }),
        'KOTHPresale: KOTH token is not registered'
      );
    });
  });
  context('KOTHPresale post-KOTH deployment', function () {
    beforeEach(async function () {
      this.presale = await KOTHPresale.new(owner, wallet, KOTH_PRICE, { from: dev });
      this.koth = await KOTH.new(owner, this.presale.address, { from: dev });
      await this.presale.unpause({ from: owner });
    });
    it('KOTH token is registered', async function () {
      expect(await this.presale.getKOTH()).to.equal(this.koth.address);
    });
    it('reverts when KOTH token is set twice', async function () {
      await expectRevert(
        KOTH.new(owner, this.presale.address, { from: dev }),
        'KOTHPresale: KOTH address is already set'
      );
    });
    it('has rate', async function () {
      expect(await this.presale.rate()).to.be.a.bignumber.equal(new BN(10));
    });
    it('provides a KOTH token amount per price in wei', async function () {
      expect(await this.presale.getKOTHAmount(ether('10'))).to.be.a.bignumber.equal(ether('100'));
    });
    it('provides a wei amount per KOTH token amount', async function () {
      expect(await this.presale.getPurchasePrice(ether('20'))).to.be.a.bignumber.equal(ether('2'));
    });
    it('reverts when purchase price is 0 because getting price of not enough tokens', async function () {
      await expectRevert(this.presale.getPurchasePrice(new BN(9)), 'KOTHPresale: not enough tokens');
    });
    it('can buy tokens without referrer', async function () {
      await this.presale.buyKOTH({ from: user1, value: ether('1.3') });
      expect(await this.koth.balanceOf(user1)).to.be.a.bignumber.equal(ether('13'));
    });
    it('can buy tokens with referrer', async function () {
      await this.presale.grantReferrer(referrer1, { from: owner });
      await this.presale.buyKOTHWithReferrer(referrer1, { from: user1, value: ether('1') });
      expect(await this.koth.balanceOf(user1)).to.be.a.bignumber.equal(ether('11'));
    });
  });
  context('KOTHPresale percentage and price administration', function () {
    beforeEach(async function () {
      this.presale = await KOTHPresale.new(owner, wallet, KOTH_PRICE, { from: dev });
      this.koth = await KOTH.new(owner, this.presale.address, { from: dev });
    });
    it('owner can set KOTH price', async function () {
      await this.presale.setKOTHPrice(ether('0.2'), { from: owner });
      expect(await this.presale.getKOTHPrice()).to.be.a.bignumber.equal(ether('0.2'));
    });
    it('price changes impact rate', async function () {
      await this.presale.setKOTHPrice(ether('0.2'), { from: owner });
      expect(await this.presale.rate()).to.be.a.bignumber.equal(new BN(5));
    });
    it('reverts if set KOTH price not called by owner', async function () {
      await expectRevert(this.presale.setKOTHPrice(ether('0.2'), { from: dev }), 'Ownable: caller is not the owner');
    });
    it('has a default 10% KOTH bonus percentage for buyers by referrers', async function () {
      expect(await this.presale.getKOTHBonusPercentage()).to.be.a.bignumber.equal(new BN(10));
    });
    it('owner can set the KOTH bonus percentage for buyers by referrers', async function () {
      await this.presale.setKOTHBonusPercentage(new BN(20), { from: owner });
      expect(await this.presale.getKOTHBonusPercentage()).to.be.a.bignumber.equal(new BN(20));
    });
    it('reverts if KOTH bonus percentage is irrational', async function () {
      await expectRevert(
        this.presale.setKOTHBonusPercentage(new BN(101), { from: owner }),
        'KOTHPresale: KOTH bonus percentage greater than 100'
      );
    });
    it('reverts if KOTH bonus percentage is not set by owner', async function () {
      await expectRevert(
        this.presale.setKOTHBonusPercentage(new BN(15), { from: dev }),
        'Ownable: caller is not the owner'
      );
    });
    it('has a default 10% original referrer percentage', async function () {
      expect(await this.presale.getOriginalReferrerPercentage()).to.be.a.bignumber.equal(new BN(10));
    });
    it('owner can set the original referrer percentage', async function () {
      await this.presale.setOriginalReferrerPercentage(new BN(20), { from: owner });
      expect(await this.presale.getOriginalReferrerPercentage()).to.be.a.bignumber.equal(new BN(20));
    });
    it('reverts if original referrer percentage is irrational', async function () {
      await expectRevert(
        this.presale.setOriginalReferrerPercentage(new BN(101), { from: owner }),
        'KOTHPresale: Original referrer percentage greater than 100'
      );
    });
    it('reverts if original referrer percentage is not set by owner', async function () {
      await expectRevert(
        this.presale.setOriginalReferrerPercentage(new BN(15), { from: dev }),
        'Ownable: caller is not the owner'
      );
    });

    it('has a default 7% child referrer percentage', async function () {
      expect(await this.presale.getChildReferrerPercentage()).to.be.a.bignumber.equal(new BN(7));
    });
    it('owner can set the child referrer percentage', async function () {
      await this.presale.setChildReferrerPercentage(new BN(8), { from: owner });
      expect(await this.presale.getChildReferrerPercentage()).to.be.a.bignumber.equal(new BN(8));
    });
    it('reverts if child referrer percentage is irrational', async function () {
      await expectRevert(
        this.presale.setChildReferrerPercentage(new BN(11), { from: owner }),
        'KOTHPresale: Original referrer percentage less than child percentage'
      );
    });
    it('reverts if child referrer percentage is not set by owner', async function () {
      await expectRevert(
        this.presale.setChildReferrerPercentage(new BN(6), { from: dev }),
        'Ownable: caller is not the owner'
      );
    });
    it('has a default 3% parent referrer percentage', async function () {
      expect(await this.presale.getParentReferrerPercentage()).to.be.a.bignumber.equal(new BN(3));
    });
    it('modifying original referrer percentage impact parent referrer percentage', async function () {
      await this.presale.setOriginalReferrerPercentage(new BN(20), { from: owner });
      const originalPercentage = await this.presale.getOriginalReferrerPercentage();
      const childPercentage = await this.presale.getChildReferrerPercentage();
      expect(await this.presale.getParentReferrerPercentage()).to.be.a.bignumber.equal(
        originalPercentage.sub(childPercentage)
      );
    });
    it('modifying child referrer percentage impact parent referrer percentage', async function () {
      await this.presale.setChildReferrerPercentage(new BN(4), { from: owner });
      const originalPercentage = await this.presale.getOriginalReferrerPercentage();
      const childPercentage = await this.presale.getChildReferrerPercentage();
      expect(await this.presale.getParentReferrerPercentage()).to.be.a.bignumber.equal(
        originalPercentage.sub(childPercentage)
      );
    });
  });
  context('KOTHPresale referrer system', function () {
    beforeEach(async function () {
      this.presale = await KOTHPresale.new(owner, wallet, KOTH_PRICE, { from: dev });
    });
    it('owner can grant referrer', async function () {
      expect(await this.presale.isReferrer(referrer1), `${referrer1} must not be a referrer`).to.be.false;
      expect(
        await this.presale.isOriginalReferrer(referrer1),
        `${referrer1} must not be an original referrer`
      ).to.be.false;
      expect(await this.presale.isChildReferrer(referrer1), `${referrer1} must not be a child referrer`).to.be.false;
      expect(await this.presale.parentReferrerOf(referrer1), `${referrer1} must not have a parent referrer`).to.equal(
        constants.ZERO_ADDRESS
      );
      await this.presale.grantReferrer(referrer1, { from: owner });
      expect(await this.presale.isReferrer(referrer1), `${referrer1} must be a referrer`).to.be.true;
      expect(await this.presale.isOriginalReferrer(referrer1), `${referrer1} must be an original referrer`).to.be.true;
      expect(await this.presale.isChildReferrer(referrer1), `${referrer1} must not be a child referrer`).to.be.false;
      expect(await this.presale.parentReferrerOf(referrer1), `${referrer1} must not have a parent referrer`).to.equal(
        constants.ZERO_ADDRESS
      );
    });
    it('reverts if not an owner grants referrer', async function () {
      await expectRevert(this.presale.grantReferrer(referrer1, { from: dev }), 'Ownable: caller is not the owner');
    });
    it('a user can become a child referrer', async function () {
      await this.presale.grantReferrer(referrer1, { from: owner });
      await this.presale.mintReferrer(referrer1, { from: childReferrer1 });
      expect(await this.presale.isReferrer(referrer1), `${childReferrer1} must be a referrer`).to.be.true;
      expect(
        await this.presale.isOriginalReferrer(childReferrer1),
        `${childReferrer1} must not be an original referrer`
      ).to.be.false;
      expect(
        await this.presale.isChildReferrer(childReferrer1),
        `${childReferrer1} must be a child referrer`
      ).to.be.true;
      expect(
        await this.presale.parentReferrerOf(childReferrer1),
        `${childReferrer1} must have a parent referrer`
      ).to.equal(referrer1);
    });
    it('reverts if a user try to become a child referrer of a non active referrer', async function () {
      await expectRevert(
        this.presale.mintReferrer(referrer1, { from: childReferrer1 }),
        'KOTHPresale: account is not a referrer'
      );
    });
    it('reverts if a user try to become a child referrer of a non original referrer', async function () {
      await this.presale.grantReferrer(referrer1, { from: owner });
      await this.presale.mintReferrer(referrer1, { from: childReferrer1 });
      await expectRevert(
        this.presale.mintReferrer(childReferrer1, { from: childReferrer2 }),
        'KOTHPresale: account is not an original referrer'
      );
    });
  });
  context('KOTHPresale pause/unpause', function () {
    beforeEach(async function () {
      this.presale = await KOTHPresale.new(owner, wallet, KOTH_PRICE, { from: dev });
      this.koth = await KOTH.new(owner, this.presale.address, { from: dev });
    });
    it('presale is paused by default', async function () {
      expect(await this.presale.paused()).to.be.true;
    });
    it('KOTH contract is paused by default', async function () {
      expect(await this.koth.paused()).to.be.true;
    });
    it('owner can start presale', async function () {
      await this.presale.unpause({ from: owner });
      expect(await this.presale.paused()).to.be.false;
    });
    it('reverts if not an owner starts presale', async function () {
      await expectRevert(this.presale.unpause({ from: dev }), 'Ownable: caller is not the owner');
    });
    it('stopping the presale unpause the KOTH contract', async function () {
      await this.presale.unpause({ from: owner }); // start the presale
      await this.presale.pause({ from: owner }); // stop the presale and should unpause the KOTH contract
      expect(await this.koth.paused()).to.be.false;
    });
    it('reverts when buying while presale is not running', async function () {
      await expectRevert(this.presale.buyKOTH({ from: user1, value: ether('1') }), 'Pausable: paused');
      await expectRevert(
        web3.eth.sendTransaction({
          from: user2,
          to: this.presale.address,
          value: ether('0.4'),
          gas: 6721975,
        }),
        'Pausable: paused'
      );
      await this.presale.grantReferrer(referrer1, { from: owner });
      await expectRevert(
        this.presale.buyKOTHWithReferrer(referrer1, { from: user2, value: ether('2') }),
        'Pausable: paused'
      );
    });
  });
  context('KOTHPresale buying without referrer', function () {
    beforeEach(async function () {
      this.presale = await KOTHPresale.new(owner, wallet, KOTH_PRICE, { from: dev });
      this.koth = await KOTH.new(owner, this.presale.address, { from: dev });
      await this.presale.unpause({ from: owner });
    });
    it('user can buy KOTH tokens from buyKOTH function', async function () {
      expect(await this.koth.balanceOf(user1), 'balance of user1 must be 0').to.be.a.bignumber.equal(ether('0'));
      await this.presale.buyKOTH({ from: user1, value: ether('1') });
      expect(await this.koth.balanceOf(user1)).to.be.a.bignumber.equal(ether('10'));
    });
    it('user can buy KOTH tokens by sending ether to contract', async function () {
      await web3.eth.sendTransaction({
        from: user2,
        to: this.presale.address,
        value: ether('0.4'),
        gas: 6721975,
      });
      expect(await this.koth.balanceOf(user2)).to.be.a.bignumber.equal(ether('4'));
    });
    it('reverts if purchase is made with 0 ether', async function () {
      await expectRevert(
        this.presale.buyKOTH({ from: user1, value: ether('0') }),
        'KOTHPresale: purchase price can not be 0'
      );
    });
    it('wallet receives wei amount of purchases', async function () {
      const walletBalance = await balance.current(wallet);
      await this.presale.buyKOTH({ from: user1, value: ether('1') });
      await this.presale.buyKOTH({ from: user2, value: ether('3.5') });
      expect(await balance.current(wallet)).to.be.a.bignumber.equal(walletBalance.add(ether('4.5')));
    });
    it('update wei amount raised', async function () {
      await this.presale.buyKOTH({ from: user1, value: ether('1') });
      await this.presale.buyKOTH({ from: user2, value: ether('3.5') });
      await this.presale.buyKOTH({ from: user1, value: ether('0.1') });
      expect(await this.presale.weiRaised()).to.be.a.bignumber.equal(ether('4.6'));
    });
    it('emits KOTHPurchased event when a purchase is made', async function () {
      const purchaseReceipt1 = await this.presale.buyKOTH({ from: user1, value: ether('1') });
      expectEvent(purchaseReceipt1, 'KOTHPurchased', {
        purchaser: user1,
        parentReferrer: constants.ZERO_ADDRESS,
        childReferrer: constants.ZERO_ADDRESS,
        value: ether('1'),
        amount: ether('10'),
      });
      const purchaseReceipt2 = await this.presale.buyKOTH({ from: user2, value: ether('0.3') });
      expectEvent(purchaseReceipt2, 'KOTHPurchased', {
        purchaser: user2,
        parentReferrer: constants.ZERO_ADDRESS,
        childReferrer: constants.ZERO_ADDRESS,
        value: ether('0.3'),
        amount: ether('3'),
      });
    });
  });
  context('KOTHPresale buying with referrer', function () {
    beforeEach(async function () {
      this.presale = await KOTHPresale.new(owner, wallet, KOTH_PRICE, { from: dev });
      this.koth = await KOTH.new(owner, this.presale.address, { from: dev });
      await this.presale.unpause({ from: owner });
      await this.presale.grantReferrer(referrer1, { from: owner });
      await this.presale.grantReferrer(referrer2, { from: owner });
      await this.presale.mintReferrer(referrer1, { from: childReferrer1 });
      await this.presale.mintReferrer(referrer2, { from: childReferrer2 });
    });
    it('user can buy KOTH tokens with a bonus if using an original referrer', async function () {
      await this.presale.buyKOTHWithReferrer(referrer1, { from: user1, value: ether('1') });
      expect(await this.koth.balanceOf(user1)).to.be.a.bignumber.equal(ether('11'));
    });
    it('user can buy KOTH tokens with bonus if using a child referrer', async function () {
      await this.presale.buyKOTHWithReferrer(childReferrer1, { from: user1, value: ether('1') });
      expect(await this.koth.balanceOf(user1)).to.be.a.bignumber.equal(ether('11'));
    });
    it('reverts if purchase is made with 0 ether', async function () {
      await expectRevert(
        this.presale.buyKOTHWithReferrer(childReferrer2, { from: user1, value: ether('0') }),
        'KOTHPresale: purchase price can not be 0'
      );
    });
    it('reverts is purchase is made with a not active referrer', async function () {
      await expectRevert(
        this.presale.buyKOTHWithReferrer(user2, { from: user1, value: ether('0') }),
        'KOTHPresale: account is not a referrer'
      );
    });
    it('buying with original referrer gives purchase price percentage to original referrer', async function () {
      const referrer1Balance = await balance.current(referrer1);
      await this.presale.buyKOTHWithReferrer(referrer1, { from: user2, value: ether('2') });
      expect(await balance.current(referrer1)).to.be.a.bignumber.equal(referrer1Balance.add(ether('0.2')));
    });
    it('buying with child referrer gives purchase price percentage to parent and child referrer', async function () {
      const referrer2Balance = await balance.current(referrer2);
      const childReferrer2Balance = await balance.current(childReferrer2);
      await this.presale.buyKOTHWithReferrer(childReferrer2, { from: user2, value: ether('1') });
      expect(await balance.current(referrer2), 'wrong parent ether balance').to.be.a.bignumber.equal(
        referrer2Balance.add(ether('0.03'))
      );
      expect(await balance.current(childReferrer2), 'wrong child ether balance').to.be.a.bignumber.equal(
        childReferrer2Balance.add(ether('0.07'))
      );
    });
    it('buying with any referrer gives 90% to wallet', async function () {
      const walletBalance = await balance.current(wallet);
      await this.presale.buyKOTHWithReferrer(childReferrer2, { from: user2, value: ether('1') });
      await this.presale.buyKOTHWithReferrer(referrer2, { from: user2, value: ether('2') });
      expect(await balance.current(wallet)).to.be.a.bignumber.equal(walletBalance.add(ether('2.7')));
    });
    it('Original referrer can buy token for himself and get double bonus (price and nb KOTH)', async function () {
      const referrer1Balance = await balance.current(referrer1);
      await this.presale.buyKOTHWithReferrer(referrer1, {
        from: referrer1,
        value: ether('10'),
        gasPrice: 0,
      });
      expect(await this.koth.balanceOf(referrer1), 'wrong referrer1 KOTH balance').to.be.a.bignumber.equal(
        ether('110')
      );
      expect(await balance.current(referrer1), 'wrong referrer1 ether balance').to.be.a.bignumber.equal(
        referrer1Balance.sub(ether('9'))
      );
    });
    it('reverts when child referrer buy token for himself', async function () {
      await expectRevert(
        this.presale.buyKOTHWithReferrer(childReferrer1, { from: childReferrer1, value: ether('2') }),
        'KOTHPresale: child referrer can not buy for himself'
      );
    });
  });
});
