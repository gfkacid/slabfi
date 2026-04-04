// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {stdJson} from "forge-std/StdJson.sol";
import {NFTVault} from "../src/source/NFTVault.sol";
import {CollateralAdapter_CardFiCollectible} from "../src/source/CollateralAdapter_CardFiCollectible.sol";
import {CardFiCollectible} from "../src/CardFiCollectible.sol";

/// @notice Deploy CardFiCollectible + NFTVault + CollateralAdapter on a source chain.
/// @dev Env: SOURCE_CCIP_ROUTER, SOURCE_CHAIN_SELECTOR, HUB_CHAIN_SELECTOR, HUB_CCIP_ROUTER_ADDRESS,
///      DEPLOYMENT_OUTPUT_FILE, SOURCE_NETWORK_NAME (label for docs/JSON).
///      Seeds demo NFTs from `scripts/data/cardFi-collectibles-metadata.stub.json` (via Node normalize + ffi).
contract DeploySourceChain is Script {
    using stdJson for string;

    /// @dev Field order matches JSON keys sorted alphabetically (Foundry parseRaw ABI encoding).
    struct CardTokenJson {
        string cardImage;
        string cardName;
        string cardNumber;
        string cardRarity;
        string cardPrinting;
        uint256 grade;
        string gradeService;
        string setName;
    }

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address hubRouter = vm.envAddress("HUB_CCIP_ROUTER_ADDRESS");
        uint64 hubChainSelector = uint64(vm.envUint("HUB_CHAIN_SELECTOR"));
        address ccipRouter = vm.envAddress("SOURCE_CCIP_ROUTER");
        uint64 sourceChainSelector = uint64(vm.envUint("SOURCE_CHAIN_SELECTOR"));
        string memory networkName = vm.envOr("SOURCE_NETWORK_NAME", string("source-chain"));
        string memory outPath = vm.envString("DEPLOYMENT_OUTPUT_FILE");

        string memory root = vm.projectRoot();
        string memory metadataPath = string.concat(root, "/../scripts/data/cardFi-collectibles-metadata.stub.json");
        string memory normalizer = string.concat(root, "/../scripts/normalize-card-metadata-json.cjs");

        string[] memory cmd = new string[](3);
        cmd[0] = "node";
        cmd[1] = normalizer;
        cmd[2] = metadataPath;

        string memory json = string(vm.ffi(cmd));
        bytes memory rawTokens = json.parseRaw(".tokens");
        CardTokenJson[] memory tokens = abi.decode(rawTokens, (CardTokenJson[]));
        require(tokens.length > 0, "card metadata: empty tokens array");

        vm.startBroadcast(deployerPrivateKey);
        address deployer = vm.addr(deployerPrivateKey);

        CardFiCollectible collection = new CardFiCollectible();
        for (uint256 i = 0; i < tokens.length; i++) {
            CardTokenJson memory t = tokens[i];
            require(t.grade <= type(uint16).max, "grade exceeds uint16");
            collection.mintWithMetadata(
                deployer,
                CardFiCollectible.CardMetadata({
                    cardName: t.cardName,
                    cardImage: t.cardImage,
                    setName: t.setName,
                    cardNumber: t.cardNumber,
                    cardRarity: t.cardRarity,
                    cardPrinting: t.cardPrinting,
                    gradeService: t.gradeService,
                    grade: uint16(t.grade)
                })
            );
        }

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

        string memory out = vm.serializeString("source", "network", networkName);
        out = vm.serializeAddress(out, "sourceCcipRouter", ccipRouter);
        out = vm.serializeUint(out, "sourceChainSelector", uint256(sourceChainSelector));
        out = vm.serializeUint(out, "hubChainSelector", uint256(hubChainSelector));
        out = vm.serializeAddress(out, "hubCcipMessageRouter", hubRouter);
        out = vm.serializeAddress(out, "cardFiCollectible", address(collection));
        out = vm.serializeAddress(out, "nftVault", address(vault));
        out = vm.serializeAddress(out, "collateralAdapter", address(adapter));
        vm.writeJson(out, outPath);
    }
}
