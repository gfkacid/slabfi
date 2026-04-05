// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {UUPSUpgradeable} from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "../interfaces/ICardFiTypes.sol";
import {IReceiver} from "../interfaces/IReceiver.sol";

/// @title OracleConsumer
/// @notice Ingests and stores price data from Chainlink CRE workflows
contract OracleConsumer is Initializable, UUPSUpgradeable, AccessControl, IReceiver {
    uint256 public constant PRICE_FRESHNESS_WINDOW = 26 hours; // 24h + 2h grace
    uint256 public constant STALENESS_PENALTY_WINDOW = 2 hours; // 24h-26h: 50% LTV
    uint256 public constant MIN_LTV_BPS = 500; // 5% floor
    uint256 public constant PRICE_DECIMALS = 8;
    uint256 public constant BPS = 10000;
    uint256 public constant HISTORY_SIZE = 30;

    /// @notice Chainlink KeystoneForwarder — only this address may call onReport
    address public forwarderAddress;

    // collection => tokenId => PriceRecord
    mapping(address => mapping(uint256 => PriceRecord)) public prices;

    // collection => tokenId => rolling daily history (circular buffer)
    mapping(address => mapping(uint256 => uint256[HISTORY_SIZE])) public priceHistory;
    mapping(address => mapping(uint256 => uint8)) public historyIndex;
    mapping(address => mapping(uint256 => uint8)) public historyLength;

    // Base LTV by tier (BPS) - index 0 unused; tiers 1-3
    uint256[4] public baseLTV;
    // Liquidation thresholds by tier
    uint256[4] public liquidationThreshold;
    // collection => tokenId => tier (1–3)
    mapping(address => mapping(uint256 => uint8)) public tokenTier;

    uint256 public lastPriceUpdateTime;

    event PriceUpdated(address indexed collection, uint256 indexed tokenId, uint256 newPrice, uint256 attestedAt);
    event ForwarderAddressUpdated(address indexed previousForwarder, address indexed newForwarder);

    error InvalidForwarder();
    error InvalidReport();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _forwarderAddress) public initializer {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

        forwarderAddress = _forwarderAddress;

        baseLTV = [0, 4000, 2500, 1500];       // 40%, 25%, 15%
        liquidationThreshold = [0, 8000, 8500, 9000]; // 80%, 85%, 90%
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    /// @inheritdoc IReceiver
    function onReport(bytes calldata, bytes calldata report) external override {
        if (msg.sender != forwarderAddress) revert InvalidForwarder();
        (address collection, uint256 tokenId, uint256 priceUSD) = abi.decode(report, (address, uint256, uint256));
        if (collection == address(0)) revert InvalidReport();
        _updatePrice(collection, tokenId, priceUSD, block.timestamp);
    }

    /// @inheritdoc IERC165
    function supportsInterface(bytes4 interfaceId) public view override(AccessControl, IERC165) returns (bool) {
        return interfaceId == type(IReceiver).interfaceId || super.supportsInterface(interfaceId);
    }

    /// @notice Update the KeystoneForwarder address allowed to deliver CRE reports
    function setForwarderAddress(address newForwarder) external onlyRole(DEFAULT_ADMIN_ROLE) {
        address previous = forwarderAddress;
        forwarderAddress = newForwarder;
        emit ForwarderAddressUpdated(previous, newForwarder);
    }

    /// @notice Hackathon / dev: set price directly without CRE (admin only)
    function setMockPrice(
        address collection,
        uint256 tokenId,
        uint256 priceUSD,
        uint8 tier
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (tier > 0) {
            tokenTier[collection][tokenId] = tier;
        }
        uint256 attestedAt = block.timestamp;
        _updatePrice(collection, tokenId, priceUSD, attestedAt);
    }

    /// @notice Returns latest price; reverts if stale
    /// @return priceUSD Price in 8 decimals
    /// @return age Seconds since attestation
    function getPrice(address collection, uint256 tokenId) external view returns (uint256 priceUSD, uint256 age) {
        PriceRecord storage record = prices[collection][tokenId];
        require(record.updatedAt > 0, "No price");
        require(block.timestamp <= record.attestedAt + PRICE_FRESHNESS_WINDOW, "Price stale");

        age = block.timestamp - record.attestedAt;
        priceUSD = record.priceUSD;
    }

    /// @notice Returns whether price is in staleness penalty window (24-26h)
    function isInStalenessPenaltyWindow(address collection, uint256 tokenId) external view returns (bool) {
        PriceRecord storage record = prices[collection][tokenId];
        if (record.updatedAt == 0) return false;
        uint256 age = block.timestamp - record.attestedAt;
        return age > 24 hours && age <= PRICE_FRESHNESS_WINDOW;
    }

    /// @notice Returns effective LTV for a collateral item (with volatility haircut)
    /// @param collection NFT collection address
    /// @param tokenId Token ID
    /// @return effectiveLTVBps Effective LTV in basis points
    function getEffectiveLTV(address collection, uint256 tokenId) external view returns (uint256 effectiveLTVBps) {
        uint8 tier = tokenTier[collection][tokenId];
        if (tier == 0) tier = 1;
        uint256 base = baseLTV[tier];

        uint256 sigmaBps = getPriceVolatility(collection, tokenId);
        // Cap so (BPS - sigmaBps) never underflows when mock / sparse history yields sigma > 100%
        if (sigmaBps > BPS) {
            sigmaBps = BPS;
        }
        // effectiveLTV = max(baseLTV * (1 - sigma_30d), MIN_LTV_BPS)
        uint256 adjusted = base * (BPS - sigmaBps) / BPS;
        return adjusted > MIN_LTV_BPS ? adjusted : MIN_LTV_BPS;
    }

    /// @notice Returns 30-day rolling std deviation in basis points for volatility haircut
    function getPriceVolatility(address collection, uint256 tokenId) public view returns (uint256 sigmaBps) {
        uint8 len = historyLength[collection][tokenId];
        if (len < 2) return 0;

        uint256[HISTORY_SIZE] storage history = priceHistory[collection][tokenId];
        uint256 sum = 0;
        for (uint8 i = 0; i < len; i++) {
            sum += history[i];
        }
        uint256 mean = sum / len;

        uint256 variance = 0;
        for (uint8 i = 0; i < len; i++) {
            uint256 diff = history[i] > mean ? history[i] - mean : mean - history[i];
            variance += diff * diff;
        }
        variance /= len;

        // sqrt using Babylonian method (scaled by 1e8 for precision)
        uint256 sqrtV = _sqrt(variance * 1e16);
        uint256 stdDev = sqrtV / 1e8;
        if (mean == 0) return 0;
        return stdDev * BPS / mean;
    }

    function _sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }

    /// @notice Set risk tier for a specific NFT (per-token within a collection)
    function setTokenTier(address collection, uint256 tokenId, uint8 tier) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(tier >= 1 && tier <= 3, "Invalid tier");
        tokenTier[collection][tokenId] = tier;
    }

    function _updatePrice(
        address collection,
        uint256 tokenId,
        uint256 priceUSD,
        uint256 attestedAt
    ) internal {
        prices[collection][tokenId] = PriceRecord({
            priceUSD: priceUSD,
            attestedAt: attestedAt,
            updatedAt: block.timestamp,
            tier: tokenTier[collection][tokenId] > 0 ? tokenTier[collection][tokenId] : uint8(1)
        });

        // Append to price history
        uint8 idx = historyIndex[collection][tokenId];
        uint8 len = historyLength[collection][tokenId];
        priceHistory[collection][tokenId][idx] = priceUSD;
        historyIndex[collection][tokenId] = uint8((idx + 1) % HISTORY_SIZE);
        if (len < HISTORY_SIZE) {
            historyLength[collection][tokenId] = len + 1;
        }

        lastPriceUpdateTime = block.timestamp;
        emit PriceUpdated(collection, tokenId, priceUSD, attestedAt);
    }
}
