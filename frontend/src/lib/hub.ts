import type { Chain } from "viem";
import { arcTestnet } from "./chains";
import { hubContracts } from "./contracts";

export const hubChain: Chain = arcTestnet;
export { hubContracts };
