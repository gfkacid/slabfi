// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {OApp, Origin, MessagingFee, MessagingReceipt} from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import {OAppSender} from "@layerzerolabs/oapp-evm/contracts/oapp/OAppSender.sol";
import {ICollateralAdapter} from "../interfaces/ICollateralAdapter.sol";
import "../interfaces/ICardFiTypes.sol";
import "./NFTVault.sol";

/// @notice Source-chain collateral adapter using LayerZero V2 (replaces Chainlink CCIP).
/// @dev Hub peer on Solana is a 32-byte OApp identity; set via `setPeer(dstEid, peer)`.
contract CollateralAdapterLayerZero is OApp, ICollateralAdapter {
    IERC721 public immutable collectionContract;
    NFTVault public immutable vault;
    uint32 public immutable dstEid;
    uint64 public immutable _chainSelector;

    mapping(bytes32 => uint256) public collateralIdToTokenId;

    /// @dev LayerZero type-3 options header only (matches `OptionsBuilder.newOptions()`).
    bytes private constant LZ_OPTIONS_TYPE3 = hex"0003";

    constructor(
        address _endpoint,
        address _delegate,
        address _collection,
        address _vault,
        uint32 _dstEid,
        uint64 sourceChainSelector
    ) OApp(_endpoint, _delegate) {
        collectionContract = IERC721(_collection);
        vault = NFTVault(payable(_vault));
        dstEid = _dstEid;
        _chainSelector = sourceChainSelector;
    }

    function _payNative(uint256 _nativeFee) internal override returns (uint256) {
        if (msg.value < _nativeFee) revert OAppSender.NotEnoughNative(msg.value);
        return _nativeFee;
    }

    function _lockMessage(uint256 tokenId, address hubOwner) internal view returns (bytes memory) {
        return abi.encode(LOCK_NOTICE, _chainSelector, address(collectionContract), tokenId, hubOwner);
    }

    function quoteLzFee(uint256 tokenId, address hubOwner) public view returns (uint256 nativeFee) {
        bytes memory message = _lockMessage(tokenId, hubOwner);
        MessagingFee memory fee = _quote(dstEid, message, LZ_OPTIONS_TYPE3, false);
        return fee.nativeFee;
    }

    function quoteCcipFee(uint256 tokenId, address hubOwner) external view override returns (uint256 fee) {
        return quoteLzFee(tokenId, hubOwner);
    }

    function lockAndNotify(uint256 tokenId, address hubOwner) external payable override returns (bytes32 messageId) {
        bytes32 collateralId = keccak256(abi.encodePacked(_chainSelector, address(collectionContract), tokenId));
        collateralIdToTokenId[collateralId] = tokenId;

        collectionContract.safeTransferFrom(msg.sender, address(vault), tokenId);
        vault.deposit(address(collectionContract), tokenId, hubOwner, collateralId);

        bytes memory message = _lockMessage(tokenId, hubOwner);
        MessagingFee memory fee = _quote(dstEid, message, LZ_OPTIONS_TYPE3, false);
        MessagingReceipt memory receipt = _lzSend(dstEid, message, LZ_OPTIONS_TYPE3, fee, payable(msg.sender));
        messageId = receipt.guid;
        emit Locked(tokenId, msg.sender, messageId);
    }

    function receiveUnlock(bytes32, address) external pure override {
        revert("Only via LayerZero");
    }

    function _lzReceive(
        Origin calldata origin,
        bytes32,
        bytes calldata message,
        address,
        bytes calldata
    ) internal override {
        require(origin.srcEid == dstEid, "Unexpected src");
        (bytes4 msgType, bytes32 collateralId, address recipient) = abi.decode(message, (bytes4, bytes32, address));
        require(msgType == UNLOCK_COMMAND, "Unknown message");
        vault.release(collateralId, recipient);
        uint256 tokenId = collateralIdToTokenId[collateralId];
        emit Unlocked(tokenId, recipient);
    }

    function collection() external view override returns (address) {
        return address(collectionContract);
    }

    function chainSelector() external view override returns (uint64) {
        return _chainSelector;
    }

    receive() external payable {}
}
