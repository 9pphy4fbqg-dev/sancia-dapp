// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SanciaToken
 * @dev 标准ERC20代币合约，总供应量11.6亿SCIA
 */
contract SanciaToken is ERC20, Ownable {
    /**
     * @dev 构造函数
     * 初始供应量：11.6亿SCIA
     */
    constructor(address initialOwner) ERC20("Sancia", "SCIA") Ownable(initialOwner) {
        _mint(msg.sender, 1160000000 * 10**18); // 11.6亿代币
    }
    
    /**
     * @dev 放弃所有权函数（可选择调用）
     */
    function renounceOwnership() public override onlyOwner {
        super.renounceOwnership();
    }
}
