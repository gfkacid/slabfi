// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {OracleConsumer} from "../src/hub/OracleConsumer.sol";
import {IReceiver} from "../src/interfaces/IReceiver.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract OracleConsumerTest is Test {
    OracleConsumer public oracle;

    address public forwarder = address(0xF00);
    address public collection = address(0x1);
    uint256 public tokenId = 1;

    function setUp() public {
        OracleConsumer impl = new OracleConsumer();
        bytes memory data = abi.encodeWithSelector(OracleConsumer.initialize.selector, forwarder);
        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), data);
        oracle = OracleConsumer(address(proxy));
    }

    function test_OnReport_FromForwarder() public {
        bytes memory report = abi.encode(collection, tokenId, uint256(175e8));
        vm.prank(forwarder);
        oracle.onReport("", report);
        (uint256 price,) = oracle.getPrice(collection, tokenId);
        assertEq(price, 175e8);
    }

    function test_RevertWhen_OnReport_NotForwarder() public {
        bytes memory report = abi.encode(collection, tokenId, uint256(100e8));
        vm.expectRevert(OracleConsumer.InvalidForwarder.selector);
        oracle.onReport("", report);
    }

    function test_RevertWhen_OnReport_ZeroCollection() public {
        bytes memory report = abi.encode(address(0), tokenId, uint256(100e8));
        vm.prank(forwarder);
        vm.expectRevert(OracleConsumer.InvalidReport.selector);
        oracle.onReport("", report);
    }

    function test_SetMockPrice() public {
        oracle.setMockPrice(collection, tokenId, 150e8, 1);
        (uint256 price,) = oracle.getPrice(collection, tokenId);
        assertEq(price, 150e8);
    }

    function test_GetEffectiveLTV() public {
        oracle.setMockPrice(collection, tokenId, 100e8, 1);
        uint256 ltv = oracle.getEffectiveLTV(collection, tokenId);
        assertGt(ltv, 0);
        assertLe(ltv, 4000);
    }

    function test_RevertWhen_PriceStale() public {
        oracle.setMockPrice(collection, tokenId, 100e8, 1);
        vm.warp(block.timestamp + 27 hours);
        vm.expectRevert("Price stale");
        oracle.getPrice(collection, tokenId);
    }

    function test_SupportsInterface_IReceiver() public view {
        assertTrue(oracle.supportsInterface(type(IReceiver).interfaceId));
        assertTrue(oracle.supportsInterface(0x01ffc9a7)); // IERC165
    }
}
