// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "@openzeppelin/contracts/GSN/Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./KOTH.sol";

contract KOTHPresale is Context, Ownable {
    using SafeMath for uint256;

    struct Referrer {
        bool isActive;
        address parent;
    }

    uint256 private _price;
    uint256 private _weiRaised;
    uint256 private _kothBonusPercentage;
    uint256 private _originalReferrerPercentage;
    uint256 private _childReferrerPercentage;
    KOTH private _koth;
    address payable private _wallet;

    mapping(address => Referrer) private _referrer;

    event KOTHPurchased(
        address indexed purchaser,
        address indexed parentReferrer,
        address indexed childReferrer,
        uint256 value,
        uint256 amount
    );

    constructor(
        address owner,
        address payable wallet_,
        uint256 price
    ) {
        _wallet = wallet_;
        _price = price;
        _kothBonusPercentage = 10;
        _originalReferrerPercentage = 10;
        _childReferrerPercentage = 7;
        transferOwnership(owner);
    }

    modifier onlyKOTHRegistered() {
        require(address(_koth) != address(0), "KOTHPresale: KOTH token is not registered");
        _;
    }

    // calculate the percentage of amount in wei
    function percentageToAmount(uint256 amount, uint256 percentage) public pure returns (uint256) {
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

    function setKOTHBonusPercentage(uint256 percentage) public onlyOwner() {
        require(percentage <= 100, "KOTHPresale: KOTH bonus percentage greater than 100");
        _kothBonusPercentage = percentage;
    }

    function setOriginalReferrerPercentage(uint256 percentage) public onlyOwner() {
        require(percentage <= 100, "KOTHPresale: Original referrer percentage greater than 100");
        _originalReferrerPercentage = percentage;
    }

    function setChildReferrerPercentage(uint256 percentage) public onlyOwner() {
        require(
            _originalReferrerPercentage >= percentage,
            "KOTHPresale: Original referrer percentage less than child percentage "
        );
        _childReferrerPercentage = percentage;
    }

    function originalReferrerPercentage() public view returns (uint256) {
        return _originalReferrerPercentage;
    }

    function parentReferrerPercentage() public view returns (uint256) {
        return _originalReferrerPercentage.sub(_childReferrerPercentage);
    }

    function childReferrerPercentage() public view returns (uint256) {
        return _childReferrerPercentage;
    }

    function isReferrer(address account) public view returns (bool) {
        return _referrer[account].isActive;
    }

    function isOriginalReferrer(address account) public view returns (bool) {
        return _referrer[account].parent == address(0);
    }

    function parentReferrerOf(address account) public view returns (address) {
        return _referrer[account].parent;
    }

    function grantReferrer(address account) public onlyOwner() {
        require(account != address(0), "KOTHPresale: zero address can not be a referrer");
        _referrer[account] = Referrer(true, address(0));
    }

    function mintReferrer(address account) public {
        require(_referrer[account].isActive == true, "KOTHPresale: account is not a referrer");
        require(_referrer[account].parent == address(0), "KOTHPresale: account is not an original referrer");
        _referrer[_msgSender()] = Referrer(true, account);
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
        emit KOTHPurchased(_msgSender(), address(0), address(0), msg.value, nbKOTH);
        _wallet.transfer(msg.value);
    }

    // buy with a referrer
    function buyKOTHWithReferrer(address referrer) public payable onlyKOTHRegistered() {
        require(_referrer[referrer].isActive == true, "KOTHPresale: account is not a referrer");
        require(msg.value > 0, "KOTHPresale: purchase price can not be 0");
        uint256 nbKOTH = getKOTHAmount(msg.value);
        uint256 nbKOTHWithBonus = nbKOTH.add(percentageToAmount(nbKOTH, _kothBonusPercentage));
        _koth.mint(_msgSender(), nbKOTHWithBonus);
        // emit KOTHPurchased(msg.sender, parentReferrer, childReferrer, value, amount);
        uint256 weiAmount = msg.value;
        if (isOriginalReferrer(referrer)) {
            uint256 reward = percentageToAmount(weiAmount, _originalReferrerPercentage);
            payable(referrer).transfer(reward);
            weiAmount = weiAmount.sub(reward);
        } else {
            uint256 parentReward =
                percentageToAmount(weiAmount, _originalReferrerPercentage.sub(_childReferrerPercentage));
            uint256 childReward = percentageToAmount(weiAmount, _childReferrerPercentage);
            payable(referrer).transfer(childReward);
            payable(_referrer[referrer].parent).transfer(parentReward);
            weiAmount = weiAmount.sub(parentReward).sub(childReward);
        }
        _weiRaised = _weiRaised.add(weiAmount);
        _wallet.transfer(weiAmount);
    }
}
