// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {CCIPMessageRouter} from "../src/hub/CCIPMessageRouter.sol";
import {CollateralRegistry} from "../src/hub/CollateralRegistry.sol";

/// @notice Register source-chain collateral adapters on the hub (Arc).
/// @dev Run after hub + both source chains are deployed. Owner = deployer on CCIPMessageRouter;
///      DEFAULT_ADMIN on CollateralRegistry.
///      Env: DEPLOYER_PRIVATE_KEY, HUB_CCIP_ROUTER_ADDRESS, COLLATERAL_REGISTRY_ADDRESS,
///      SEPOLIA_CHAIN_SELECTOR, SEPOLIA_ADAPTER_ADDRESS,
///      ARBITRUM_SEPOLIA_CHAIN_SELECTOR, ARBITRUM_SEPOLIA_ADAPTER_ADDRESS
contract ConfigureHubAdapters is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address routerAddr = vm.envAddress("HUB_CCIP_ROUTER_ADDRESS");
        address registryAddr = vm.envAddress("COLLATERAL_REGISTRY_ADDRESS");

        uint64 sepoliaSelector = uint64(vm.envUint("SEPOLIA_CHAIN_SELECTOR"));
        address sepoliaAdapter = vm.envAddress("SEPOLIA_ADAPTER_ADDRESS");
        uint64 arbSepoliaSelector = uint64(vm.envUint("ARBITRUM_SEPOLIA_CHAIN_SELECTOR"));
        address arbSepoliaAdapter = vm.envAddress("ARBITRUM_SEPOLIA_ADAPTER_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        CCIPMessageRouter ccipRouter = CCIPMessageRouter(payable(routerAddr));
        CollateralRegistry registry = CollateralRegistry(payable(registryAddr));

        ccipRouter.registerAdapter(sepoliaSelector, sepoliaAdapter);
        ccipRouter.registerAdapter(arbSepoliaSelector, arbSepoliaAdapter);

        registry.setTrustedAdapter(sepoliaSelector, sepoliaAdapter);
        registry.setTrustedAdapter(arbSepoliaSelector, arbSepoliaAdapter);

        vm.stopBroadcast();

        console.log("Registered Sepolia adapter:", sepoliaAdapter);
        console.log("Registered Arbitrum Sepolia adapter:", arbSepoliaAdapter);
    }
}
