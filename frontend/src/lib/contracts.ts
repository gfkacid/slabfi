import type { HubContractAddresses, SepoliaContractAddresses } from "@slabfinance/shared";
import { hubContractsFromConfig, sepoliaContractsFromConfig } from "@slabfinance/shared";

export const hubContracts: HubContractAddresses = hubContractsFromConfig();

export const CONTRACT_ADDRESSES = {
  sepolia: sepoliaContractsFromConfig() satisfies SepoliaContractAddresses,
};
