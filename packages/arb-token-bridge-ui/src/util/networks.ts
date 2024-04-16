import { L1Network, L2Network, addCustomNetwork } from '@arbitrum/sdk'
import {
  Chain,
  ParentChain,
  l2Networks,
  chains,
  parentChains,
  addCustomChain
} from '@arbitrum/sdk/dist/lib/dataEntities/networks'

import { loadEnvironmentVariableWithFallback } from './index'
import { Erc20Data } from './TokenUtils'

export const customChainLocalStorageKey = 'arbitrum:custom:chains'

export const INFURA_KEY = process.env.NEXT_PUBLIC_INFURA_KEY

if (typeof INFURA_KEY === 'undefined') {
  throw new Error('Infura API key not provided')
}

const MAINNET_INFURA_RPC_URL = `https://mainnet.infura.io/v3/${INFURA_KEY}`
const GOERLI_INFURA_RPC_URL = `https://goerli.infura.io/v3/${INFURA_KEY}`
const SEPOLIA_INFURA_RPC_URL = `https://sepolia.infura.io/v3/${INFURA_KEY}`

export type ChainWithRpcUrl = Chain & {
  rpcUrl: string
  nativeTokenData?: Erc20Data
}

export function getCustomChainsFromLocalStorage(): ChainWithRpcUrl[] {
  const customChainsFromLocalStorage = localStorage.getItem(
    customChainLocalStorageKey
  )

  if (!customChainsFromLocalStorage) {
    return []
  }

  return (JSON.parse(customChainsFromLocalStorage) as ChainWithRpcUrl[])
    .filter(
      // filter again in case local storage is compromized
      chain => !supportedCustomOrbitParentChains.includes(Number(chain.chainID))
    )
    .map(chain => {
      return {
        ...chain,
        // make sure chainID is numeric
        chainID: Number(chain.chainID)
      }
    })
}

export function getCustomChainFromLocalStorageById(chainId: ChainId) {
  const customChains = getCustomChainsFromLocalStorage()

  if (!customChains) {
    return undefined
  }

  return customChains.find(chain => chain.chainID === chainId)
}

export function saveCustomChainToLocalStorage(newCustomChain: ChainWithRpcUrl) {
  const customChains = getCustomChainsFromLocalStorage()

  if (
    customChains.findIndex(chain => chain.chainID === newCustomChain.chainID) >
    -1
  ) {
    // chain already exists
    return
  }

  const newCustomChains = [...getCustomChainsFromLocalStorage(), newCustomChain]
  localStorage.setItem(
    customChainLocalStorageKey,
    JSON.stringify(newCustomChains)
  )
}

export function removeCustomChainFromLocalStorage(chainId: number) {
  const newCustomChains = getCustomChainsFromLocalStorage().filter(
    chain => chain.chainID !== chainId
  )
  localStorage.setItem(
    customChainLocalStorageKey,
    JSON.stringify(newCustomChains)
  )
}

function getCustomChainIds(l2ChainID: number): ChainId[] {
  // gets custom chain IDs where l2ChainID matches the partnerChainID
  return getCustomChainsFromLocalStorage()
    .filter(chain => chain.partnerChainID === l2ChainID)
    .map(chain => chain.chainID)
}

export function getL2ChainIds(l1ChainId: number): ChainId[] {
  // Ethereum as the parent chain
  switch (l1ChainId) {
    case ChainId.Ethereum:
      return [ChainId.ArbitrumOne, ChainId.ArbitrumNova]
    case ChainId.Goerli:
      return [
        ChainId.ArbitrumGoerli,
        ChainId.XaiTestnet,
        ...getCustomChainIds(ChainId.ArbitrumGoerli)
      ]
    case ChainId.Sepolia:
      return [
        ChainId.ArbitrumSepolia,
        // ChainId.StylusTestnet,
        ChainId.DeriwTestnet,
        // ChainId.DeriwDevnet,
        ...getCustomChainIds(ChainId.ArbitrumSepolia)
      ]
    case ChainId.Local:
      return [
        ChainId.ArbitrumLocal,
        ...getCustomChainIds(ChainId.ArbitrumLocal)
      ]
    // Arbitrum as the parent chain
    case ChainId.ArbitrumGoerli:
      return [
        ChainId.Goerli,
        ChainId.XaiTestnet,
        ...getCustomChainIds(ChainId.ArbitrumGoerli)
      ]
    case ChainId.ArbitrumSepolia:
      return [
        ChainId.Sepolia,
        // ChainId.StylusTestnet,
        ChainId.DeriwTestnet,
        // ChainId.DeriwDevnet,
        ...getCustomChainIds(ChainId.ArbitrumSepolia)
      ]
    case ChainId.ArbitrumLocal:
      return [ChainId.Local, ...getCustomChainIds(ChainId.ArbitrumLocal)]
    default:
      return []
  }
}

export enum ChainId {
  // L1
  Ethereum = 1,
  // L1 Testnets
  Goerli = 5,
  Local = 1337,
  Sepolia = 11155111,
  // L2
  ArbitrumOne = 42161,
  ArbitrumNova = 42170,
  // L2 Testnets
  ArbitrumGoerli = 421613,
  ArbitrumSepolia = 421614,
  ArbitrumLocal = 412346,
  // Orbit Testnets
  XaiTestnet = 47279324479,
  StylusTestnet = 23011913,
  DeriwDevnet = 80707394653,
  DeriwTestnet = 2109095698
}

export const supportedCustomOrbitParentChains = [
  ChainId.ArbitrumGoerli,
  ChainId.ArbitrumSepolia,
]

export const rpcURLs: { [chainId: number]: string } = {
  // L1
  [ChainId.Ethereum]: loadEnvironmentVariableWithFallback({
    env: process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL,
    fallback: MAINNET_INFURA_RPC_URL
  }),
  // L1 Testnets
  [ChainId.Goerli]: loadEnvironmentVariableWithFallback({
    env: process.env.NEXT_PUBLIC_GOERLI_RPC_URL,
    fallback: GOERLI_INFURA_RPC_URL
  }),
  [ChainId.Sepolia]: loadEnvironmentVariableWithFallback({
    env: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL,
    fallback: SEPOLIA_INFURA_RPC_URL
  }),
  // L2
  [ChainId.ArbitrumOne]: 'https://arb1.arbitrum.io/rpc',
  [ChainId.ArbitrumNova]: 'https://nova.arbitrum.io/rpc',
  // L2 Testnets
  [ChainId.ArbitrumGoerli]: 'https://goerli-rollup.arbitrum.io/rpc',
  [ChainId.ArbitrumSepolia]: 'https://sepolia-rollup.arbitrum.io/rpc',
  // Orbit Testnets
  [ChainId.XaiTestnet]: 'https://testnet.xai-chain.net/rpc',
  [ChainId.StylusTestnet]: 'https://stylus-testnet.arbitrum.io/rpc',

  [ChainId.DeriwDevnet]: 'https://rpc.dev.deriw.com',
  [ChainId.DeriwTestnet]: 'https://rpc.test.deriw.com'
}

export const explorerUrls: { [chainId: number]: string } = {
  // L1
  [ChainId.Ethereum]: 'https://etherscan.io',
  // L1 Testnets
  [ChainId.Goerli]: 'https://goerli.etherscan.io',
  [ChainId.Sepolia]: 'https://sepolia.etherscan.io',
  // L2
  [ChainId.ArbitrumNova]: 'https://nova.arbiscan.io',
  [ChainId.ArbitrumOne]: 'https://arbiscan.io',
  // L2 Testnets
  [ChainId.ArbitrumGoerli]: 'https://goerli.arbiscan.io',
  [ChainId.ArbitrumSepolia]: 'https://sepolia.arbiscan.io',
  // Orbit Testnets
  [ChainId.XaiTestnet]: 'https://testnet-explorer.xai-chain.net',
  [ChainId.StylusTestnet]: 'https://stylus-testnet-explorer.arbitrum.io',

  [ChainId.DeriwDevnet]: 'https://explorer.dev.deriw.com',
  [ChainId.DeriwTestnet]: 'https://explorer.test.deriw.com'
}

export const getExplorerUrl = (chainId: ChainId) => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return explorerUrls[chainId] ?? explorerUrls[ChainId.Ethereum]! //defaults to etherscan, can never be null
}

export const getBlockTime = (chainId: ChainId) => {
  const network = parentChains[chainId]
  if (!network) {
    throw new Error(`Couldn't get block time. Unexpected chain ID: ${chainId}`)
  }
  return (network as L1Network).blockTime ?? 12
}

export const getConfirmPeriodBlocks = (chainId: ChainId) => {
  const network = l2Networks[chainId] || chains[chainId]
  if (!network) {
    throw new Error(
      `Couldn't get confirm period blocks. Unexpected chain ID: ${chainId}`
    )
  }
  return network.confirmPeriodBlocks
}

export const l2ArbReverseGatewayAddresses: { [chainId: number]: string } = {
  [ChainId.ArbitrumOne]: '0xCaD7828a19b363A2B44717AFB1786B5196974D8E',
  [ChainId.ArbitrumNova]: '0xbf544970E6BD77b21C6492C281AB60d0770451F4',
  [ChainId.ArbitrumGoerli]: '0x584d4D9bED1bEb39f02bb51dE07F493D3A5CdaA0'
}

export const l2DaiGatewayAddresses: { [chainId: number]: string } = {
  [ChainId.ArbitrumOne]: '0x467194771dAe2967Aef3ECbEDD3Bf9a310C76C65',
  [ChainId.ArbitrumNova]: '0x10E6593CDda8c58a1d0f14C5164B376352a55f2F'
}

export const l2wstETHGatewayAddresses: { [chainId: number]: string } = {
  [ChainId.ArbitrumOne]: '0x07d4692291b9e30e326fd31706f686f83f331b82'
}

export const l2LptGatewayAddresses: { [chainId: number]: string } = {
  [ChainId.ArbitrumOne]: '0x6D2457a4ad276000A615295f7A80F79E48CcD318'
}

// Default L2 Chain to use for a certain chainId
export const chainIdToDefaultL2ChainId: { [chainId: number]: ChainId[] } = {
  // L1
  [ChainId.Ethereum]: [ChainId.ArbitrumOne, ChainId.ArbitrumNova],
  // L1 Testnets
  [ChainId.Goerli]: [ChainId.ArbitrumGoerli],
  [ChainId.Sepolia]: [ChainId.ArbitrumSepolia],
  // L2
  [ChainId.ArbitrumOne]: [ChainId.ArbitrumOne],
  [ChainId.ArbitrumNova]: [ChainId.ArbitrumNova],
  // L2 Testnets
  [ChainId.ArbitrumGoerli]: [ChainId.ArbitrumGoerli, ChainId.XaiTestnet],
  [ChainId.ArbitrumSepolia]: [ChainId.ArbitrumSepolia, ChainId.StylusTestnet, ChainId.DeriwTestnet, ChainId.DeriwDevnet],
  // Orbit Testnets
  [ChainId.XaiTestnet]: [ChainId.XaiTestnet],
  [ChainId.StylusTestnet]: [ChainId.StylusTestnet],
  [ChainId.DeriwDevnet]: [ChainId.DeriwDevnet],
  [ChainId.DeriwTestnet]: [ChainId.DeriwTestnet]
}

const defaultL1Network: L1Network = {
  blockTime: 10,
  chainID: 1337,
  explorerUrl: '',
  isCustom: true,
  name: 'EthLocal',
  partnerChainIDs: [412346],
  isArbitrum: false
}

const defaultL2Network: ParentChain = {
  chainID: 412346,
  partnerChainIDs: [
    // Orbit chains will go here
  ],
  confirmPeriodBlocks: 20,
  ethBridge: {
    bridge: '0x2b360a9881f21c3d7aa0ea6ca0de2a3341d4ef3c',
    inbox: '0xff4a24b22f94979e9ba5f3eb35838aa814bad6f1',
    outbox: '0x49940929c7cA9b50Ff57a01d3a92817A414E6B9B',
    rollup: '0x65a59d67da8e710ef9a01eca37f83f84aedec416',
    sequencerInbox: '0xe7362d0787b51d8c72d504803e5b1d6dcda89540'
  },
  explorerUrl: '',
  isArbitrum: true,
  isCustom: true,
  name: 'ArbLocal',
  partnerChainID: 1337,
  retryableLifetimeSeconds: 604800,
  nitroGenesisBlock: 0,
  nitroGenesisL1Block: 0,
  depositTimeout: 900000,
  tokenBridge: {
    l1CustomGateway: '0x75E0E92A79880Bd81A69F72983D03c75e2B33dC8',
    l1ERC20Gateway: '0x4Af567288e68caD4aA93A272fe6139Ca53859C70',
    l1GatewayRouter: '0x85D9a8a4bd77b9b5559c1B7FCb8eC9635922Ed49',
    l1MultiCall: '0xA39FFA43ebA037D67a0f4fe91956038ABA0CA386',
    l1ProxyAdmin: '0x7E32b54800705876d3b5cFbc7d9c226a211F7C1a',
    l1Weth: '0xDB2D15a3EB70C347E0D2C2c7861cAFb946baAb48',
    l1WethGateway: '0x408Da76E87511429485C32E4Ad647DD14823Fdc4',
    l2CustomGateway: '0x525c2aBA45F66987217323E8a05EA400C65D06DC',
    l2ERC20Gateway: '0xe1080224B632A93951A7CFA33EeEa9Fd81558b5e',
    l2GatewayRouter: '0x1294b86822ff4976BfE136cB06CF43eC7FCF2574',
    l2Multicall: '0xDB2D15a3EB70C347E0D2C2c7861cAFb946baAb48',
    l2ProxyAdmin: '0xda52b25ddB0e3B9CC393b0690Ac62245Ac772527',
    l2Weth: '0x408Da76E87511429485C32E4Ad647DD14823Fdc4',
    l2WethGateway: '0x4A2bA922052bA54e29c5417bC979Daaf7D5Fe4f4'
  }
}

export const xaiTestnet: Chain = {
  chainID: 47279324479,
  confirmPeriodBlocks: 20,
  ethBridge: {
    bridge: '0xf958e56d431eA78C7444Cf6A6184Af732Ae6a8A3',
    inbox: '0x8b842ad88AAffD63d52EC54f6428fb7ff83060a8',
    outbox: '0xDfe36Bea935F11260b0159dCA255b6668925d743',
    rollup: '0x082742561295f6e1b43c4f5d1e2d52d7FfE082f1',
    sequencerInbox: '0x5fD0cCc5D31748A44b43cf8DFBFA0FAA32665464'
  },
  explorerUrl: 'https://testnet-explorer.xai-chain.net',
  isArbitrum: true,
  isCustom: true,
  name: 'Xai Orbit Testnet',
  partnerChainID: 421613,
  retryableLifetimeSeconds: 604800,
  tokenBridge: {
    l1CustomGateway: '0xdBbDc3EE848C05792CC93EA140c59731f920c3F2',
    l1ERC20Gateway: '0xC033fBAFd978440460d943efe6A3bF6A1a990e80',
    l1GatewayRouter: '0xCb0Fe28c36a60Cf6254f4dd74c13B0fe98FFE5Db',
    l1MultiCall: '0x21779e0950A87DDD57E341d54fc12Ab10F6eE167',
    l1ProxyAdmin: '0xc80853e91f8Ac0AaD6ff939F3861600Ab34Dfe12',
    l1Weth: '0xe39Ab88f8A4777030A534146A9Ca3B52bd5D43A3',
    l1WethGateway: '0x58ea20BE21b971Fa282905EdA74bA46540eEd977',
    l2CustomGateway: '0xc60622D1FbDD63Cf9c173D1b69715Ef2B725D792',
    l2ERC20Gateway: '0x47ab2DfD627360fC6ac4Ae2fB9fa6f3539aFfeCc',
    l2GatewayRouter: '0x75c2848D0B2116d6832Ff3758df09D4209b4b7ce',
    l2Multicall: '0xE2fBe979bD0df59554Fded36f3A3BF5206f287a2',
    l2ProxyAdmin: '0x81DeEc20158a367f7039ab3a563C1eB63cc2b3D6',
    l2Weth: '0xea77c06A6703A781f9442EFa083e21F3F75907F8',
    l2WethGateway: '0x927b59cCde7a92acDa085514FdEA39f0c4D1a2DC'
  },
  nitroGenesisBlock: 0,
  nitroGenesisL1Block: 0,
  depositTimeout: 1800000
}

export const DeriwDevnet: Chain = {
  "chainID": 80707394653,
  "confirmPeriodBlocks": 50,
  "ethBridge": {
    "bridge": "0x4D1ab7030B3194C99b05C404d8E0feC54cF71a94",
    "inbox": "0x506Dc21F082cB0D5505394066f84ac482c08290e",
    "outbox": "0xa97d32383772BB601E3A554d161Fa7489Fd94cEf",
    "rollup": "0x4030E25DDA7de9422d2447d5a384060a4132a6f7",
    "sequencerInbox": "0xABa1dd3991319AFE7E8ae785009BaFF8C27D9927"
  },
  "explorerUrl": "https://explorer.dev.deriw.com",
  "isCustom": true,
  "name": "OrbitChain",
  "partnerChainID": 421614,
  "partnerChainIDs": [],
  "retryableLifetimeSeconds": 604800,
  "nitroGenesisBlock": 0,
  "nitroGenesisL1Block": 0,
  "depositTimeout": 900000,
  "nativeToken": "0x0bD3Ff848003983471f65A8c3a6fdd7C6bEE3F3E",
  "isArbitrum": true,
  "tokenBridge": {
    "l1CustomGateway": "0x642D5C4Fcc950246eB6Fb3ECddE84ad7597e2B73",
    "l1ERC20Gateway": "0x97e181Ef033B599850F2a8df4335158472EC92fF",
    "l1GatewayRouter": "0x11FeBa5f9138Fda6408583Fa58856Cc1eBDB863d",
    "l1MultiCall": "0xce1CAd780c529e66e3aa6D952a1ED9A6447791c1",
    "l1ProxyAdmin": "0x0000000000000000000000000000000000000000",
    "l1Weth": "0x0000000000000000000000000000000000000000",
    "l1WethGateway": "0x0000000000000000000000000000000000000000",
    "l2CustomGateway": "0xF89586bd79cC0969a5a106BD1e3AaD3e0b2EeD8F",
    "l2ERC20Gateway": "0xe88c33ed4Bc7B246E73dD8f570c45f2C616C0129",
    "l2GatewayRouter": "0xFEC01f98fb52ad97ff60c47ebace967D66D64123",
    "l2Multicall": "0xfb68988b580445da2550F1CE9554474cf06540DF",
    "l2ProxyAdmin": "0x7BBb146C00eE9Cc470aF319ee2E12e46f0DA09E6",
    "l2Weth": "0x0000000000000000000000000000000000000000",
    "l2WethGateway": "0x0000000000000000000000000000000000000000"
  }
}

export const DeriwTestnet: Chain = {
  "chainID": 2109095698,
  "confirmPeriodBlocks": 150,
  "ethBridge": {
    "bridge": "0xdD5E8947006E3491c0FD90CC7926BF5b42dC0507",
    "inbox": "0x3754717f665E72E967d9Fde436D1BC23157b360e",
    "outbox": "0xF3d3a3C2d93724BeC276621f2F87A70140c8b720",
    "rollup": "0xfE8D94935c158073d5B2aB4CbB470F92A6e9E9d4",
    "sequencerInbox": "0xd573E5393BF25B938B91e8186804a5346Dedd6A5"
  },
  "explorerUrl": "https://explorer.dev.deriw.com",
  "isArbitrum": true,
  "isCustom": true,
  "name": "Deriw Testnet",
  "partnerChainID": 421614,
  "partnerChainIDs": [],
  "retryableLifetimeSeconds": 604800,
  "nitroGenesisBlock": 0,
  "nitroGenesisL1Block": 0,
  "depositTimeout": 900000,
  "nativeToken": "0x0bD3Ff848003983471f65A8c3a6fdd7C6bEE3F3E",
  "tokenBridge": {
    "l1CustomGateway": "0xE52D43b50804756407487a567A4aDb3feE9acfCd",
    "l1ERC20Gateway": "0xFc1E351C3A5d1D7e1285Ed1B03c69e735bDC5d52",
    "l1GatewayRouter": "0xcb81AafEe7a28fb2F5282D000de7c7F63E7CfAeE",
    "l1MultiCall": "0xce1CAd780c529e66e3aa6D952a1ED9A6447791c1",
    "l1ProxyAdmin": "0x0000000000000000000000000000000000000000",
    "l1Weth": "0x0000000000000000000000000000000000000000",
    "l1WethGateway": "0x0000000000000000000000000000000000000000",
    "l2CustomGateway": "0x7f73C587c35a9FF44BB4C0cFF083822e074ED83c",
    "l2ERC20Gateway": "0x4258c604e31cC873b3321a10e2F77D3367eeB052",
    "l2GatewayRouter": "0xF6dD7AFbAc349BB4AAcbcEC372B027cde4C3C321",
    "l2Multicall": "0xCF8120aCbb9384F840D2AFcEDD3f29B42c23bbEc",
    "l2ProxyAdmin": "0x896C7A9C45D1AF47Feb5942dE431B8c8594159e2",
    "l2Weth": "0x0000000000000000000000000000000000000000",
    "l2WethGateway": "0x0000000000000000000000000000000000000000"
  }
}


export type RegisterLocalNetworkParams = {
  l1Network: L1Network
  l2Network: L2Network
}

const registerLocalNetworkDefaultParams: RegisterLocalNetworkParams = {
  l1Network: defaultL1Network,
  l2Network: defaultL2Network
}

export const localL1NetworkRpcUrl = loadEnvironmentVariableWithFallback({
  env: process.env.NEXT_PUBLIC_LOCAL_ETHEREUM_RPC_URL,
  fallback: 'http://localhost:8545'
})
export const localL2NetworkRpcUrl = loadEnvironmentVariableWithFallback({
  env: process.env.NEXT_PUBLIC_LOCAL_ARBITRUM_RPC_URL,
  fallback: 'http://localhost:8547'
})

export function registerLocalNetwork(
  params: RegisterLocalNetworkParams = registerLocalNetworkDefaultParams
) {
  const { l1Network, l2Network } = params

  try {
    rpcURLs[l1Network.chainID] = localL1NetworkRpcUrl
    rpcURLs[l2Network.chainID] = localL2NetworkRpcUrl

    chainIdToDefaultL2ChainId[l1Network.chainID] = [l2Network.chainID]
    chainIdToDefaultL2ChainId[l2Network.chainID] = [l2Network.chainID]

    addCustomNetwork({ customL1Network: l1Network, customL2Network: l2Network })
  } catch (error: any) {
    console.error(`Failed to register local network: ${error.message}`)
  }
  try {
    addCustomChain({ customParentChain: l1Network, customChain: l2Network })
  } catch (error: any) {
    //
  }
}

export function isNetwork(chainId: ChainId) {
  const customChains = getCustomChainsFromLocalStorage()

  const isEthereumMainnet = chainId === ChainId.Ethereum

  const isGoerli = chainId === ChainId.Goerli
  const isSepolia = chainId === ChainId.Sepolia
  const isLocal = chainId === ChainId.Local

  const isArbitrumOne = chainId === ChainId.ArbitrumOne
  const isArbitrumNova = chainId === ChainId.ArbitrumNova
  const isArbitrumGoerli = chainId === ChainId.ArbitrumGoerli
  const isArbitrumSepolia = chainId === ChainId.ArbitrumSepolia
  const isArbitrumLocal = chainId === ChainId.ArbitrumLocal

  const isXaiTestnet = chainId === ChainId.XaiTestnet
  const isStylusTestnet = chainId === ChainId.StylusTestnet

  const isOwnTestnet = chainId === ChainId.DeriwDevnet

  const isDeriwTestnet = chainId === ChainId.DeriwTestnet

  const isEthereumMainnetOrTestnet =
    isEthereumMainnet || isGoerli || isSepolia || isLocal

  const isArbitrum =
    isArbitrumOne ||
    isArbitrumNova ||
    isArbitrumGoerli ||
    isArbitrumLocal ||
    isArbitrumSepolia

  const customChainIds = customChains.map(chain => chain.chainID)
  const isCustomOrbitChain = customChainIds.includes(chainId)

  const isTestnet =
    isGoerli ||
    isLocal ||
    isArbitrumGoerli ||
    isSepolia ||
    isArbitrumSepolia ||
    isXaiTestnet ||
    isOwnTestnet ||
    isStylusTestnet ||
    isCustomOrbitChain ||
    isDeriwTestnet

  const isSupported =
    isArbitrumOne ||
    isArbitrumNova ||
    isEthereumMainnet ||
    isGoerli ||
    isArbitrumGoerli ||
    isSepolia ||
    isArbitrumSepolia ||
    isStylusTestnet ||
    isXaiTestnet || // is network supported on bridge
    isOwnTestnet ||
    isDeriwTestnet

  return {
    // L1
    isEthereumMainnet,
    isEthereumMainnetOrTestnet,
    // L1 Testnets
    isGoerli,
    isSepolia,
    // L2
    isArbitrum,
    isArbitrumOne,
    isArbitrumNova,
    // L2 Testnets
    isArbitrumGoerli,
    isArbitrumSepolia,
    // Orbit chains
    isOrbitChain: !isEthereumMainnetOrTestnet && !isArbitrum,
    isXaiTestnet,
    isOwnTestnet,
    isDeriwTestnet,
    isStylusTestnet,
    // Testnet
    isTestnet,
    // General
    isSupported
  }
}

export function getNetworkName(chainId: number) {
  const customChain = getCustomChainFromLocalStorageById(chainId)

  if (customChain) {
    return customChain.name
  }

  switch (chainId) {
    case ChainId.Ethereum:
      return 'Ethereum'

    case ChainId.Goerli:
      return 'Goerli'

    case ChainId.Sepolia:
      return 'Sepolia'

    case ChainId.Local:
      return 'Ethereum'

    case ChainId.ArbitrumOne:
      return 'Arbitrum One'

    case ChainId.ArbitrumNova:
      return 'Arbitrum Nova'

    case ChainId.ArbitrumGoerli:
      return 'Arbitrum Goerli'

    case ChainId.ArbitrumSepolia:
      return 'Arbitrum Sepolia'

    case ChainId.ArbitrumLocal:
      return 'Arbitrum'

    case ChainId.XaiTestnet:
      return 'Xai Testnet'
    case ChainId.DeriwDevnet:
      return 'Deriw Devnet'
    case ChainId.DeriwTestnet:
      return 'Deriw Testnet'

    case ChainId.StylusTestnet:
      return 'Stylus Testnet'

    default:
      return 'Unknown'
  }
}

export function getNetworkLogo(
  chainId: number,
  variant: 'light' | 'dark' = 'dark'
) {
  switch (chainId) {
    // L1 networks
    case ChainId.Ethereum:
    case ChainId.Goerli:
    case ChainId.Sepolia:
      return '/images/EthereumLogo.svg'

    // L2 networks
    case ChainId.ArbitrumOne:
      return '/images/ArbitrumOneLogo.svg'

    case ChainId.ArbitrumGoerli:
    case ChainId.ArbitrumSepolia:
    case ChainId.ArbitrumLocal:
      return '/images/ArbitrumLogo.svg'

    case ChainId.ArbitrumNova:
      return '/images/ArbitrumNovaLogo.svg'

    case ChainId.XaiTestnet:
      return '/images/XaiLogo.svg'
    case ChainId.DeriwDevnet:
      return '/images/DeriwLogo.png'
    case ChainId.DeriwTestnet:
      return '/images/DeriwLogo.png'
    case ChainId.StylusTestnet:
      return '/images/StylusLogo.svg'

    default:
      const { isArbitrum, isOrbitChain } = isNetwork(chainId)
      if (isArbitrum) {
        return '/images/ArbitrumOneLogo.svg'
      }
      if (isOrbitChain) {
        return variant === 'dark'
          ? '/images/OrbitLogo.svg'
          : '/images/OrbitLogoWhite.svg'
      }
      return '/images/EthereumLogo.svg'
  }
}

export function getSupportedNetworks(chainId = 0, includeTestnets = false) {
  const testnetNetworks = [
    // ChainId.Goerli,
    // ChainId.ArbitrumGoerli,
    ChainId.Sepolia,
    ChainId.ArbitrumSepolia,
    // ChainId.XaiTestnet,
    // ChainId.DeriwDevnet,
    ChainId.DeriwTestnet,
    // ChainId.StylusTestnet,
    ...getCustomChainsFromLocalStorage().map(chain => chain.chainID)
  ]

  const mainnetNetworks = [
    ChainId.Ethereum,
    ChainId.ArbitrumOne,
    ChainId.ArbitrumNova
  ]

  return isNetwork(chainId).isTestnet
    ? [...testnetNetworks]
    : [...(includeTestnets ? testnetNetworks : [])]
}

export function mapCustomChainToNetworkData(chain: ChainWithRpcUrl) {
  // custom chain details need to be added to various objects to make it work with the UI
  //
  // update default L2 Chain ID; it allows us to pair the Chain with its Parent Chain
  chainIdToDefaultL2ChainId[chain.partnerChainID] = [
    ...(chainIdToDefaultL2ChainId[chain.partnerChainID] ?? []),
    chain.chainID
  ]
  // also set Chain's default chain to point to its own chain ID
  chainIdToDefaultL2ChainId[chain.chainID] = [
    ...(chainIdToDefaultL2ChainId[chain.chainID] ?? []),
    chain.chainID
  ]
  // add RPC
  rpcURLs[chain.chainID] = chain.rpcUrl
  // explorer URL
  explorerUrls[chain.chainID] = chain.explorerUrl
}
