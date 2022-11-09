import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate'
import { StargateClient } from '@cosmjs/stargate'

import { CwCoreV1QueryClient, CwdCoreV2QueryClient } from '@dao-dao/state/contracts'
import { ContractVersion, ProposalModule } from '@dao-dao/types'

export type DaoDaoClientOptions =
  | {
      chainId: string
    }
  | {
      rpc: string
    }

export interface DaoDaoClient {
  chainId: string
  cosmWasmClient: CosmWasmClient
  stargateClient: StargateClient
  getDao: GetDao
}

export interface DaoCommon {
  admin: string | null
  coreAddress: string
  votingModule: {
    contractName: string
    address: string
  }
  proposalModules: ProposalModule[]
}

export interface DaoV1 extends DaoCommon {
  coreVersion: ContractVersion.V0_1_0
  client: CwCoreV1QueryClient
}

export interface DaoV2 extends DaoCommon {
  coreVersion: ContractVersion.V0_2_0
  client: CwdCoreV2QueryClient
}

export type Dao = DaoV1 | DaoV2
export type GetDao = (coreAddress: string) => Promise<Dao>
export type DaoIsV1 = (dao: Dao) => dao is DaoV1
export type DaoIsV2 = (dao: Dao) => dao is DaoV2

export interface GetDaoMakerOptions {
  cosmWasmClient: CosmWasmClient
}

export type GetDaoMaker = (options: GetDaoMakerOptions) => GetDao
