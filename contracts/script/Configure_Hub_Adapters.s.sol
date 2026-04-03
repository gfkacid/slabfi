// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {CCIPMessageRouter} from "../src/hub/CCIPMessageRouter.sol";
import {CollateralRegistry} from "../src/hub/CollateralRegistry.sol";

/// @notice Register Ethereum Sepolia collateral adapter on the hub (Arc).
/// @dev Run after hub + source chain are deployed. Owner = deployer on CCIPMessageRouter;
///      DEFAULT_ADMIN on CollateralRegistry.
///      Env: DEPLOYER_PRIVATE_KEY, HUB_CCIP_ROUTER_ADDRESS, COLLATERAL_REGISTRY_ADDRESS,
///      SEPOLIA_CHAIN_SELECTOR, SEPOLIA_ADAPTER_ADDRESS
contract ConfigureHubAdapters is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address routerAddr = vm.envAddress("HUB_CCIP_ROUTER_ADDRESS");
        address registryAddr = vm.envAddress("COLLATERAL_REGISTRY_ADDRESS");

        uint64 sepoliaSelector = uint64(vm.envUint("SEPOLIA_CHAIN_SELECTOR"));
        address sepoliaAdapter = vm.envAddress("SEPOLIA_ADAPTER_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        CCIPMessageRouter ccipRouter = CCIPMessageRouter(payable(routerAddr));
        CollateralRegistry registry = CollateralRegistry(payable(registryAddr));

        ccipRouter.registerAdapter(sepoliaSelector, sepoliaAdapter);

        registry.setTrustedAdapter(sepoliaSelector, sepoliaAdapter);

        vm.stopBroadcast();

        console.log("Registered Sepolia adapter:", sepoliaAdapter);
    }
}
