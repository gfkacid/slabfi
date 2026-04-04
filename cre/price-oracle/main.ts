import {
  bytesToHex,
  CronCapability,
  consensusMedianAggregation,
  EVMClient,
  HTTPClient,
  type HTTPSendRequester,
  handler,
  ok,
  prepareReportRequest,
  Runner,
  type Runtime,
  text,
  TxStatus,
  getNetwork,
} from '@chainlink/cre-sdk'
import { type Address, encodeAbiParameters, encodeFunctionData } from 'viem'
import { z } from 'zod'
import { ORACLE_ON_REPORT_ABI } from './abi'

const configSchema = z.object({
  schedule: z.string(),
  apiUrl: z.string(),
  /** Sent as `x-api-key` to Slab.Finance backend `/cards/.../price` */
  apiKey: z.string().optional(),
  evms: z.array(
    z.object({
      oracleConsumerAddress: z.string(),
      chainSelectorName: z.string(),
      gasLimit: z.string(),
      collection: z.string(),
      tokenId: z.string(),
    }),
  ),
})

type Config = z.infer<typeof configSchema>

type AppRuntime = Runtime<Config>

function parsePriceFromBody(body: string): bigint {
  const trimmed = body.trim()
  if (trimmed.startsWith('{')) {
    const j = JSON.parse(trimmed) as Record<string, unknown>
    const raw = j.priceUsd ?? j.priceUSD ?? j.price_usd
    if (raw === undefined) {
      throw new Error('EXTERNAL_PRICE_API JSON must include priceUsd (string or number, 8 decimals)')
    }
    if (typeof raw === 'string') return BigInt(raw)
    if (typeof raw === 'number') return BigInt(Math.trunc(raw))
    throw new Error('Invalid priceUsd type')
  }
  const n = Number.parseFloat(trimmed)
  if (!Number.isFinite(n)) throw new Error('Invalid plain-text price body')
  return BigInt(Math.trunc(n))
}

const fetchPriceUsd = (sendRequester: HTTPSendRequester, config: Config) => {
  const key = config.apiKey?.trim()
  const request: {
    url: string
    method: string
    headers?: { key: string; value: string }[]
  } = { url: config.apiUrl, method: 'GET' }
  if (key) {
    request.headers = [{ key: 'x-api-key', value: key }]
  }
  const response = sendRequester.sendRequest(request).result()
  if (!ok(response)) {
    throw new Error(`HTTP request failed with status: ${response.statusCode}`)
  }
  return parsePriceFromBody(text(response))
}

const onCronTrigger = (runtime: AppRuntime) => {
  const priceUsd = new HTTPClient()
    .sendRequest(runtime, fetchPriceUsd, consensusMedianAggregation())(runtime.config)
    .result()

  runtime.log(`Consensus price (8 decimals): ${priceUsd.toString()}`)

  const evmConfig = runtime.config.evms[0]
  const network = getNetwork({
    chainFamily: 'evm',
    chainSelectorName: evmConfig.chainSelectorName,
    isTestnet: true,
  })
  if (!network) {
    throw new Error(`Network not found for chain selector name: ${evmConfig.chainSelectorName}`)
  }

  const collection = evmConfig.collection as Address
  const tokenId = BigInt(evmConfig.tokenId)

  const reportPayload = encodeAbiParameters(
    [
      { type: 'address', name: 'collection' },
      { type: 'uint256', name: 'tokenId' },
      { type: 'uint256', name: 'priceUSD' },
    ],
    [collection, tokenId, priceUsd],
  )

  const writeCallData = encodeFunctionData({
    abi: ORACLE_ON_REPORT_ABI,
    functionName: 'onReport',
    args: ['0x', reportPayload],
  })

  const report = runtime.report(prepareReportRequest(writeCallData)).result()

  const evmClient = new EVMClient(network.chainSelector.selector)
  const resp = evmClient
    .writeReport(runtime, {
      receiver: evmConfig.oracleConsumerAddress as Address,
      report,
    })
    .result()

  if (resp.txStatus !== TxStatus.SUCCESS) {
    throw new Error(`Failed to write report: ${resp.errorMessage || resp.txStatus}`)
  }

  const txHash = resp.txHash ? bytesToHex(resp.txHash) : ''
  runtime.log(`OracleConsumer updated. tx: ${txHash}`)
  return { priceUsd: priceUsd.toString(), txHash }
}

const initWorkflow = (config: Config) => {
  const cron = new CronCapability()
  return [handler(cron.trigger({ schedule: config.schedule }), onCronTrigger)]
}

export async function main() {
  const runner = await Runner.newRunner({
    configSchema,
  })
  await runner.run(initWorkflow)
}
