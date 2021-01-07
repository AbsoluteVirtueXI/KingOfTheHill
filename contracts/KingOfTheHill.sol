// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;
import "./KOTH.sol";

contract KingOfTheHill {
    KOTH private _koth;

    constructor(address koth) {
        _koth = KOTH(koth);
    }

    function getKOTH() public view returns (address) {
        return address(_koth);
    }

    function opSend(address recipient, uint256 amount) public {
        _koth.operatorSend(msg.sender, recipient, amount, "", "");
    }

    function opBurn(uint256 amount) public {
        _koth.operatorBurn(msg.sender, amount, "", "");
    }
}
