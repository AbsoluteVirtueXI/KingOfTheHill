// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;
import "@openzeppelin/contracts/token/ERC777/ERC777.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./KingOfTheHill.sol";

contract KOTH is Context, ERC777, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor(
        address owner,
        address presaleContract,
        address[] memory defaultOperators_
    ) ERC777("KOTH", "KOTH", defaultOperators_) {
        require(defaultOperators().length == 1, "KOTH: Only 1 default operators allowed");
        require(defaultOperators()[0] != address(0), "KOTH: Default operator can not be zero address");
        _onCreate(owner, presaleContract);
    }

    function _onCreate(address owner, address presaleContract) private {
        _setupRole(DEFAULT_ADMIN_ROLE, owner);
        _setupRole(MINTER_ROLE, owner);
        _setupRole(MINTER_ROLE, presaleContract);
        _register();
    }

    function _register() private {
        KingOfTheHill game = KingOfTheHill(defaultOperators()[0]);
        game.setKOTH();
    }

    modifier onlyMinter(address account) {
        require(hasRole(MINTER_ROLE, _msgSender()), "KOTH: sender must be a minter for minting");
        _;
    }

    function mint(address account, uint256 amount) public onlyMinter(_msgSender()) {
        _mint(account, amount, "", "");
    }
}
