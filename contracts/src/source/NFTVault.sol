// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract NFTVault is IERC721Receiver {
    address public adapter;

    struct VaultRecord {
        address collection;
        uint256 tokenId;
        address originalOwner;
        bool released;
    }

    mapping(bytes32 => VaultRecord) public records;
    mapping(bytes32 => bool) public deposited;

    event Deposited(bytes32 indexed collateralId, address collection, uint256 tokenId, address owner);
    event Released(bytes32 indexed collateralId, address recipient);

    constructor(address _adapter) {
        adapter = _adapter;
    }

    function setAdapter(address _adapter) external {
        require(adapter == address(0), "Already set");
        adapter = _adapter;
    }

    modifier onlyAdapter() {
        require(msg.sender == adapter, "Only adapter");
        _;
    }

    function deposit(address collection, uint256 tokenId, address owner, bytes32 collateralId) external onlyAdapter {
        require(!deposited[collateralId], "Already deposited");
        records[collateralId] = VaultRecord({
            collection: collection,
            tokenId: tokenId,
            originalOwner: owner,
            released: false
        });
        deposited[collateralId] = true;
        emit Deposited(collateralId, collection, tokenId, owner);
    }

    function release(bytes32 collateralId, address recipient) external onlyAdapter {
        VaultRecord storage record = records[collateralId];
        require(!record.released, "Already released");
        record.released = true;

        IERC721(record.collection).safeTransferFrom(address(this), recipient, record.tokenId);
        emit Released(collateralId, recipient);
    }

    function onERC721Received(address, address, uint256 tokenId, bytes calldata)
        external
        override
        returns (bytes4)
    {
        return IERC721Receiver.onERC721Received.selector;
    }
}
