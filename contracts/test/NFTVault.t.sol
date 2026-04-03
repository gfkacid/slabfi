// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {NFTVault} from "../src/source/NFTVault.sol";
import {MockERC721} from "../src/mocks/MockERC721.sol";

contract NFTVaultTest is Test {
    NFTVault public vault;
    MockERC721 public nft;
    address adapter = address(0x1);

    function setUp() public {
        vault = new NFTVault(adapter);
        nft = new MockERC721();
        nft.mint(address(this), 1);
    }

    function test_OnlyAdapterCanDeposit() public {
        vm.prank(adapter);
        vault.deposit(address(nft), 1, address(this), keccak256("id1"));
        assertTrue(vault.deposited(keccak256("id1")));
    }

    function test_RevertWhen_NotAdapterDeposits() public {
        vm.prank(address(0x2));
        vm.expectRevert("Only adapter");
        vault.deposit(address(nft), 1, address(this), keccak256("id1"));
    }
}
