// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {OracleConsumer} from "../src/hub/OracleConsumer.sol";
import {MockFdcVerification} from "../src/mocks/MockFdcVerification.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract OracleConsumerTest is Test {
    OracleConsumer public oracle;
    MockFdcVerification public fdcMock;

    address public collection = address(0x1);
    uint256 public tokenId = 1;

    function setUp() public {
        fdcMock = new MockFdcVerification();
        OracleConsumer impl = new OracleConsumer();
        bytes memory data = abi.encodeWithSelector(OracleConsumer.initialize.selector, address(fdcMock));
        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), data);
        oracle = OracleConsumer(address(proxy));
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
}
