// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {LendingPool} from "../src/hub/LendingPool.sol";
import {TestUSDC6} from "./helpers/TestUSDC6.sol";
import {CollateralRegistry} from "../src/hub/CollateralRegistry.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/// @dev Minimal stub — `LendingPool.borrow` only calls `availableCredit`.
contract MockCreditRegistry {
    function availableCredit(address) external pure returns (uint256) {
        return type(uint256).max;
    }
}

contract LendingPoolTest is Test {
    LendingPool public pool;
    TestUSDC6 public usdc;
    address borrower = address(0xB0B);

    function setUp() public {
        usdc = new TestUSDC6();
        usdc.mint(address(this), 1_000_000e6);

        address reg = address(new MockCreditRegistry());
        LendingPool impl = new LendingPool();
        pool = LendingPool(
            address(new ERC1967Proxy(
                address(impl), abi.encodeWithSelector(LendingPool.initialize.selector, address(usdc), reg)
            ))
        );

        usdc.approve(address(pool), type(uint256).max);
        pool.deposit(100_000e6);
    }

    function test_Deposit_mintsShares() public view {
        assertEq(pool.totalSupplyShares(), 100_000e6);
        assertEq(pool.balanceOfShares(address(this)), 100_000e6);
        assertEq(pool.totalAssets(), 100_000e6);
    }

    /// @dev External helper so `vm.expectRevert` matches the reverting sub-call (Forge quirk with direct calls).
    function withdrawAllAsLp() external {
        pool.withdraw(pool.balanceOfShares(address(this)));
    }

    function test_Borrow_drainsIdle_fullWithdrawRevertsWithInsufficientLiquidity() public {
        vm.prank(borrower);
        pool.borrow(95_000e6);

        vm.expectRevert(abi.encodeWithSignature("Error(string)", "InsufficientLiquidity"));
        this.withdrawAllAsLp();
    }

    function test_Borrow_drainsIdle_poolState() public {
        vm.startPrank(borrower);
        pool.borrow(95_000e6);
        vm.stopPrank();
        assertEq(pool.totalBorrows(), 95_000e6);
        assertEq(usdc.balanceOf(address(pool)), 5_000e6);
        assertEq(pool.totalAssets(), 100_000e6);
    }

    function test_Borrow_revertsWhenExceedsIdle() public {
        vm.startPrank(borrower);
        vm.expectRevert(abi.encodeWithSignature("Error(string)", "Insufficient liquidity"));
        pool.borrow(100_001e6);
        vm.stopPrank();
    }

    function test_Repay_full() public {
        vm.startPrank(borrower);
        pool.borrow(10_000e6);
        vm.stopPrank();

        usdc.mint(borrower, 10_000e6);
        vm.startPrank(borrower);
        usdc.approve(address(pool), type(uint256).max);
        (,, uint256 t0) = pool.outstandingDebt(borrower);
        assertGt(t0, 10_000e6 - 1);
        pool.repay(t0);
        vm.stopPrank();

        (,, uint256 t1) = pool.outstandingDebt(borrower);
        assertEq(t1, 0);
    }

    function test_RealRegistry_stillLinksForOtherTests() public {
        CollateralRegistry registry = CollateralRegistry(address(new ERC1967Proxy(
            address(new CollateralRegistry()),
            abi.encodeWithSelector(CollateralRegistry.initialize.selector, address(0), address(0), address(0), address(0))
        )));
        LendingPool impl2 = new LendingPool();
        LendingPool p2 = LendingPool(
            address(new ERC1967Proxy(
                address(impl2), abi.encodeWithSelector(LendingPool.initialize.selector, address(usdc), address(registry))
            ))
        );
        registry.setLendingPool(address(p2));
        assertEq(address(registry.lendingPool()), address(p2));
    }

    function test_LiquidationFeeMath() public pure {
        uint256 debt = 1000e6;
        uint256 feeBps = 500;
        uint256 fee = (debt * feeBps) / 10000;
        assertEq(fee, 50e6);
        assertEq(debt + fee, 1050e6);
    }
}
