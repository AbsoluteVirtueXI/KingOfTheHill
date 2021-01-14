/* eslint-disable comma-dangle */
/* eslint-disable no-unused-expressions */
const { contract, accounts, web3 } = require('@openzeppelin/test-environment');
const { BN, expectRevert, constants, singletons, ether } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const KOTH = contract.fromArtifact('KOTH');
const KingOfTheHill = contract.fromArtifact('KingOfTheHill');
const KOTHPresale = contract.fromArtifact('KOTHPresale');

describe('KOTH token', function () {
  const [owner, wallet, dev, user1, user2, user3, registryFunder, exchange] = accounts;
  const KOTH_NAME = 'KOTH';
  const KOTH_SYMBOL = 'KOTH';
  const DECIMALS = 18;
  const DEFAULT_ADMIN_ROLE = constants.ZERO_BYTES32;
  const MINTER_ROLE = web3.utils.soliditySha3('MINTER_ROLE');
  const GAME_MASTER_ROLE = web3.utils.soliditySha3('GAME_MASTER_ROLE');
  const PAUSER_ROLE = web3.utils.soliditySha3('PAUSER_ROLE');
  const PRICE = ether('0.1');
  beforeEach(async function () {
    this.erc1820 = await singletons.ERC1820Registry(registryFunder);
    this.presale = await KOTHPresale.new(owner, wallet, PRICE, { from: dev });
  });
  context('KOTH Deployment', function () {
    beforeEach(async function () {
      this.koth = await KOTH.new(owner, this.presale.address, { from: dev });
    });
    it('has 0 default operator', async function () {
      expect(await this.koth.defaultOperators()).to.have.lengthOf(0);
    });
    it('registers KOTH to presale contract at deployment', async function () {
      expect(await this.presale.getKOTH()).to.equal(this.koth.address);
    });
    it('reverts if at deployment an address is already registered in presale contract', async function () {
      await expectRevert(KOTH.new(owner, this.presale.address), 'KOTHPresale: KOTH address is already set');
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
    it(`has owner, ${owner}, as GAME_MASTER_ROLE`, async function () {
      expect(await this.koth.hasRole(GAME_MASTER_ROLE, owner)).to.be.true;
    });
    it(`has owner, ${owner}, as MINTER_ROLE`, async function () {
      expect(await this.koth.hasRole(MINTER_ROLE, owner)).to.be.true;
    });
    it(`has owner, ${owner}, as PAUSER_ROLE`, async function () {
      expect(await this.koth.hasRole(PAUSER_ROLE, owner)).to.be.true;
    });

    it('has presale contract as MINTER_ROLE', async function () {
      expect(await this.koth.hasRole(MINTER_ROLE, this.presale.address)).to.be.true;
    });
    it('has presale contract as PAUSER_ROLE', async function () {
      expect(await this.koth.hasRole(PAUSER_ROLE, this.presale.address)).to.be.true;
    });
    it('has only 2 MINTER_ROLE', async function () {
      expect(await this.koth.getRoleMemberCount(MINTER_ROLE)).to.a.bignumber.equal(new BN(2));
    });
    it('DEFAULT_ADMIN_ROLE controls MINTER_ROLE', async function () {
      expect(await this.koth.getRoleAdmin(MINTER_ROLE)).to.equal(DEFAULT_ADMIN_ROLE);
    });
    it('DEFAULT_ADMIN_ROLE controls GAME_MASTER_ROLE', async function () {
      expect(await this.koth.getRoleAdmin(GAME_MASTER_ROLE)).to.equal(DEFAULT_ADMIN_ROLE);
    });
    it('owner can revoke MINTER_ROLE', async function () {
      await this.koth.revokeRole(MINTER_ROLE, this.presale.address, { from: owner });
    });
    it('owner can revoke GAME_MASTER_ROLE', async function () {
      await this.koth.revokeRole(GAME_MASTER_ROLE, owner, { from: owner });
    });
    it('has a pause state', async function () {
      expect(await this.koth.paused()).to.be.true;
    });
  });
  context('KOTH minting', function () {
    beforeEach(async function () {
      this.koth = await KOTH.new(owner, this.presale.address, { from: dev });
    });
    it(`owner, ${owner}, can mint KOTH`, async function () {
      await this.koth.mint(user1, new BN(101), { from: owner });
      expect(await this.koth.balanceOf(user1)).to.be.a.bignumber.equal(new BN(101));
    });
    it('presale contract can mint KOTH', async function () {
      await this.presale.unpause({ from: owner });
      const purchasePrice = ether('21');
      const nbKOTH = await this.presale.getKOTHAmount(purchasePrice);
      await this.presale.buyKOTH({ from: user2, value: purchasePrice });
      expect(await this.koth.balanceOf(user2)).to.be.a.bignumber.equal(nbKOTH);
    });
    it('reverts if not a MINTER_ROLE calls mint function', async function () {
      await expectRevert(this.koth.mint(dev, new BN(1337), { from: dev }), 'KOTH: sender must be a minter for minting');
    });
  });
  context('KOTH pause/unpause', function () {
    beforeEach(async function () {
      this.koth = await KOTH.new(owner, this.presale.address, { from: dev });
    });
    it('KOTH token is paused by default', async function () {
      expect(await this.koth.paused()).to.be.true;
    });
    it('owner can unpause KOTH token contract', async function () {
      await this.koth.unpause({ from: owner });
      expect(await this.koth.paused()).to.be.false;
    });
    it('presale can unpause KOTH token contract when presale is done', async function () {
      const presale = await KOTHPresale.new(owner, wallet, PRICE, { from: dev });
      const koth = await KOTH.new(owner, presale.address, { from: dev });
      expect(await presale.paused()).to.be.true;
      expect(await presale.paused()).to.be.true;
      await presale.unpause({ from: owner });
      expect(await koth.paused()).to.be.true;
      expect(await presale.paused()).to.be.false;
      await presale.pause({ from: owner });
      expect(await presale.paused()).to.be.true;
      expect(await koth.paused()).to.be.false;
    });
    it('reverts if pause/unpause is not called by a PAUSER_ROLE', async function () {
      await expectRevert(this.koth.pause({ from: user1 }), 'KOTH: sender must be a pauser');
      await this.koth.unpause({ from: owner });
      await expectRevert(this.koth.unpause({ from: user1 }), 'KOTH: sender must be a pauser');
    });
    it('minting from owner and presale works while KOTH contract is paused', async function () {
      await this.koth.mint(user1, ether('50'), { from: owner });
      expect(await this.koth.balanceOf(user1), 'wrong user1 KOTH balance').to.be.a.bignumber.equal(ether('50'));
      await this.presale.unpause({ from: owner });
      await this.presale.buyKOTH({ from: user2, value: ether('6') });
      expect(await this.koth.balanceOf(user2), 'wrong user2 KOTH balance').to.be.a.bignumber.equal(ether('60'));
    });
    it('can transfer/transferForm/approve while unpaused', async function () {
      await this.koth.unpause({ from: owner });
      await this.koth.mint(user1, ether('10'), { from: owner });
      await this.koth.transfer(user2, ether('4'), { from: user1 });
      expect(await this.koth.balanceOf(user2), 'wrong user2 KOTH balance').to.be.a.bignumber.equal(ether('4'));
      await this.koth.approve(exchange, ether('6'), { from: user1 });
      expect(await this.koth.allowance(user1, exchange)).to.be.a.bignumber.equal(ether('6'));
      await this.koth.transferFrom(user1, user3, ether('6'), { from: exchange });
      expect(await this.koth.balanceOf(user3), 'wrong user3 KOTH balance').to.be.a.bignumber.equal(ether('6'));
    });
    it('reverts when transfer/transferFrom/approve is called while paused', async function () {
      await this.koth.mint(user1, ether('5'), { from: owner });
      await expectRevert(this.koth.transfer(user2, ether('4'), { from: user1 }), 'Pausable: paused');
      await expectRevert(this.koth.approve(user2, ether('5'), { from: user1 }), 'Pausable: paused');
      await expectRevert(
        this.koth.transferFrom(user1, user2, ether('6'), { from: this.presale.address }),
        'Pausable: paused'
      );
    });
  });
  context('KOTH: KingOfTheHill default operator', function () {
    beforeEach(async function () {
      this.koth = await KOTH.new(owner, this.presale.address, { from: dev });
      this.kingOfTheHill = await KingOfTheHill.new(owner, wallet, this.koth.address, { from: dev });
    });
    it('GAME_MASTER_ROLE can set game contract as default operator', async function () {
      await this.koth.addGameContract(this.kingOfTheHill.address, { from: owner });
      const defaultOperator = await this.koth.defaultOperators();
      const gameOperator = defaultOperator[0];
      expect(gameOperator).to.equal(this.kingOfTheHill.address);
    });
    it('reverts if game contract is set twice', async function () {
      await this.koth.addGameContract(this.kingOfTheHill.address, { from: owner });
      await expectRevert(
        this.koth.addGameContract(this.kingOfTheHill.address, { from: owner }),
        'KOTH: game contract is already set'
      );
    });
    it('reverts if game contract is zero address', async function () {
      await expectRevert(
        this.koth.addGameContract(constants.ZERO_ADDRESS, { from: owner }),
        'KOTH: game is zero address'
      );
    });
    it('reverts if not a GAME_MASTER_ROLE set game contract as default operator', async function () {
      await expectRevert(
        this.koth.addGameContract(this.kingOfTheHill.address, { from: dev }),
        'KOTH: sender must be a game master'
      );
    });
    it('GAME_MASTER_ROLE can remove game contract from default operators', async function () {
      await this.koth.addGameContract(this.kingOfTheHill.address, { from: owner });
      const defaultOperator = await this.koth.defaultOperators();
      const gameOperator = defaultOperator[0];
      expect(gameOperator, 'it must have 1 default operator').to.equal(this.kingOfTheHill.address);
      await this.koth.removeGameContract(this.kingOfTheHill.address, { from: owner });
      expect(await this.koth.defaultOperators()).to.have.lengthOf(0);
    });
    it('reverts if not a GAME_MASTER_ROLE remove game contract from default operators', async function () {
      await this.koth.addGameContract(this.kingOfTheHill.address, { from: owner });
      await expectRevert(
        this.koth.removeGameContract(this.kingOfTheHill.address, { from: dev }),
        'KOTH: sender must be a game master'
      );
    });
    it('game contract as default operator can send tokens on behalf of all the token holders', async function () {
      await this.koth.addGameContract(this.kingOfTheHill.address, { from: owner });
      await this.koth.mint(user1, ether('12'), { from: owner });
      await this.kingOfTheHill.opSend(user2, ether('7'), { from: user1 });
      expect(await this.koth.balanceOf(user1), 'user1 balance must be 5 KOTH').to.be.a.bignumber.equal(ether('5'));
      expect(await this.koth.balanceOf(user2), 'user2 balance must be 7 KOTH').to.be.a.bignumber.equal(ether('7'));
    });
    it('game contract as default operator can burn tokens on behalf of all the token holders', async function () {
      await this.koth.addGameContract(this.kingOfTheHill.address, { from: owner });
      await this.koth.mint(user1, ether('12'), { from: owner });
      await this.kingOfTheHill.opBurn(ether('11'), { from: user1 });
      expect(await this.koth.balanceOf(user1)).to.be.a.bignumber.equal(ether('1'));
    });
  });
});
