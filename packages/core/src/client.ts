import {
  getCosmWasmClientForChain,
  getStargateClientForChain,
} from '@dao-dao/utils/chain'

import { makeGetDao } from './dao'
import { DaoDaoClient, DaoDaoClientOptions } from './types'

export const createDaoDaoClient = async (
  options: DaoDaoClientOptions
): Promise<DaoDaoClient> => {
  const chainId = 'chainId' in options ? options.chainId : ''
  const rpc = 'rpc' in options ? options.rpc : undefined

  const cosmWasmClient = await getCosmWasmClientForChain(chainId, rpc)
  const stargateClient = await getStargateClientForChain(chainId, rpc)
  const connectedChainId = await cosmWasmClient.getChainId()

  const getDao = makeGetDao({
    cosmWasmClient,
  })

  return {
    chainId: connectedChainId,
    cosmWasmClient,
    stargateClient,
    getDao,
  }
}
