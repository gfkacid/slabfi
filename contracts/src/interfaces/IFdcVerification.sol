// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IFdcVerification
/// @notice Interface for Flare FDC attestation verification
/// @dev For hackathon: use MockFdcVerification. Production: use Flare's IFdcVerification
interface IFdcVerification {
    /// @notice Verify a Flare FDC attestation proof
    /// @param attestationProof Raw FDC proof bytes
    /// @return valid True if the attestation is valid
    function verifyAttestation(bytes calldata attestationProof) external view returns (bool valid);
}
