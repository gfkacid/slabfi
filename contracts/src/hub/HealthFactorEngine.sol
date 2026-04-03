// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {UUPSUpgradeable} from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "../interfaces/ICardFiTypes.sol";
import "./CollateralRegistry.sol";
import "./OracleConsumer.sol";
import "./LendingPool.sol";
import "../interfaces/ILiquidationManager.sol";

contract HealthFactorEngine is Initializable, UUPSUpgradeable, AccessControl {
    bytes32 public constant KEEPER_ROLE = keccak256("KEEPER");

    CollateralRegistry public collateralRegistry;
    OracleConsumer public oracleConsumer;
    LendingPool public lendingPool;
    ILiquidationManager public liquidationManager;

    uint256 public constant HEALTHY_THRESHOLD = 1.30e18;
    uint256 public constant LIQUIDATABLE_THRESHOLD = 1.00e18;

    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _collateralRegistry,
        address _oracleConsumer,
        address _lendingPool,
        address _liquidationManager
    ) public initializer {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

        collateralRegistry = CollateralRegistry(payable(_collateralRegistry));
        oracleConsumer = OracleConsumer(payable(_oracleConsumer));
        lendingPool = LendingPool(payable(_lendingPool));
        liquidationManager = ILiquidationManager(_liquidationManager);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    function recomputePosition(address borrower) public returns (uint256 healthFactor, PositionStatus newStatus) {
        (uint256 weightedCollateral, uint256 totalDebt) = _computePosition(borrower);

        Position memory pos = collateralRegistry.getPosition(borrower);
        for (uint256 i = 0; i < pos.collateralIds.length; i++) {
            bytes32 cid = pos.collateralIds[i];
            CollateralItem memory item = collateralRegistry.getCollateralItem(cid);
            if (item.status == CollateralStatus.PENDING) {
                collateralRegistry.activateCollateral(cid);
            }
        }

        (weightedCollateral, totalDebt) = _computePosition(borrower);

        if (totalDebt == 0) {
            healthFactor = type(uint256).max;
            newStatus = PositionStatus.HEALTHY;
        } else {
            healthFactor = (weightedCollateral * 1e18) / totalDebt;
            newStatus = _healthFactorToStatus(healthFactor);
        }

        if (newStatus == PositionStatus.LIQUIDATABLE) {
            Position memory posLive = collateralRegistry.getPosition(borrower);
            for (uint256 i = 0; i < posLive.collateralIds.length; i++) {
                bytes32 cid = posLive.collateralIds[i];
                CollateralItem memory item = collateralRegistry.getCollateralItem(cid);
                if (item.status == CollateralStatus.ACTIVE) {
                    liquidationManager.queueLiquidation(borrower, cid);
                }
            }
        } else {
            liquidationManager.cancelAllAuctionsForBorrower(borrower);
        }

        return (healthFactor, newStatus);
    }

    function sweepPositions(address[] calldata borrowers) external returns (address[] memory changed) {
        address[] memory result = new address[](borrowers.length);
        uint256 count = 0;

        for (uint256 i = 0; i < borrowers.length; i++) {
            (uint256 hf, PositionStatus status) = recomputePosition(borrowers[i]);
            if (status != PositionStatus.HEALTHY) {
                result[count] = borrowers[i];
                count++;
            }
        }

        assembly {
            mstore(result, count)
        }
        return result;
    }

    function previewHealthFactor(
        uint256[] calldata collateralValuesUSD,
        uint8[] calldata tiers,
        uint256 totalDebtUSD
    ) external pure returns (uint256 healthFactor) {
        require(collateralValuesUSD.length == tiers.length, "Length mismatch");

        uint256 weightedCollateral = 0;
        uint256[4] memory baseLTV = [uint256(0), 4000, 2500, 1500];

        for (uint256 i = 0; i < collateralValuesUSD.length; i++) {
            uint256 base = tiers[i] > 0 && tiers[i] <= 3 ? baseLTV[tiers[i]] : 4000;
            weightedCollateral += (collateralValuesUSD[i] * base) / 10000;
        }

        if (totalDebtUSD == 0) return type(uint256).max;
        return (weightedCollateral * 1e18) / totalDebtUSD;
    }

    function getPositionStatus(address borrower) external view returns (PositionStatus) {
        (uint256 weightedCollateral, uint256 totalDebt) = _computePosition(borrower);
        if (totalDebt == 0) return PositionStatus.HEALTHY;
        uint256 hf = (weightedCollateral * 1e18) / totalDebt;
        return _healthFactorToStatus(hf);
    }

    function _computePosition(address borrower) internal view returns (uint256 weightedCollateral, uint256 totalDebt) {
        Position memory pos = collateralRegistry.getPosition(borrower);
        (,, totalDebt) = lendingPool.outstandingDebt(borrower);

        for (uint256 i = 0; i < pos.collateralIds.length; i++) {
            CollateralItem memory item = collateralRegistry.getCollateralItem(pos.collateralIds[i]);
            if (item.status != CollateralStatus.ACTIVE) continue;

            try oracleConsumer.getPrice(item.collection, item.tokenId) returns (uint256 price, uint256) {
                uint256 effectiveLTV = oracleConsumer.getEffectiveLTV(item.collection, item.tokenId);
                bool inPenalty = oracleConsumer.isInStalenessPenaltyWindow(item.collection, item.tokenId);
                if (inPenalty) effectiveLTV = effectiveLTV / 2;
                weightedCollateral += (price * effectiveLTV) / 10000;
            } catch {}
        }
        weightedCollateral = weightedCollateral * 1e10;
    }

    function _healthFactorToStatus(uint256 hf) internal pure returns (PositionStatus) {
        if (hf >= HEALTHY_THRESHOLD) return PositionStatus.HEALTHY;
        if (hf >= LIQUIDATABLE_THRESHOLD) return PositionStatus.WARNING;
        return PositionStatus.LIQUIDATABLE;
    }
}
