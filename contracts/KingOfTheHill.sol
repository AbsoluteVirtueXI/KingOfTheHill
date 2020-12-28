// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;
import "./KOTH.sol";

contract KingOfTheHill {
    KOTH private _koth;

    constructor() {}

    function setKOTH() external {
        require(address(_koth) == address(0), "KingOfTheHill: KOTH address is already set");
        _koth = KOTH(msg.sender);
    }

    function getKOTH() public view returns (address) {
        return address(_koth);
    }
}
