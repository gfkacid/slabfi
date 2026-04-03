/** Minimal ABI for IReceiver.onReport — OracleConsumer implements this */
export const ORACLE_ON_REPORT_ABI = [
  {
    type: 'function',
    name: 'onReport',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'metadata', type: 'bytes' },
      { name: 'report', type: 'bytes' },
    ],
    outputs: [],
  },
] as const
