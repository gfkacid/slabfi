// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {UUPSUpgradeable} from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import "../interfaces/ICardFiTypes.sol";
import "./CollateralRegistry.sol";
import "./LendingPool.sol";
import "./OracleConsumer.sol";

/// @title AuctionLiquidationManager — per-card USDC auctions with anti-sniping and tiered settlement
contract AuctionLiquidationManager is Initializable, UUPSUpgradeable, AccessControl {
    bytes32 public constant HF_ENGINE_ROLE = keccak256("HF_ENGINE");

    CollateralRegistry public collateralRegistry;
    LendingPool public lendingPool;
    OracleConsumer public oracleConsumer;
    IERC20 public usdc;

    address public treasury;

    uint256 public auctionDuration;
    uint256 public minBidIncrementBPS;
    uint256 public liquidationFeeBPS;
    uint256 public antiSnipingWindow;
    /// @notice Portion of excess (after debt + fee) sent to the vault; remainder to treasury (BPS, 10000 = 100%)
    uint256 public surplusShareBPS;

    /// @dev Minimum debt to open liquidation (50 USDC in token native decimals).
    uint256 public constant MIN_LIQUIDATION_USDC_UNITS = 50;

    struct Auction {
        address borrower;
        bytes32 collateralId;
        uint256 startedAt;
        uint256 deadline;
        uint256 reservePrice;
        uint256 debtShareSnapshot;
        uint256 feeSnapshot;
        uint256 highestBid;
        address highestBidder;
        bool settled;
        bool cancelled;
    }

    struct BidInfo {
        uint256 amount;
        uint256 deposited;
    }

    mapping(bytes32 => Auction) public auctions;
    mapping(bytes32 => mapping(address => BidInfo)) public bids;
    mapping(bytes32 => address[]) internal _auctionBidders;
    mapping(address => bytes32[]) internal _borrowerAuctionIds;

    bytes32[] internal _activeAuctionIds;

    event AuctionQueued(
        bytes32 indexed auctionId,
        address indexed borrower,
        bytes32 indexed collateralId,
        uint256 reservePrice,
        uint256 debtShareSnapshot,
        uint256 deadline
    );
    event BidPlaced(bytes32 indexed auctionId, address indexed bidder, uint256 amount, uint256 newDeadline);
    event AuctionSettled(
        bytes32 indexed auctionId,
        address indexed winner,
        uint256 winningBid,
        uint256 debtToPool,
        uint256 feeToTreasury,
        uint256 excessToPool,
        uint256 excessToTreasury
    );
    event AuctionCancelled(bytes32 indexed auctionId);
    event BidRefunded(bytes32 indexed auctionId, address indexed bidder, uint256 amount);

    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _collateralRegistry,
        address _lendingPool,
        address _oracleConsumer,
        address _usdc,
        address _treasury
    ) public initializer {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

        collateralRegistry = CollateralRegistry(payable(_collateralRegistry));
        lendingPool = LendingPool(payable(_lendingPool));
        oracleConsumer = OracleConsumer(payable(_oracleConsumer));
        usdc = IERC20(_usdc);
        require(_treasury != address(0), "zero treasury");
        treasury = _treasury;

        auctionDuration = 24 hours;
        minBidIncrementBPS = 100;
        liquidationFeeBPS = 500;
        antiSnipingWindow = 5 minutes;
        surplusShareBPS = 5000;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    // --- Admin ---

    function setTreasury(address t) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(t != address(0), "zero treasury");
        treasury = t;
    }

    function setAuctionDuration(uint256 d) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(d >= 1 hours && d <= 30 days, "duration");
        auctionDuration = d;
    }

    function setMinBidIncrementBPS(uint256 bps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(bps >= 1 && bps <= 2000, "increment bps");
        minBidIncrementBPS = bps;
    }

    function setLiquidationFeeBPS(uint256 bps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(bps <= 2500, "fee bps");
        liquidationFeeBPS = bps;
    }

    function setAntiSnipingWindow(uint256 w) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(w >= 30 seconds && w <= 1 hours, "snipe window");
        antiSnipingWindow = w;
    }

    function setSurplusShareBPS(uint256 bps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(bps <= 10000, "surplus bps");
        surplusShareBPS = bps;
    }

    // --- Core ---

        /// @notice See `ILiquidationManager.queueLiquidation` — opens or refreshes an auction for this collateral.
    function queueLiquidation(address borrower, bytes32 collateralId) external onlyRole(HF_ENGINE_ROLE) {
        bytes32 auctionId = keccak256(abi.encodePacked(borrower, collateralId));
        Auction storage a = auctions[auctionId];
        if (a.startedAt != 0 && !a.settled && !a.cancelled) {
            return;
        }

        (,, uint256 totalDebt) = lendingPool.outstandingDebt(borrower);
        uint256 minDebt = MIN_LIQUIDATION_USDC_UNITS * (10 ** uint256(IERC20Metadata(address(usdc)).decimals()));
        require(totalDebt >= minDebt, "Below minimum");

        CollateralItem memory item = collateralRegistry.getCollateralItem(collateralId);
        require(item.lockedAt > 0, "Unknown collateral");
        require(item.owner == borrower, "Owner mismatch");
        require(item.status == CollateralStatus.ACTIVE, "Not active");

        (uint256 totalWeighted, uint256 cardWeighted) = _borrowerWeights(borrower, collateralId);
        require(totalWeighted > 0 && cardWeighted > 0, "No weight");

        uint256 debtShare = Math.mulDiv(totalDebt, cardWeighted, totalWeighted);
        require(debtShare > 0, "Zero share");

        uint256 fee = Math.mulDiv(debtShare, liquidationFeeBPS, 10000);
        uint256 reserve = debtShare + fee;

        uint256 deadline = block.timestamp + auctionDuration;

        auctions[auctionId] = Auction({
            borrower: borrower,
            collateralId: collateralId,
            startedAt: block.timestamp,
            deadline: deadline,
            reservePrice: reserve,
            debtShareSnapshot: debtShare,
            feeSnapshot: fee,
            highestBid: 0,
            highestBidder: address(0),
            settled: false,
            cancelled: false
        });

        _pushUnique(_activeAuctionIds, auctionId);
        _pushUnique(_borrowerAuctionIds[borrower], auctionId);

        emit AuctionQueued(auctionId, borrower, collateralId, reserve, debtShare, deadline);
    }

    function cancelAllAuctionsForBorrower(address borrower) external onlyRole(HF_ENGINE_ROLE) {
        bytes32[] memory ids = _borrowerAuctionIds[borrower];
        delete _borrowerAuctionIds[borrower];
        for (uint256 i = 0; i < ids.length; i++) {
            _cancelAuctionWithoutBorrowerList(ids[i]);
        }
    }

    function placeBid(bytes32 auctionId, uint256 amount) external {
        Auction storage a = auctions[auctionId];
        require(a.startedAt > 0, "No auction");
        require(!a.settled && !a.cancelled, "Ended");

        if (a.highestBid > 0) {
            require(block.timestamp < a.deadline, "Auction ended");
            uint256 minNext = Math.mulDiv(a.highestBid, 10000 + minBidIncrementBPS, 10000);
            if (minNext <= a.highestBid) {
                minNext = a.highestBid + 1;
            }
            require(amount >= minNext, "Bid too low");
        } else {
            require(amount >= a.reservePrice, "Below reserve");
            if (block.timestamp > a.deadline) {
                a.deadline = block.timestamp + antiSnipingWindow;
            }
        }

        BidInfo storage info = bids[auctionId][msg.sender];
        uint256 prevDeposited = info.deposited;
        require(amount >= prevDeposited, "Below prior deposit");
        uint256 toPay = amount - prevDeposited;
        if (toPay > 0) {
            require(usdc.transferFrom(msg.sender, address(this), toPay), "Transfer failed");
        }

        if (prevDeposited == 0 && amount > 0) {
            _auctionBidders[auctionId].push(msg.sender);
        }

        info.amount = amount;
        info.deposited = amount;

        a.highestBid = amount;
        a.highestBidder = msg.sender;

        if (a.deadline > block.timestamp && a.deadline - block.timestamp <= antiSnipingWindow) {
            a.deadline = block.timestamp + antiSnipingWindow;
        }

        emit BidPlaced(auctionId, msg.sender, amount, a.deadline);
    }

    function claim(bytes32 auctionId) external {
        Auction storage a = auctions[auctionId];
        require(a.startedAt > 0, "No auction");
        require(!a.settled && !a.cancelled, "Ended");
        require(a.highestBid > 0, "No bids");
        require(block.timestamp >= a.deadline, "Not ended");

        a.settled = true;
        _removeFromActiveList(auctionId);
        _removeBorrowerAuction(a.borrower, auctionId);

        uint256 W = a.highestBid;
        uint256 D = a.debtShareSnapshot;
        uint256 F = a.feeSnapshot;
        require(W >= D + F, "Bid below debt+fee");

        uint256 E = W - D - F;
        uint256 toVaultFromExcess = Math.mulDiv(E, surplusShareBPS, 10000);
        uint256 toTreasuryFromExcess = E - toVaultFromExcess;

        require(usdc.transfer(address(lendingPool), D), "Pool debt xfer");
        lendingPool.partialClearDebt(a.borrower, D);

        require(usdc.transfer(treasury, F), "Treasury fee xfer");

        if (toVaultFromExcess > 0) {
            require(usdc.transfer(address(lendingPool), toVaultFromExcess), "Pool excess xfer");
        }
        if (toTreasuryFromExcess > 0) {
            require(usdc.transfer(treasury, toTreasuryFromExcess), "Treasury excess xfer");
        }

        address winner = a.highestBidder;
        _refundLosers(auctionId, winner);
        _clearBidState(auctionId);

        collateralRegistry.seizeLiquidatedCollateral(a.collateralId, winner);

        emit AuctionSettled(auctionId, winner, W, D, F, toVaultFromExcess, toTreasuryFromExcess);
    }

    // --- Views ---

    function auctionBidders(bytes32 auctionId) external view returns (address[] memory) {
        return _auctionBidders[auctionId];
    }

    function borrowerAuctionIds(address borrower) external view returns (bytes32[] memory) {
        return _borrowerAuctionIds[borrower];
    }

    function activeAuctionIds() external view returns (bytes32[] memory) {
        uint256 count = 0;
        uint256 len = _activeAuctionIds.length;
        for (uint256 i = 0; i < len; i++) {
            bytes32 id = _activeAuctionIds[i];
            Auction storage a = auctions[id];
            if (!a.settled && !a.cancelled) count++;
        }
        bytes32[] memory out = new bytes32[](count);
        uint256 j = 0;
        for (uint256 i = 0; i < len; i++) {
            bytes32 id = _activeAuctionIds[i];
            Auction storage a = auctions[id];
            if (!a.settled && !a.cancelled) {
                out[j++] = id;
            }
        }
        return out;
    }

    function isAuctionOpen(bytes32 auctionId) external view returns (bool) {
        Auction storage a = auctions[auctionId];
        if (a.startedAt == 0 || a.settled || a.cancelled) return false;
        if (a.highestBid == 0) return true;
        return block.timestamp < a.deadline;
    }

    // --- Internal ---

    function _cancelAuction(bytes32 auctionId) internal {
        Auction storage a = auctions[auctionId];
        if (a.startedAt == 0 || a.settled || a.cancelled) {
            return;
        }

        a.cancelled = true;
        _removeFromActiveList(auctionId);
        _removeBorrowerAuction(a.borrower, auctionId);

        _refundAll(auctionId);
        _clearBidState(auctionId);

        emit AuctionCancelled(auctionId);
    }

    /// @dev Borrower↔auction index already cleared (batch cancel).
    function _cancelAuctionWithoutBorrowerList(bytes32 auctionId) internal {
        Auction storage a = auctions[auctionId];
        if (a.startedAt == 0 || a.settled || a.cancelled) {
            return;
        }

        a.cancelled = true;
        _removeFromActiveList(auctionId);

        _refundAll(auctionId);
        _clearBidState(auctionId);

        emit AuctionCancelled(auctionId);
    }

    function _refundLosers(bytes32 auctionId, address winner) internal {
        address[] storage arr = _auctionBidders[auctionId];
        for (uint256 i = 0; i < arr.length; i++) {
            address u = arr[i];
            if (u == winner) continue;
            uint256 d = bids[auctionId][u].deposited;
            if (d > 0) {
                bids[auctionId][u].deposited = 0;
                bids[auctionId][u].amount = 0;
                require(usdc.transfer(u, d), "Refund loser");
                emit BidRefunded(auctionId, u, d);
            }
        }
    }

    function _refundAll(bytes32 auctionId) internal {
        address[] storage arr = _auctionBidders[auctionId];
        for (uint256 i = 0; i < arr.length; i++) {
            address u = arr[i];
            uint256 d = bids[auctionId][u].deposited;
            if (d > 0) {
                bids[auctionId][u].deposited = 0;
                bids[auctionId][u].amount = 0;
                require(usdc.transfer(u, d), "Refund all");
                emit BidRefunded(auctionId, u, d);
            }
        }
    }

    function _clearBidState(bytes32 auctionId) internal {
        address[] storage arr = _auctionBidders[auctionId];
        for (uint256 i = 0; i < arr.length; i++) {
            delete bids[auctionId][arr[i]];
        }
        delete _auctionBidders[auctionId];
    }

    function _borrowerWeights(address borrower, bytes32 targetCollateralId)
        internal
        view
        returns (uint256 totalWeighted, uint256 targetWeighted)
    {
        Position memory pos = collateralRegistry.getPosition(borrower);
        for (uint256 i = 0; i < pos.collateralIds.length; i++) {
            bytes32 cid = pos.collateralIds[i];
            CollateralItem memory item = collateralRegistry.getCollateralItem(cid);
            uint256 w = _itemWeightedValue(item);
            if (w == 0) continue;
            totalWeighted += w;
            if (cid == targetCollateralId) {
                targetWeighted = w;
            }
        }
    }

    function _itemWeightedValue(CollateralItem memory item) internal view returns (uint256) {
        if (item.status != CollateralStatus.ACTIVE) return 0;
        try oracleConsumer.getPrice(item.collection, item.tokenId) returns (uint256 price, uint256) {
            uint256 effectiveLTV = oracleConsumer.getEffectiveLTV(item.collection, item.tokenId);
            if (oracleConsumer.isInStalenessPenaltyWindow(item.collection, item.tokenId)) {
                effectiveLTV = effectiveLTV / 2;
            }
            uint256 contrib = Math.mulDiv(price, effectiveLTV, 10000);
            return contrib * 1e10;
        } catch {
            return 0;
        }
    }

    function _pushUnique(bytes32[] storage arr, bytes32 id) internal {
        for (uint256 i = 0; i < arr.length; i++) {
            if (arr[i] == id) return;
        }
        arr.push(id);
    }

    function _removeFromActiveList(bytes32 auctionId) internal {
        bytes32[] storage arr = _activeAuctionIds;
        for (uint256 i = 0; i < arr.length; i++) {
            if (arr[i] == auctionId) {
                arr[i] = arr[arr.length - 1];
                arr.pop();
                break;
            }
        }
    }

    function _removeBorrowerAuction(address borrower, bytes32 auctionId) internal {
        bytes32[] storage arr = _borrowerAuctionIds[borrower];
        for (uint256 i = 0; i < arr.length; i++) {
            if (arr[i] == auctionId) {
                arr[i] = arr[arr.length - 1];
                arr.pop();
                break;
            }
        }
    }
}
