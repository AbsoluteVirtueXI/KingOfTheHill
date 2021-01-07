// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "@openzeppelin/contracts/GSN/Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./KOTH.sol";

// TODO need to check order of deployment between KOTH KOTHPresale and KingOfTheHill
contract KOTHPresale is Context, Ownable {
    using SafeMath for uint256;

    uint256 private _price;
    uint256 private _weiRaised;
    uint256 private _kothBonusPercentage;
    uint256 private _originalReferrerPercentage;
    uint256 private _referrerPercentage;
    KOTH private _koth;
    address payable private _wallet;

    mapping(address => Referrer) private _referrer;

    struct Referrer {
        bool isActive;
        address parent;
    }

    constructor(
        address owner,
        address payable wallet_,
        uint256 price
    ) {
        _wallet = wallet_;
        _price = price;
        _kothBonusPercentage = 10;
        _originalReferrerPercentage = 10;
        _referrerPercentage = 7;
        transferOwnership(owner);
    }

    modifier onlyKOTHRegistered() {
        require(address(_koth) != address(0), "KOTHPresale: KOTH token is not registered");
        _;
    }

    // calculate the percentage of amount in wei
    function percentageToAmount(uint256 amount, uint256 percentage) public pure returns(uint256) {
        return amount.mul(percentage).div(100);
    }


    function wallet() public view returns (address payable) {
        return _wallet;
    }

    function weiRaised() public view returns (uint256) {
        return _weiRaised;
    }

    function getKOTHPrice() public view returns (uint256) {
        return _price;
    }

    function setKOTHPrice(uint256 price) public onlyOwner() {
        _price = price;
    }

    // This function will be called by the KOTH contract at deployment only 1 time
    function setKOTH() external {
        require(address(_koth) == address(0), "KOTHPresale: KOTH address is already set");
        _koth = KOTH(_msgSender());
    }

    function getKOTH() public view returns (address) {
        return address(_koth);
    }

    function isReferrer(address account) public view returns(bool) {
        return _referrer[account].isActive;
    }

    function isOriginalReferrer(address account) public view returns(bool) {
        return _referrer[account].parent == address(0);
    }

    function parentReferrerOf(address account) public view returns(address) {
        return _referrer[account].parent;
    }

    function grantReferrer(address account) public onlyOwner() {
        _referrer[account] = Referrer(true, address(0));
    }

    function mintReferrer(address account) public {
        require(_referrer[msg.sender].parent == address(0), "KOTHPresale: sender is not an original referrer");
        require(_referrer[account].isActive == false, "KOTHPresale: account is already a child referrer");
        _referrer[account] = Referrer(true, msg.sender);
    }

    // @dev price of 1 KOTH has to be lesser than 1 ETHER else rate will be 0 !!!
    function rate() public view onlyKOTHRegistered() returns (uint256) {
        return ((10**uint256(_koth.decimals()))).div(_price);
    }

    function getKOTHAmount(uint256 weiAmount) public view onlyKOTHRegistered() returns (uint256) {
        return weiAmount.mul(rate());
    }

    function getPurchasePrice(uint256 tokenAmount) public view onlyKOTHRegistered() returns (uint256) {
        uint256 purchasePrice = tokenAmount.div(rate());
        require(purchasePrice > 0, "KOTHPresale: not enough tokens");
        return purchasePrice;
    }

    receive() external payable {
        buyKOTH();
    }

    // buy without referrer
    function buyKOTH() public payable onlyKOTHRegistered() {
        require(msg.value > 0, "KOTHPresale: purchase price can not be 0");
        uint256 nbKOTH = getKOTHAmount(msg.value);
        _weiRaised = _weiRaised.add(msg.value);
        _koth.mint(_msgSender(), nbKOTH);
        _wallet.transfer(msg.value);
    }

    // buy with a referrer
    function buyKOTHWithReferrer(address referrer) public payable onlyKOTHRegistered() {
        require(referrer != address(0), "KOTHPresale: referrer is the zero address");
        require(_isReferrer[referrer] == true, "KOTHPresale: account is not a valid referrer");
        require(msg.value > 0, "KOTHPresale: purchase price can not be 0");
        uint256 nbKOTH = getKOTHAmount(msg.value).add(percentageToAmount(nbKoth, _kothBonusPercentage));
        nbKOTH = nbKOTH
    }
}
