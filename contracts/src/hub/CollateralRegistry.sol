// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {UUPSUpgradeable} from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import "../interfaces/ICardFiTypes.sol";
import "../interfaces/ICCIPMessageRouter.sol";
import "../interfaces/IHealthFactorEngine.sol";
import "../interfaces/ILendingPool.sol";
import "./OracleConsumer.sol";

contract CollateralRegistry is Initializable, UUPSUpgradeable, AccessControl {
    bytes32 public constant ROUTER_ROLE = keccak256("ROUTER");
    bytes32 public constant LIQUIDATION_MANAGER_ROLE = keccak256("LIQUIDATION_MANAGER");
    bytes32 public constant HF_ENGINE_ROLE = keccak256("HF_ENGINE");

    ICCIPMessageRouter public ccipRouter;
    IHealthFactorEngine public healthFactorEngine;
    ILendingPool public lendingPool;
    OracleConsumer public oracleConsumer;

    mapping(bytes32 => CollateralItem) public collateralItems;
    mapping(address => Position) public positions;
    mapping(bytes32 => bool) public processedMessages;

    mapping(uint64 => address) public trustedAdapters;

    event CollateralRegistered(bytes32 indexed id, address indexed owner, uint64 sourceChainId);
    event CollateralStatusChanged(bytes32 indexed id, CollateralStatus newStatus);
    event UnlockInitiated(bytes32 indexed collateralId, bytes32 ccipMessageId);

    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _ccipRouter,
        address _healthFactorEngine,
        address _lendingPool,
        address _oracleConsumer
    ) public initializer {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

        ccipRouter = ICCIPMessageRouter(_ccipRouter);
        if (_healthFactorEngine != address(0)) healthFactorEngine = IHealthFactorEngine(_healthFactorEngine);
        if (_lendingPool != address(0)) lendingPool = ILendingPool(_lendingPool);
        oracleConsumer = OracleConsumer(payable(_oracleConsumer));
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    function setTrustedAdapter(uint64 sourceChainId, address adapter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        trustedAdapters[sourceChainId] = adapter;
    }

    function setHealthFactorEngine(address _engine) external onlyRole(DEFAULT_ADMIN_ROLE) {
        healthFactorEngine = IHealthFactorEngine(_engine);
    }

    function setLendingPool(address _pool) external onlyRole(DEFAULT_ADMIN_ROLE) {
        lendingPool = ILendingPool(_pool);
    }

    function registerCollateral(
        uint64 sourceChainId,
        address collection,
        uint256 tokenId,
        address owner,
        bytes32 ccipMessageId
    ) external onlyRole(ROUTER_ROLE) returns (bytes32 collateralId) {
        require(trustedAdapters[sourceChainId] != address(0), "Unknown chain");
        require(!processedMessages[ccipMessageId], "Replay");
        processedMessages[ccipMessageId] = true;

        collateralId = keccak256(abi.encodePacked(sourceChainId, collection, tokenId));

        require(collateralItems[collateralId].lockedAt == 0, "Already registered");

        CollateralStatus status = CollateralStatus.PENDING;
        try oracleConsumer.getPrice(collection, tokenId) returns (uint256, uint256) {
            status = CollateralStatus.ACTIVE;
        } catch {}

        collateralItems[collateralId] = CollateralItem({
            id: collateralId,
            sourceChainId: sourceChainId,
            collection: collection,
            tokenId: tokenId,
            owner: owner,
            lockedAt: block.timestamp,
            status: status
        });

        Position storage pos = positions[owner];
        if (pos.borrower == address(0)) {
            pos.borrower = owner;
            pos.principal = 0;
            pos.interestAccrued = 0;
            pos.lastInterestUpdate = block.timestamp;
            pos.status = PositionStatus.HEALTHY;
        }
        pos.collateralIds.push(collateralId);

        emit CollateralRegistered(collateralId, owner, sourceChainId);
        emit CollateralStatusChanged(collateralId, status);
    }

    function activateCollateral(bytes32 collateralId) external onlyRole(HF_ENGINE_ROLE) {
        CollateralItem storage item = collateralItems[collateralId];
        require(item.lockedAt > 0, "Not found");
        require(item.status == CollateralStatus.PENDING, "Not pending");

        try oracleConsumer.getPrice(item.collection, item.tokenId) returns (uint256, uint256) {
            item.status = CollateralStatus.ACTIVE;
            emit CollateralStatusChanged(collateralId, CollateralStatus.ACTIVE);
        } catch {}
    }

    function initiateUnlock(bytes32 collateralId) external returns (bytes32 ccipMessageId) {
        CollateralItem storage item = collateralItems[collateralId];
        require(item.owner == msg.sender, "Not owner");
        require(item.status == CollateralStatus.ACTIVE, "Not active");

        PositionStatus status = healthFactorEngine.getPositionStatus(msg.sender);
        require(status == PositionStatus.HEALTHY || status == PositionStatus.WARNING, "Position not healthy");

        (,, uint256 totalDebt) = lendingPool.outstandingDebt(msg.sender);
        require(totalDebt == 0, "Debt must be zero");

        address adapter = trustedAdapters[item.sourceChainId];
        require(adapter != address(0), "No adapter");

        item.status = CollateralStatus.UNLOCK_SENT;

        ccipMessageId = ccipRouter.sendUnlockCommand(
            item.sourceChainId,
            adapter,
            collateralId,
            msg.sender
        );

        _removeCollateralFromPosition(msg.sender, collateralId);
        emit CollateralStatusChanged(collateralId, CollateralStatus.UNLOCK_SENT);
        emit UnlockInitiated(collateralId, ccipMessageId);
    }

    function seizeLiquidatedCollateral(bytes32 collateralId, address liquidator) external onlyRole(LIQUIDATION_MANAGER_ROLE) {
        CollateralItem storage item = collateralItems[collateralId];
        require(item.lockedAt > 0, "Not found");
        require(item.status == CollateralStatus.ACTIVE, "Not active");

        address borrower = item.owner;
        item.status = CollateralStatus.UNLOCK_SENT;
        item.owner = liquidator;

        address adapter = trustedAdapters[item.sourceChainId];
        require(adapter != address(0), "No adapter");

        ccipRouter.sendUnlockCommand(item.sourceChainId, adapter, collateralId, liquidator);

        _removeCollateralFromPosition(borrower, collateralId);
        emit CollateralStatusChanged(collateralId, CollateralStatus.UNLOCK_SENT);
    }

    function availableCredit(address borrower) external view returns (uint256 usdcAmount) {
        Position storage pos = positions[borrower];
        if (pos.borrower == address(0)) return 0;

        (,, uint256 totalDebtRaw) = lendingPool.outstandingDebt(borrower);

        uint256 weightedSum8 = 0;
        for (uint256 i = 0; i < pos.collateralIds.length; i++) {
            bytes32 cid = pos.collateralIds[i];
            CollateralItem storage item = collateralItems[cid];
            if (item.status != CollateralStatus.ACTIVE) continue;

            try oracleConsumer.getPrice(item.collection, item.tokenId) returns (uint256 price, uint256) {
                uint256 effectiveLTV = oracleConsumer.getEffectiveLTV(item.collection, item.tokenId);
                bool inPenalty = oracleConsumer.isInStalenessPenaltyWindow(item.collection, item.tokenId);
                if (inPenalty) effectiveLTV = effectiveLTV / 2;
                weightedSum8 += (price * effectiveLTV) / 10000;
            } catch {}
        }

        uint256 maxBorrowRaw = Math.mulDiv(weightedSum8, 1e6, 1e8);
        if (totalDebtRaw >= maxBorrowRaw) return 0;
        uint256 fromCollateral = maxBorrowRaw - totalDebtRaw;

        uint256 liq = lendingPool.availableLiquidity();
        return fromCollateral < liq ? fromCollateral : liq;
    }

    function getPosition(address borrower) external view returns (Position memory) {
        return positions[borrower];
    }

    function getCollateralItem(bytes32 collateralId) external view returns (CollateralItem memory) {
        return collateralItems[collateralId];
    }

    function _removeCollateralFromPosition(address borrower, bytes32 collateralId) internal {
        bytes32[] storage ids = positions[borrower].collateralIds;
        for (uint256 i = 0; i < ids.length; i++) {
            if (ids[i] == collateralId) {
                ids[i] = ids[ids.length - 1];
                ids.pop();
                break;
            }
        }
    }
}
