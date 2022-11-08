import { CwCoreV1QueryClient, CwdCoreV2QueryClient } from '@dao-dao/state'
import { fetchProposalModules } from '@dao-dao/stateful'
import { ContractVersion } from '@dao-dao/types'
import { parseContractVersion } from '@dao-dao/utils'

import {
  Dao,
  DaoCommon,
  DaoIsV1,
  DaoIsV2,
  DaoV1,
  DaoV2,
  GetDaoMaker,
} from './types'

export const makeGetDao: GetDaoMaker =
  ({ cosmWasmClient }) =>
  async (coreAddress): Promise<Dao> => {
    const coreClient = new CwdCoreV2QueryClient(cosmWasmClient, coreAddress)

    const {
      admin,
      version: { version },
      voting_module: votingModuleAddress,
    } = await coreClient.dumpState()

    const coreVersion = parseContractVersion(version)
    if (!coreVersion) {
      throw new Error(`Invalid core version: ${version}`)
    }

    const votingModuleInfoResponse = await cosmWasmClient.queryContractSmart(
      votingModuleAddress,
      {
        info: {},
      }
    )
    if (
      !('info' in votingModuleInfoResponse) ||
      !('contract' in votingModuleInfoResponse.info) ||
      typeof votingModuleInfoResponse.info.contract !== 'string'
    ) {
      throw new Error(
        `Invalid voting module info response: ${JSON.stringify(
          votingModuleInfoResponse
        )}. Expected response.info.contract to be a string.`
      )
    }

    const votingModuleContractName = votingModuleInfoResponse.info
      .contract as string

    const proposalModules = await fetchProposalModules(
      cosmWasmClient,
      coreAddress,
      coreVersion
    )

    const daoCommon: DaoCommon = {
      admin,
      coreAddress,
      votingModule: {
        contractName: votingModuleContractName,
        address: votingModuleAddress,
      },
      proposalModules,
    }

    const dao: Dao = {
      ...daoCommon,
      ...(coreVersion === ContractVersion.V0_2_0
        ? {
            coreVersion,
            client: coreClient,
          }
        : {
            coreVersion,
            client: new CwCoreV1QueryClient(cosmWasmClient, coreAddress),
          }),
    }

    return dao
  }

export const daoIsV1: DaoIsV1 = (dao: Dao): dao is DaoV1 =>
  dao.coreVersion === ContractVersion.V0_1_0

export const daoIsV2: DaoIsV2 = (dao: Dao): dao is DaoV2 =>
  dao.coreVersion === ContractVersion.V0_2_0
