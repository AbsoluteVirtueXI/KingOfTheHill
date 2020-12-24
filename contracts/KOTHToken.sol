// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 < 0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// TODO: Should we had a CAP 
//import "@openzeppelin/contracts/token/ERC20/ERC20Capped.sol";


contract KOTHToken is ERC20, Ownable {
    constructor(address owner) ERC20("KOTH", "KOTH") {
        transferOwnership(owner);
    }
    
    function mint(address to, uint256 amount) public onlyOwner() {
        _mint(to, amount);
    }
}
