// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {OracleConsumer} from "../src/hub/OracleConsumer.sol";
import {CollateralRegistry} from "../src/hub/CollateralRegistry.sol";
import {HealthFactorEngine} from "../src/hub/HealthFactorEngine.sol";
import {LendingPool} from "../src/hub/LendingPool.sol";
import {AuctionLiquidationManager} from "../src/hub/AuctionLiquidationManager.sol";
import {CCIPMessageRouter} from "../src/hub/CCIPMessageRouter.sol";
import {ChainlinkAutomationKeeper} from "../src/hub/ChainlinkAutomationKeeper.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract DeployHub is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address ccipRouter = vm.envAddress("CCIP_ROUTER_ARC");

        vm.startBroadcast(deployerPrivateKey);
        address deployer = vm.addr(deployerPrivateKey);

        // Placeholder forwarder for hackathon; production: set CRE KeystoneForwarder via setForwarderAddress
        address creForwarder = vm.envOr("CRE_FORWARDER_ADDRESS", address(1));
        address usdcAddr = vm.envAddress("HUB_USDC_ADDRESS");
        uint8 usdcDecimals = IERC20Metadata(usdcAddr).decimals();

        OracleConsumer oracleImpl = new OracleConsumer();
        ERC1967Proxy oracleProxy = new ERC1967Proxy(
            address(oracleImpl),
            abi.encodeWithSelector(OracleConsumer.initialize.selector, creForwarder)
        );
        OracleConsumer oracle = OracleConsumer(address(oracleProxy));

        CCIPMessageRouter ccipRouterContract = new CCIPMessageRouter(ccipRouter);

        CollateralRegistry registryImpl = new CollateralRegistry();
        LendingPool poolImpl = new LendingPool();
        AuctionLiquidationManager liqImpl = new AuctionLiquidationManager();
        HealthFactorEngine hfImpl = new HealthFactorEngine();

        ERC1967Proxy registryProxy = new ERC1967Proxy(
            address(registryImpl),
            abi.encodeWithSelector(
                CollateralRegistry.initialize.selector,
                address(ccipRouterContract),
                address(0),
                address(0),
                address(oracle)
            )
        );
        CollateralRegistry registry = CollateralRegistry(address(registryProxy));

        ERC1967Proxy poolProxy = new ERC1967Proxy(
            address(poolImpl),
            abi.encodeWithSelector(LendingPool.initialize.selector, usdcAddr, address(registry))
        );
        LendingPool pool = LendingPool(address(poolProxy));

        ERC1967Proxy liqProxy = new ERC1967Proxy(
            address(liqImpl),
            abi.encodeWithSelector(
                AuctionLiquidationManager.initialize.selector,
                address(registry),
                address(pool),
                address(oracle),
                usdcAddr,
                deployer
            )
        );
        AuctionLiquidationManager liquidationManager = AuctionLiquidationManager(address(liqProxy));

        ERC1967Proxy hfProxy = new ERC1967Proxy(
            address(hfImpl),
            abi.encodeWithSelector(
                HealthFactorEngine.initialize.selector,
                address(registry),
                address(oracle),
                address(pool),
                address(liquidationManager)
            )
        );
        HealthFactorEngine hfEngine = HealthFactorEngine(address(hfProxy));

        registry.setHealthFactorEngine(address(hfEngine));
        registry.setLendingPool(address(pool));

        ccipRouterContract.setCollateralRegistry(address(registry));

        registry.grantRole(registry.ROUTER_ROLE(), address(ccipRouterContract));
        registry.grantRole(registry.HF_ENGINE_ROLE(), address(hfEngine));
        registry.grantRole(registry.LIQUIDATION_MANAGER_ROLE(), address(liquidationManager));

        pool.grantRole(pool.LIQUIDATOR_ROLE(), address(liquidationManager));

        liquidationManager.grantRole(liquidationManager.HF_ENGINE_ROLE(), address(hfEngine));

        uint256 seedDefault = 1_000 * (10 ** uint256(usdcDecimals));
        uint256 seedAmount = vm.envOr("HUB_SEED_DEPOSIT_RAW", seedDefault);
        if (seedAmount > 0) {
            uint256 bal = IERC20(usdcAddr).balanceOf(deployer);
            if (bal < seedAmount) {
                console.log("Skipping seed deposit: deployer USDC below required amount");
                console.logUint(bal);
                console.logUint(seedAmount);
            } else {
                IERC20(usdcAddr).approve(address(pool), seedAmount);
                pool.deposit(seedAmount);
            }
        }

        ChainlinkAutomationKeeper keeper = new ChainlinkAutomationKeeper(
            address(hfEngine),
            address(oracle),
            address(registry)
        );

        vm.stopBroadcast();

        console.log("OracleConsumer:", address(oracle));
        console.log("CollateralRegistry:", address(registry));
        console.log("LendingPool:", address(pool));
        console.log("AuctionLiquidationManager:", address(liquidationManager));
        console.log("HealthFactorEngine:", address(hfEngine));
        console.log("CCIPMessageRouter:", address(ccipRouterContract));
        console.log("ChainlinkAutomationKeeper:", address(keeper));
        console.log("USDC:", usdcAddr);

        string memory outPath = vm.envOr("HUB_DEPLOYMENT_OUTPUT", string("deployments/hub.json"));
        string memory json = vm.serializeString("hub", "network", "arc-testnet");
        json = vm.serializeAddress(json, "ccipRouterOnChain", ccipRouter);
        json = vm.serializeAddress(json, "creForwarderAddress", creForwarder);
        json = vm.serializeAddress(json, "usdc", usdcAddr);
        json = vm.serializeAddress(json, "oracleConsumer", address(oracle));
        json = vm.serializeAddress(json, "oracleConsumerImplementation", address(oracleImpl));
        json = vm.serializeAddress(json, "ccipMessageRouter", address(ccipRouterContract));
        json = vm.serializeAddress(json, "collateralRegistry", address(registry));
        json = vm.serializeAddress(json, "collateralRegistryImplementation", address(registryImpl));
        json = vm.serializeAddress(json, "lendingPool", address(pool));
        json = vm.serializeAddress(json, "lendingPoolImplementation", address(poolImpl));
        json = vm.serializeAddress(json, "auctionLiquidationManager", address(liquidationManager));
        json = vm.serializeAddress(json, "auctionLiquidationManagerImplementation", address(liqImpl));
        json = vm.serializeAddress(json, "healthFactorEngine", address(hfEngine));
        json = vm.serializeAddress(json, "healthFactorEngineImplementation", address(hfImpl));
        json = vm.serializeAddress(json, "chainlinkAutomationKeeper", address(keeper));
        vm.writeJson(json, outPath);
    }
}
