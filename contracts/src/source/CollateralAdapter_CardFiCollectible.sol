// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {CCIPReceiver} from "@chainlink/contracts-ccip/contracts/applications/CCIPReceiver.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/contracts/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/contracts/libraries/Client.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {ICollateralAdapter} from "../interfaces/ICollateralAdapter.sol";
import "../interfaces/ICardFiTypes.sol";
import "./NFTVault.sol";

contract CollateralAdapter_CardFiCollectible is CCIPReceiver, ICollateralAdapter {
    IERC721 public immutable collectionContract;
    NFTVault public immutable vault;
    IRouterClient public immutable ccipRouter;
    uint64 public immutable hubChainSelector;
    address public immutable hubRouter;
    uint64 public immutable _chainSelector;

    mapping(bytes32 => uint256) public collateralIdToTokenId;

    constructor(
        address _collection,
        address _vault,
        address _ccipRouter,
        uint64 _hubChainSelector,
        address _hubRouter,
        uint64 sourceChainSelector
    ) CCIPReceiver(_ccipRouter) {
        collectionContract = IERC721(_collection);
        vault = NFTVault(payable(_vault));
        ccipRouter = IRouterClient(_ccipRouter);
        hubChainSelector = _hubChainSelector;
        hubRouter = _hubRouter;
        _chainSelector = sourceChainSelector;
    }

    function _ccipLockMessage(uint256 tokenId, address hubOwner) internal view returns (Client.EVM2AnyMessage memory message) {
        bytes memory payload = abi.encode(
            LOCK_NOTICE,
            _chainSelector,
            address(collectionContract),
            tokenId,
            hubOwner
        );
        message = Client.EVM2AnyMessage({
            receiver: abi.encode(hubRouter),
            data: payload,
            tokenAmounts: new Client.EVMTokenAmount[](0),
            feeToken: address(0),
            extraArgs: Client._argsToBytes(Client.EVMExtraArgsV1({gasLimit: 200_000}))
        });
    }

    function quoteCcipFee(uint256 tokenId, address hubOwner) external view override returns (uint256 fee) {
        return ccipRouter.getFee(hubChainSelector, _ccipLockMessage(tokenId, hubOwner));
    }

    function lockAndNotify(uint256 tokenId, address hubOwner) external payable override returns (bytes32 ccipMessageId) {
        bytes32 collateralId = keccak256(abi.encodePacked(_chainSelector, address(collectionContract), tokenId));
        collateralIdToTokenId[collateralId] = tokenId;

        collectionContract.safeTransferFrom(msg.sender, address(vault), tokenId);
        vault.deposit(address(collectionContract), tokenId, hubOwner, collateralId);

        Client.EVM2AnyMessage memory message = _ccipLockMessage(tokenId, hubOwner);
        uint256 fee = ccipRouter.getFee(hubChainSelector, message);

        if (msg.value >= fee) {
            ccipMessageId = ccipRouter.ccipSend{value: fee}(hubChainSelector, message);
            uint256 refund = msg.value - fee;
            if (refund > 0) {
                (bool ok,) = payable(msg.sender).call{value: refund}("");
                require(ok, "Fee refund failed");
            }
        } else {
            require(address(this).balance >= fee, "Insufficient CCIP fee");
            ccipMessageId = ccipRouter.ccipSend{value: fee}(hubChainSelector, message);
        }

        emit Locked(tokenId, msg.sender, ccipMessageId);
    }

    function receiveUnlock(bytes32, address) external pure override {
        revert("Only via CCIP");
    }

    function _ccipReceive(Client.Any2EVMMessage memory message) internal override {
        require(message.sourceChainSelector == hubChainSelector, "Unauthorized chain");
        require(abi.decode(message.sender, (address)) == hubRouter, "Unauthorized sender");

        (bytes4 msgType, bytes32 collateralId, address recipient) =
            abi.decode(message.data, (bytes4, bytes32, address));

        require(msgType == UNLOCK_COMMAND, "Unknown message type");

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
