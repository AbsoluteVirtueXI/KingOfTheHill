// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./KOTH.sol";

contract KingOfTheHill is Ownable, Pausable {
    using SafeMath for uint256;

    bool private _isStrengthPowerUp;
    bool private _isDefensePowerUp;
    bool private _isAgilityPowerUp;
    KOTH private _koth;
    address private _wallet;
    address private _potOwner;
    uint256 private _percentagePotToBuy;
    uint256 private _percentagePotToSeed;
    uint256 private _strengthBonus; // a percentage
    uint256 private _defenseBonus; // a number
    uint256 private _agilityBonus; // a number
    uint256 private _agilityBuyNbBlockMin;
    uint256 private _nbAgility; // a number
    uint256 private _nbBlocksWinning;
    uint256 private _nbBlockBought;
    uint256 private _pot;
    uint256 private _seed;

    constructor(
        address owner,
        address wallet_,
        address koth_
    ) {
        _pause();
        _koth = KOTH(koth_);
        _wallet = wallet_;
        _percentagePotToBuy = 1; // percentage
        _percentagePotToSeed = 50; // percentage
        _nbBlocksWinning = 100; // number
        _strengthBonus = 10; // percentage
        _defenseBonus = 2; // number
        _agilityBonus = 1; // number
        transferOwnership(owner);
    }

    modifier onlyPotOwner() {
        require(_msgSender() == _potOwner, "KingOfTheHill: Only pot owner can buy bonus");
        _;
    }

    modifier onlyNotPotOwner() {
        require(_msgSender() != _potOwner, "KingOfTheHill: sender mut not be the pot owner");
        _;
    }

    modifier onlyRationalPercentage(uint256 percentage) {
        require(percentage >= 0 && percentage <= 100, "KingOfTheHill: percentage value is irrational");
        _;
    }

    function percentageToAmount(uint256 amount, uint256 percentage) public pure returns (uint256) {
        return amount.mul(percentage).div(100);
    }

    function koth() public view returns (address) {
        return address(_koth);
    }

    function wallet() public view returns (address) {
        return _wallet;
    }

    function nbBlocksWinning() public view returns (uint256) {
        return _nbBlocksWinning;
    }

    function setNbBlocksWinning(uint256 nbBlocks) public onlyOwner() {
        require(nbBlocks > 0, "KingOfTheHill: nbBlocks must be greater than 0");
        _nbBlocksWinning = nbBlocks;
    }

    function remainingBlocks() public view returns (uint256) {
        uint256 blockPassed = (block.number).sub(_nbBlockBought).add(_nbAgility.mul(_agilityBonus));
        if (_potOwner == address(0)) {
            return _nbBlocksWinning;
        } else if (blockPassed > _nbBlocksWinning) {
            return 0;
        } else {
            return _nbBlocksWinning.sub(blockPassed);
        }
    }

    function hasWinner() public view returns (bool) {
        if (_potOwner != address(0) && remainingBlocks() == 0) {
            return true;
        } else {
            return false;
        }
    }

    function percentagePotToBuy() public view returns (uint256) {
        return _percentagePotToBuy;
    }

    function setPercentagePotToBuy(uint256 percentage) public onlyOwner() onlyRationalPercentage(percentage) {
        _percentagePotToBuy = percentage;
    }

    function percentagePotToSeed() public view returns (uint256) {
        return _percentagePotToSeed;
    }

    function setPercentagePotToSeed(uint256 percentage) public onlyOwner() onlyRationalPercentage(percentage) {
        _percentagePotToSeed = percentage;
    }

    function strengthBonus() public view returns (uint256) {
        return _strengthBonus;
    }

    function setStrengthBonus(uint256 percentage) public onlyOwner() {
        //require("KingOfTheHill: Irration percentage")
        _strengthBonus = percentage;
    }

    function defenseBonus() public view returns (uint256) {
        return _defenseBonus;
    }

    function setDefenseBonus(uint256 percentage) public onlyOwner() {
        _defenseBonus = percentage;
    }

    function agilityBonus() public view returns (uint256) {
        return _agilityBonus;
    }

    function setAgilityBonus(uint256 nbBlock) public onlyOwner() {
        _agilityBonus = nbBlock;
    }

    function agilityBuyNbBlockMin() public view returns (uint256) {
        return _agilityBuyNbBlockMin;
    }

    function setAgilityBuyNbBlockMin(uint256 nbBlocks) public onlyOwner() {
        _agilityBuyNbBlockMin = nbBlocks;
    }

    function isStrengthPowerUp() public view returns (bool) {
        return _isStrengthPowerUp;
    }

    function isDefensePowerUp() public view returns (bool) {
        return _isDefensePowerUp;
    }

    function isAgilityPowerUp() public view returns (bool) {
        return _isAgilityPowerUp;
    }

    // Visible pot value is the contract balance minus the seed amount for next round
    function pot() public view returns (uint256) {
        return _pot;
    }

    function seed() public view returns (uint256) {
        return _seed;
    }

    function priceOfPot() public view returns (uint256) {
        uint256 price;
        if (!hasWinner()) {
            uint256 defPenality = 1;
            if (_isDefensePowerUp) {
                defPenality = _defenseBonus;
            }
            price = percentageToAmount(_pot, _percentagePotToBuy.mul(defPenality));
        } else {
            price = percentageToAmount(_seed, _percentagePotToBuy);
        }
        return price;
    }

    function prize() public view returns (uint256) {
        uint256 strBonus = 0;
        if (_isStrengthPowerUp) {
            strBonus = _strengthBonus;
        }
        return _pot.add(percentageToAmount(_pot, strBonus));
    }

    function contractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function potOwner() public view returns (address) {
        return _potOwner;
    }

    function buyPot() public payable onlyNotPotOwner() whenNotPaused() {
        require(msg.value >= priceOfPot(), "KingOfTheHill: Not enough ether for buying pot");
        if (hasWinner()) {
            emit Winner(_potOwner, prize());
            payable(_potOwner).transfer(prize());
            _pot = _seed;
            _seed = 0;
        }
        uint256 toSeed = percentageToAmount(priceOfPot(), _percentagePotToSeed);
        uint256 toPot = priceOfPot().sub(toSeed);
        _pot = _pot.add(toPot);
        _seed = _seed.add(toSeed);
        _nbBlockBought = block.number;
        _isStrengthPowerUp = false;
        _isDefensePowerUp = false;
        _isAgilityPowerUp = false;
        _nbAgility = 0;
        _potOwner = _msgSender();
        emit Bought(_msgSender());
        if (msg.value > priceOfPot()) {
            msg.sender.transfer(msg.value.sub(priceOfPot()));
        }
    }

    function buyStrength() public onlyPotOwner() whenNotPaused() {
        require(_isStrengthPowerUp == false, "KingOfTheHill: Already bought a strength power up");
        // TODO operator transfer
        _isStrengthPowerUp = true;
    }

    function buyDefense() public onlyPotOwner() whenNotPaused() {
        require(_isDefensePowerUp == false, "KingOfTheHill: Already bought a defense power up");
        // TODO operator transfer
        _isDefensePowerUp = true;
    }

    function buyAgility(uint256 nbAgility) public onlyPotOwner() whenNotPaused() {
        require(_isAgilityPowerUp == false, "KingOfTheHill: Already bought an agility power up");
        require(nbAgility > 0, "KingOfTheHill: can not buy 0 agility");
        require(remainingBlocks() > (_agilityBonus.mul(nbAgility)).add(3), "KingOfTheHill: too many agility power-up");
        _koth.operatorBurn(_msgSender(), _agilityBonus.mul(nbAgility).mul((10**uint256(_koth.decimals()))), "", "");
        _nbAgility = nbAgility;
        _isAgilityPowerUp = true;
    }

    function pause() public onlyOwner() {
        _pause();
    }

    function unpause() public onlyOwner() {
        _unpause();
    }

    // TODO add buy pot, winner event

    receive() external payable {
        _pot = _pot.add(msg.value);
    }

    event Winner(address indexed winner, uint256 amount);
    event Bought(address indexed buyer);
}
