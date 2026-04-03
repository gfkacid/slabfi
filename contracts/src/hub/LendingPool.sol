// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {UUPSUpgradeable} from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import "./CollateralRegistry.sol";

/// @title LendingPool — USDC vault (supply shares) + variable-rate borrows + utilization kink
contract LendingPool is Initializable, UUPSUpgradeable, AccessControl {
    bytes32 public constant LIQUIDATOR_ROLE = keccak256("LIQUIDATOR");

    /// @dev 1e18 scale for borrow index and utilization
    uint256 public constant WAD = 1e18;
    uint256 public constant SECONDS_PER_YEAR = 365 days;

    IERC20 public usdc;
    CollateralRegistry public collateralRegistry;

    /// @notice Global borrow index; user debt = borrowBalanceScaled * borrowIndex / WAD
    uint256 public borrowIndex;
    /// @notice Aggregate borrower debt (principal + accrued), after accrue
    uint256 public totalBorrows;
    /// @notice Protocol reserve from borrow interest (reduces LP assets in totalAssets)
    uint256 public totalReserves;
    uint256 public lastAccrualTimestamp;

    mapping(address => uint256) public borrowBalanceScaled;
    /// @notice Remaining principal for UI / repay ordering (interest = debt - principal)
    mapping(address => uint256) public principal;

    uint256 public totalSupplyShares;
    mapping(address => uint256) public balanceOfShares;

    /// @notice Annual borrow rate params (BPS). Utilization is WAD (1e18 = 100%).
    uint256 public baseRateBPS;
    uint256 public optimalUtilizationBPS;
    uint256 public slope1BPS;
    uint256 public slope2BPS;
    /// @notice Fraction of accrued borrow interest added to totalReserves
    uint256 public protocolFeeBPS;

    event Deposited(address indexed depositor, uint256 assets, uint256 sharesMinted);
    event Withdrawn(address indexed depositor, uint256 assets, uint256 sharesBurned);
    event Borrowed(address indexed borrower, uint256 amount);
    event Repaid(address indexed borrower, uint256 amount, bool fullyRepaid);

    constructor() {
        _disableInitializers();
    }

    function initialize(address _usdc, address _collateralRegistry) public initializer {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

        usdc = IERC20(_usdc);
        collateralRegistry = CollateralRegistry(payable(_collateralRegistry));

        borrowIndex = WAD;
        lastAccrualTimestamp = block.timestamp;

        baseRateBPS = 200;
        optimalUtilizationBPS = 8000;
        slope1BPS = 1000;
        slope2BPS = 15_000;
        protocolFeeBPS = 1000;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    // --- Admin ---

    function setInterestRateParams(
        uint256 _baseRateBPS,
        uint256 _optimalUtilizationBPS,
        uint256 _slope1BPS,
        uint256 _slope2BPS,
        uint256 _protocolFeeBPS
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _accrue();
        require(_optimalUtilizationBPS <= 10000, "optimal>100%");
        require(_protocolFeeBPS <= 10000, "fee>100%");
        baseRateBPS = _baseRateBPS;
        optimalUtilizationBPS = _optimalUtilizationBPS;
        slope1BPS = _slope1BPS;
        slope2BPS = _slope2BPS;
        protocolFeeBPS = _protocolFeeBPS;
    }

    // --- Accrue (mutating) ---

    function _accrue() internal {
        uint256 t = block.timestamp;
        if (t <= lastAccrualTimestamp) return;

        uint256 tb = totalBorrows;
        if (tb == 0) {
            lastAccrualTimestamp = t;
            return;
        }

        uint256 interest = _interestAccumulated(tb, t - lastAccrualTimestamp);
        if (interest == 0) {
            lastAccrualTimestamp = t;
            return;
        }

        uint256 reserveIncrease = Math.mulDiv(interest, protocolFeeBPS, 10000);
        borrowIndex = Math.mulDiv(borrowIndex, tb + interest, tb);
        totalBorrows = tb + interest;
        totalReserves += reserveIncrease;
        lastAccrualTimestamp = t;
    }

    function _interestAccumulated(uint256 tb, uint256 dt) internal view returns (uint256) {
        if (dt == 0 || tb == 0) return 0;
        uint256 cash = usdc.balanceOf(address(this));
        uint256 lpAssets = _lpAssets(cash, tb, totalReserves);
        uint256 u = lpAssets == 0 ? 0 : Math.mulDiv(tb, WAD, lpAssets);
        uint256 bps = _borrowRateBps(u);
        return Math.mulDiv(tb, bps * dt, SECONDS_PER_YEAR * 10000);
    }

    function _lpAssets(uint256 cash, uint256 borrows, uint256 reserves) internal pure returns (uint256) {
        return cash + borrows - reserves;
    }

    /// @dev Piecewise kink (PRD): below optimal U, slope1; above, slope2.
    function _borrowRateBps(uint256 uWad) internal view returns (uint256) {
        uint256 uOpt = Math.mulDiv(uint256(optimalUtilizationBPS), WAD, 10000);
        if (uWad <= uOpt) {
            return baseRateBPS + Math.mulDiv(uWad, slope1BPS, WAD);
        }
        uint256 below = baseRateBPS + Math.mulDiv(uOpt, slope1BPS, WAD);
        return below + Math.mulDiv(uWad - uOpt, slope2BPS, WAD);
    }

    /// @notice Virtual accrue for views (no storage writes)
    function _previewAccrued()
        internal
        view
        returns (uint256 idx, uint256 tb, uint256 tr, uint256 cash)
    {
        idx = borrowIndex;
        tb = totalBorrows;
        tr = totalReserves;
        cash = usdc.balanceOf(address(this));
        uint256 t = block.timestamp;
        if (t <= lastAccrualTimestamp || tb == 0) {
            return (idx, tb, tr, cash);
        }
        uint256 dt = t - lastAccrualTimestamp;
        uint256 interest = _interestAccumulated(tb, dt);
        if (interest == 0) return (idx, tb, tr, cash);
        uint256 reserveIncrease = Math.mulDiv(interest, protocolFeeBPS, 10000);
        idx = Math.mulDiv(idx, tb + interest, tb);
        tb = tb + interest;
        tr = tr + reserveIncrease;
    }

    function _debtOf(address user) internal view returns (uint256) {
        (uint256 idx,,,) = _previewAccrued();
        return Math.mulDiv(borrowBalanceScaled[user], idx, WAD);
    }

    // --- Supply ---

    function totalAssets() public view returns (uint256) {
        (, uint256 tb, uint256 tr, uint256 cash) = _previewAccrued();
        return _lpAssets(cash, tb, tr);
    }

    /// @notice Idle USDC in the pool (not covering borrows numerically — raw balance)
    function availableLiquidity() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }

    function exchangeRate() external view returns (uint256) {
        uint256 supply = totalSupplyShares;
        if (supply == 0) return WAD;
        return Math.mulDiv(totalAssets(), WAD, supply);
    }

    function previewDeposit(uint256 assets) external view returns (uint256 shares) {
        uint256 supply = totalSupplyShares;
        uint256 ta = totalAssets();
        if (supply == 0) return assets;
        return Math.mulDiv(assets, supply, ta);
    }

    function previewWithdraw(uint256 shares) external view returns (uint256 assets) {
        uint256 supply = totalSupplyShares;
        if (supply == 0) return 0;
        return Math.mulDiv(shares, totalAssets(), supply);
    }

    function deposit(uint256 amount) external {
        require(amount > 0, "Zero deposit");
        _accrue();
        uint256 ta = totalAssets();
        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        uint256 shares;
        if (totalSupplyShares == 0) {
            shares = amount;
        } else {
            shares = Math.mulDiv(amount, totalSupplyShares, ta);
        }
        require(shares > 0, "Zero shares");
        totalSupplyShares += shares;
        balanceOfShares[msg.sender] += shares;

        emit Deposited(msg.sender, amount, shares);
    }

    function withdraw(uint256 shares) external {
        require(shares > 0, "Zero shares");
        _accrue();
        require(balanceOfShares[msg.sender] >= shares, "Shares");

        uint256 assetsOut = Math.mulDiv(shares, totalAssets(), totalSupplyShares);
        require(assetsOut <= usdc.balanceOf(address(this)), "InsufficientLiquidity");

        totalSupplyShares -= shares;
        balanceOfShares[msg.sender] -= shares;

        require(usdc.transfer(msg.sender, assetsOut), "Transfer failed");
        emit Withdrawn(msg.sender, assetsOut, shares);
    }

    // --- Borrow / repay ---

    function borrow(uint256 amount) external {
        require(amount > 0, "Zero borrow");
        _accrue();

        uint256 available = collateralRegistry.availableCredit(msg.sender);
        require(amount <= available, "Exceeds available credit");
        require(amount <= usdc.balanceOf(address(this)), "Insufficient liquidity");

        borrowBalanceScaled[msg.sender] += Math.mulDiv(amount, WAD, borrowIndex);
        totalBorrows += amount;
        principal[msg.sender] += amount;
        lastAccrualTimestamp = block.timestamp;

        require(usdc.transfer(msg.sender, amount), "Transfer failed");
        emit Borrowed(msg.sender, amount);
    }

    function repay(uint256 amount) external {
        require(amount > 0, "Zero repay");
        _accrue();

        uint256 debt = Math.mulDiv(borrowBalanceScaled[msg.sender], borrowIndex, WAD);
        require(amount <= debt, "Exceeds debt");
        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        uint256 p = principal[msg.sender];
        uint256 interestPart = debt > p ? debt - p : 0;

        if (amount <= interestPart) {
            // interest-only repayment; principal unchanged
        } else {
            uint256 fromPrincipal = amount - interestPart;
            require(fromPrincipal <= p, "Principal underflow");
            principal[msg.sender] = p - fromPrincipal;
        }

        uint256 newDebt = debt - amount;
        if (newDebt == 0) {
            borrowBalanceScaled[msg.sender] = 0;
            principal[msg.sender] = 0;
        } else {
            borrowBalanceScaled[msg.sender] = Math.mulDiv(newDebt, WAD, borrowIndex);
        }
        totalBorrows -= amount;
        lastAccrualTimestamp = block.timestamp;

        bool fullyRepaid = (newDebt == 0);
        emit Repaid(msg.sender, amount, fullyRepaid);
    }

    function clearDebt(address borrower) external onlyRole(LIQUIDATOR_ROLE) {
        _accrue();
        uint256 debt = Math.mulDiv(borrowBalanceScaled[borrower], borrowIndex, WAD);
        require(debt > 0, "No debt");

        borrowBalanceScaled[borrower] = 0;
        principal[borrower] = 0;
        totalBorrows -= debt;
        lastAccrualTimestamp = block.timestamp;
    }

    /// @notice Reduces borrower debt after USDC has been sent to this contract (e.g. auction settlement).
    /// @dev Mirrors repay() interest-then-principal ordering without pulling tokens.
    function partialClearDebt(address borrower, uint256 amount) external onlyRole(LIQUIDATOR_ROLE) {
        require(amount > 0, "Zero amount");
        _accrue();

        uint256 debt = Math.mulDiv(borrowBalanceScaled[borrower], borrowIndex, WAD);
        require(amount <= debt, "Exceeds debt");

        uint256 p = principal[borrower];
        uint256 interestPart = debt > p ? debt - p : 0;

        if (amount <= interestPart) {
            // interest-only
        } else {
            uint256 fromPrincipal = amount - interestPart;
            require(fromPrincipal <= p, "Principal underflow");
            principal[borrower] = p - fromPrincipal;
        }

        uint256 newDebt = debt - amount;
        if (newDebt == 0) {
            borrowBalanceScaled[borrower] = 0;
            principal[borrower] = 0;
        } else {
            borrowBalanceScaled[borrower] = Math.mulDiv(newDebt, WAD, borrowIndex);
        }
        totalBorrows -= amount;
        lastAccrualTimestamp = block.timestamp;
    }

    function outstandingDebt(address borrower)
        public
        view
        returns (uint256 p, uint256 i, uint256 total)
    {
        (uint256 idx,,,) = _previewAccrued();
        total = Math.mulDiv(borrowBalanceScaled[borrower], idx, WAD);
        p = principal[borrower];
        if (total > p) {
            i = total - p;
        } else {
            i = 0;
            p = total;
        }
    }

    function utilization() external view returns (uint256 uWad) {
        (, uint256 tb, uint256 tr, uint256 cash) = _previewAccrued();
        uint256 lpA = _lpAssets(cash, tb, tr);
        if (lpA == 0 || tb == 0) return 0;
        return Math.mulDiv(tb, WAD, lpA);
    }

    function currentBorrowAPR() external view returns (uint256 annualBPS) {
        (, uint256 tb, uint256 tr, uint256 cash) = _previewAccrued();
        uint256 lpA = _lpAssets(cash, tb, tr);
        uint256 u = lpA == 0 ? 0 : Math.mulDiv(tb, WAD, lpA);
        return _borrowRateBps(u);
    }

    function currentSupplyAPR() external view returns (uint256 annualBPS) {
        (, uint256 tb, uint256 tr, uint256 cash) = _previewAccrued();
        uint256 lpA = _lpAssets(cash, tb, tr);
        uint256 u = lpA == 0 ? 0 : Math.mulDiv(tb, WAD, lpA);
        uint256 borrowBps = _borrowRateBps(u);
        return Math.mulDiv(Math.mulDiv(borrowBps, u, WAD), 10000 - protocolFeeBPS, 10000);
    }
}
