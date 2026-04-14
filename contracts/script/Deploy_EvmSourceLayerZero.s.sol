// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {NFTVault} from "../src/source/NFTVault.sol";
import {CollateralAdapterLayerZero} from "../src/source/CollateralAdapterLayerZero.sol";

/// @notice Deploy `NFTVault` + `CollateralAdapterLayerZero` on an EVM chain (Polygon, Base, …).
/// @dev Required env:
///   - DEPLOYER_PRIVATE_KEY
///   - LZ_ENDPOINT — LayerZero EndpointV2 on this chain (see LayerZero docs)
///   - LZ_DST_EID — destination EID (30168 for Solana mainnet hub)
///   - COLLECTION — ERC-721 Courtyard / Beezie / etc.
///   - SOURCE_CHAIN_ID — uint64 EIP-155 chain id embedded in lock payloads (e.g. 137, 8453)
///   - DEPLOYMENT_OUTPUT_FILE — path under contracts/deployments/ (e.g. deployments/evm/polygon.json)
///   - NETWORK_KEY — short key for JSON: polygon | base | …
contract DeployEvmSourceLayerZero is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address lzEndpoint = vm.envAddress("LZ_ENDPOINT");
        uint32 dstEid = uint32(vm.envUint("LZ_DST_EID"));
        address collection = vm.envAddress("COLLECTION");
        uint64 sourceChainId = uint64(vm.envUint("SOURCE_CHAIN_ID"));
        string memory outPath = vm.envString("DEPLOYMENT_OUTPUT_FILE");
        string memory networkKey = vm.envString("NETWORK_KEY");

        vm.startBroadcast(deployerPrivateKey);
        address deployer = vm.addr(deployerPrivateKey);

        NFTVault vault = new NFTVault(address(0));
        CollateralAdapterLayerZero adapter = new CollateralAdapterLayerZero(
            lzEndpoint, deployer, collection, address(vault), dstEid, sourceChainId
        );
        vault.setAdapter(address(adapter));
        vm.stopBroadcast();

        console.log("NFTVault:", address(vault));
        console.log("CollateralAdapterLayerZero:", address(adapter));
        console.log("Collection:", collection);

        string memory json = "evm";
        json = vm.serializeString(json, "networkKey", networkKey);
        json = vm.serializeUint(json, "chainId", uint256(sourceChainId));
        json = vm.serializeUint(json, "lzDstEid", uint256(dstEid));
        json = vm.serializeAddress(json, "lzEndpoint", lzEndpoint);
        json = vm.serializeAddress(json, "collection", collection);
        json = vm.serializeAddress(json, "nftVault", address(vault));
        json = vm.serializeAddress(json, "collateralAdapterLayerZero", address(adapter));
        vm.writeJson(json, outPath);
    }
}
