// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {CCIPReceiver} from "@chainlink/contracts-ccip/contracts/applications/CCIPReceiver.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/contracts/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/contracts/libraries/Client.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/ICardFiTypes.sol";
import "./CollateralRegistry.sol";

contract CCIPMessageRouter is CCIPReceiver, Ownable {
    address public collateralRegistry;
    IRouterClient public immutable ccipRouterClient;
    mapping(uint64 => address) public trustedAdapters;

    constructor(address _ccipRouter) CCIPReceiver(_ccipRouter) Ownable(msg.sender) {
        ccipRouterClient = IRouterClient(_ccipRouter);
    }

    function setCollateralRegistry(address _registry) external onlyOwner {
        collateralRegistry = _registry;
    }

    function registerAdapter(uint64 chainSelector, address adapterAddress) external onlyOwner {
        trustedAdapters[chainSelector] = adapterAddress;
    }

    function deregisterAdapter(uint64 chainSelector) external onlyOwner {
        delete trustedAdapters[chainSelector];
    }

    function _ccipReceive(Client.Any2EVMMessage memory message) internal override {
        uint64 sourceChainSelector = message.sourceChainSelector;
        require(trustedAdapters[sourceChainSelector] != address(0), "Unknown chain");

        address sender = abi.decode(message.sender, (address));
        require(sender == trustedAdapters[sourceChainSelector], "Unauthorized sender");

        require(collateralRegistry != address(0), "Registry not set");

        (bytes4 msgType, uint64 chainId, address collection, uint256 tokenId, address owner) =
            abi.decode(message.data, (bytes4, uint64, address, uint256, address));

        if (msgType == LOCK_NOTICE) {
            require(chainId == sourceChainSelector, "Chain mismatch");

            bytes32 ccipMessageId = message.messageId;
            CollateralRegistry(payable(collateralRegistry)).registerCollateral(chainId, collection, tokenId, owner, ccipMessageId);
        }
    }

    function sendUnlockCommand(
        uint64 destinationChainSelector,
        address adapter,
        bytes32 collateralId,
        address recipient
    ) external returns (bytes32 messageId) {
        require(msg.sender == collateralRegistry, "Only registry");

        bytes memory data = abi.encode(UNLOCK_COMMAND, collateralId, recipient);

        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(adapter),
            data: data,
            tokenAmounts: new Client.EVMTokenAmount[](0),
            feeToken: address(0),
            extraArgs: Client._argsToBytes(Client.EVMExtraArgsV1({gasLimit: 200_000}))
        });

        uint256 fee = ccipRouterClient.getFee(destinationChainSelector, message);
        messageId = ccipRouterClient.ccipSend{value: fee}(destinationChainSelector, message);
    }

    receive() external payable {}
}
