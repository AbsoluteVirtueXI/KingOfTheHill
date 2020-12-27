// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;
import "@openzeppelin/contracts/token/ERC777/ERC777.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract KOTH is Context, ERC777, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // 1st elem of defaultOperators_ is presale address
    // 2nd elem of defaultOperators_ is game address
    constructor(address owner, address[] memory defaultOperators_) ERC777("KOTH", "KOTH", defaultOperators_) {
        require(defaultOperators().length == 2, "KOTH: Only 2 default operators allowed");
        require(
            defaultOperators()[0] != address(0) && defaultOperators()[1] != address(0),
            "KOTH: Default operators can not be zero address"
        );
        require(defaultOperators()[0] != defaultOperators()[1], "KOTH: Default operators have to be differents");
        _setupRole(DEFAULT_ADMIN_ROLE, owner);
        _setupRole(MINTER_ROLE, defaultOperators()[0]);
    }

    // Only presale contract can mint
    function operatorMint(
        address account,
        uint256 amount,
        bytes memory userData,
        bytes memory operatorData
    ) public {
        require(hasRole(MINTER_ROLE, _msgSender()));
        require(isOperatorFor(_msgSender(), account), "ERC777: caller is not an operator for holder");
        _mint(account, amount, userData, operatorData);
    }
}
