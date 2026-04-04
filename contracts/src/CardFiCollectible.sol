// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";

contract CardFiCollectible is ERC721, Ownable {
    struct CardMetadata {
        string cardName;
        string cardImage;
        string setName;
        string cardNumber;
        string cardRarity;
        string cardPrinting;
        string gradeService;
        uint16 grade;
    }

    mapping(uint256 => CardMetadata) public cardMetadata;

    /// @dev Next id assigned by {mintWithMetadata}. Starts at 1. Do not mix with {mint} for the same ids
    ///      or you can cause collisions; prefer {mintWithMetadata} for new tokens.
    uint256 private _nextTokenId = 1;

    constructor() ERC721("Slab.Finance Collectible", "SLAB") Ownable(msg.sender) {}

    /// @notice Next token id that {mintWithMetadata} will mint.
    function nextTokenId() external view returns (uint256) {
        return _nextTokenId;
    }

    /// @notice Mint the next id to `to` and store metadata in one transaction.
    function mintWithMetadata(address to, CardMetadata calldata metadata) external onlyOwner returns (uint256 tokenId) {
        tokenId = _nextTokenId;
        unchecked {
            _nextTokenId = tokenId + 1;
        }
        _mint(to, tokenId);
        cardMetadata[tokenId] = metadata;
    }

    function mint(address to, uint256 tokenId) external onlyOwner {
        _mint(to, tokenId);
    }

    function setCardMetadata(uint256 tokenId, CardMetadata calldata metadata) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        cardMetadata[tokenId] = metadata;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        CardMetadata memory meta = cardMetadata[tokenId];

        string memory json = string.concat(
            '{"name":"',
            _escapeJson(meta.cardName),
            '","description":"Slab.Finance Collectible #',
            _toString(tokenId),
            '","image":"',
            meta.cardImage,
            '","attributes":[',
            _formatAttributes(meta),
            "]}"
        );

        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }

    function _formatAttributes(CardMetadata memory meta) internal pure returns (string memory) {
        string memory base = string.concat(
            _attr("Set", meta.setName),
            ',',
            _attr("Card Number", meta.cardNumber),
            ',',
            _attr("Rarity", meta.cardRarity),
            ',',
            _attr("Printing", meta.cardPrinting)
        );

        if (bytes(meta.gradeService).length > 0) {
            base = string.concat(
                base,
                ',',
                _attr("Grade Service", meta.gradeService),
                ',',
                _attr("Grade", _gradeToString(meta.grade))
            );
        }

        return base;
    }

    function _attr(string memory traitType, string memory value) internal pure returns (string memory) {
        return string.concat('{"trait_type":"', traitType, '","value":"', _escapeJson(value), '"}');
    }

    function _gradeToString(uint16 grade) internal pure returns (string memory) {
        uint256 whole = uint256(grade) / 10;
        uint256 frac = uint256(grade) % 10;
        if (frac == 0) {
            return _toString(whole);
        }
        return string.concat(_toString(whole), ".", _toString(frac));
    }

    function _escapeJson(string memory s) internal pure returns (string memory) {
        bytes memory str = bytes(s);
        bytes memory result = new bytes(str.length * 2);
        uint256 resultLen = 0;
        for (uint256 i = 0; i < str.length; i++) {
            if (str[i] == '"') {
                result[resultLen++] = "\\";
                result[resultLen++] = '"';
            } else if (str[i] == "\\") {
                result[resultLen++] = "\\";
                result[resultLen++] = "\\";
            } else {
                result[resultLen++] = str[i];
            }
        }
        bytes memory trimmed = new bytes(resultLen);
        for (uint256 i = 0; i < resultLen; i++) {
            trimmed[i] = result[i];
        }
        return string(trimmed);
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
