// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {NFTVault} from "../src/source/NFTVault.sol";
import {CollateralAdapter_CardFiCollectible} from "../src/source/CollateralAdapter_CardFiCollectible.sol";
import {CardFiCollectible} from "../src/CardFiCollectible.sol";

contract DeploySepolia is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address hubRouter = vm.envAddress("HUB_CCIP_ROUTER_ADDRESS");
        uint64 hubChainSelector = uint64(
            vm.envOr("HUB_CHAIN_SELECTOR", vm.envOr("ARC_CHAIN_SELECTOR", uint256(3034092155422581607)))
        );
        address ccipRouter = vm.envAddress("CCIP_ROUTER_SEPOLIA");
        uint64 sepoliaChainSelector = uint64(vm.envOr("SEPOLIA_CHAIN_SELECTOR", uint256(16015286601757825753)));

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
            sepoliaChainSelector
        );
        vault.setAdapter(address(adapter));

        vm.stopBroadcast();

        console.log("NFTVault:", address(vault));
        console.log("CollateralAdapter_CardFiCollectible:", address(adapter));
        console.log("CardFiCollectible:", address(collection));
    }
}
