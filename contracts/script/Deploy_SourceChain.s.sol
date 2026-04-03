// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {NFTVault} from "../src/source/NFTVault.sol";
import {CollateralAdapter_CardFiCollectible} from "../src/source/CollateralAdapter_CardFiCollectible.sol";
import {CardFiCollectible} from "../src/CardFiCollectible.sol";

/// @notice Deploy CardFiCollectible + NFTVault + CollateralAdapter on a source chain.
/// @dev Env: SOURCE_CCIP_ROUTER, SOURCE_CHAIN_SELECTOR, HUB_CHAIN_SELECTOR, HUB_CCIP_ROUTER_ADDRESS,
///      DEPLOYMENT_OUTPUT_FILE, SOURCE_NETWORK_NAME (label for docs/JSON).
contract DeploySourceChain is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address hubRouter = vm.envAddress("HUB_CCIP_ROUTER_ADDRESS");
        uint64 hubChainSelector = uint64(vm.envUint("HUB_CHAIN_SELECTOR"));
        address ccipRouter = vm.envAddress("SOURCE_CCIP_ROUTER");
        uint64 sourceChainSelector = uint64(vm.envUint("SOURCE_CHAIN_SELECTOR"));
        string memory networkName = vm.envOr("SOURCE_NETWORK_NAME", string("source-chain"));
        string memory outPath = vm.envString("DEPLOYMENT_OUTPUT_FILE");

        vm.startBroadcast(deployerPrivateKey);
        address deployer = vm.addr(deployerPrivateKey);

        CardFiCollectible collection = new CardFiCollectible();
        collection.mint(deployer, 1);
        collection.mint(deployer, 2);
        collection.mint(deployer, 3);

        collection.setCardMetadata(1, CardFiCollectible.CardMetadata({
            cardName: "Charizard",
            cardImage: "https://images.pokemontcg.io/base1/4_hires.png",
            setName: "Base Set",
            cardNumber: "4",
            cardRarity: "Rare Holo",
            cardPrinting: "1st Edition",
            gradeService: "",
            grade: 0
        }));
        collection.setCardMetadata(2, CardFiCollectible.CardMetadata({
            cardName: "Pikachu",
            cardImage: "https://images.pokemontcg.io/base1/58_hires.png",
            setName: "Base Set",
            cardNumber: "58",
            cardRarity: "Common",
            cardPrinting: "Unlimited",
            gradeService: "",
            grade: 0
        }));
        collection.setCardMetadata(3, CardFiCollectible.CardMetadata({
            cardName: "Blastoise",
            cardImage: "https://images.pokemontcg.io/base1/2_hires.png",
            setName: "Base Set",
            cardNumber: "2",
            cardRarity: "Rare Holo",
            cardPrinting: "Shadowless",
            gradeService: "",
            grade: 0
        }));

        NFTVault vault = new NFTVault(address(0));
        CollateralAdapter_CardFiCollectible adapter = new CollateralAdapter_CardFiCollectible(
            address(collection),
            address(vault),
            ccipRouter,
            hubChainSelector,
            hubRouter,
            sourceChainSelector
        );
        vault.setAdapter(address(adapter));

        vm.stopBroadcast();

        console.log("NFTVault:", address(vault));
        console.log("CollateralAdapter_CardFiCollectible:", address(adapter));
        console.log("CardFiCollectible:", address(collection));

        string memory json = vm.serializeString("source", "network", networkName);
        json = vm.serializeAddress(json, "sourceCcipRouter", ccipRouter);
        json = vm.serializeUint(json, "sourceChainSelector", uint256(sourceChainSelector));
        json = vm.serializeUint(json, "hubChainSelector", uint256(hubChainSelector));
        json = vm.serializeAddress(json, "hubCcipMessageRouter", hubRouter);
        json = vm.serializeAddress(json, "cardFiCollectible", address(collection));
        json = vm.serializeAddress(json, "nftVault", address(vault));
        json = vm.serializeAddress(json, "collateralAdapter", address(adapter));
        vm.writeJson(json, outPath);
    }
}
