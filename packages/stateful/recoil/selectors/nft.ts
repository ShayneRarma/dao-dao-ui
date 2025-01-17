import { ChainInfoID } from '@noahsaso/cosmodal'
import {
  constSelector,
  selectorFamily,
  waitForAll,
  waitForAllSettled,
} from 'recoil'

import {
  Cw721BaseSelectors,
  DaoCoreV2Selectors,
  nativeAndStargazeCollectionInfoSelector,
  nftTokenUriDataSelector,
  queryWalletIndexerSelector,
  refreshWalletBalancesIdAtom,
  refreshWalletStargazeNftsAtom,
} from '@dao-dao/state'
import { NftCardInfo, WithChainId } from '@dao-dao/types'
import { NftInfoResponse } from '@dao-dao/types/contracts/Cw721Base'
import { NativeStargazeCollectionInfo, StargazeNft } from '@dao-dao/types/nft'
import {
  CHAIN_ID,
  STARGAZE_PROFILE_API_TEMPLATE,
  STARGAZE_URL_BASE,
  parseNftUriResponse,
} from '@dao-dao/utils'

export const walletStargazeNftCardInfosSelector = selectorFamily<
  NftCardInfo[],
  string
>({
  key: 'walletStargazeNftCardInfos',
  get:
    (walletAddress: string) =>
    async ({ get }) => {
      get(refreshWalletStargazeNftsAtom(walletAddress))

      const stargazeNfts: StargazeNft[] = await (
        await fetch(
          STARGAZE_PROFILE_API_TEMPLATE.replace('ADDRESS', walletAddress)
        )
      ).json()

      if (!Array.isArray(stargazeNfts)) {
        return []
      }

      const nftCardInfos = stargazeNfts.map(
        ({ collection, tokenId, image, name, description }): NftCardInfo => ({
          collection: {
            address: collection.contractAddress,
            name: collection.name,
          },
          tokenId,
          externalLink: {
            href: `${STARGAZE_URL_BASE}/media/${collection.contractAddress}/${tokenId}`,
            name: 'Stargaze',
          },
          imageUrl: image,
          // floorPrice: {
          //   amount: 0,
          //   denom: '',
          // }
          name,
          description: description || undefined,
          chainId: ChainInfoID.Stargaze1,
        })
      )

      return nftCardInfos
    },
})

// Used to construct token info without querying the contract for the token URI.
// This is used by the selector below that fetches token URI from the contract,
// it is also used by the mint NFT action which has a token URI but is not
// guaranteed to be on-chain yet (before a proposal is executed, the token URI
// can be found in the Cosmos msg, but the contract hasn't yet stored it).
export const nftCardInfoWithUriSelector = selectorFamily<
  NftCardInfo,
  WithChainId<{
    collection: string
    tokenId: string
    tokenUri?: string | null | undefined
  }>
>({
  key: 'nftCardInfo',
  get:
    ({ tokenId, collection, tokenUri, chainId }) =>
    async ({ get }) => {
      const { native, stargaze } = get(
        nativeAndStargazeCollectionInfoSelector({
          nativeCollectionAddress: collection,
          chainId,
        })
      )
      const tokenData = get(
        tokenUri ? nftTokenUriDataSelector(tokenUri) : constSelector(undefined)
      )

      const info: NftCardInfo = {
        collection: {
          address: stargaze?.address ?? native.address,
          name: stargaze?.info.name ?? native.info.name,
        },
        tokenId,
        externalLink: stargaze?.address.startsWith('stars')
          ? {
              href: `${STARGAZE_URL_BASE}/media/${stargaze.address}/${tokenId}`,
              name: 'Stargaze',
            }
          : undefined,
        // Default to tokenUri; this gets overwritten if tokenUri contains valid
        // metadata and has an image.
        imageUrl: tokenUri ?? '',
        name: '',
        description: undefined,
        chainId: stargaze ? ChainInfoID.Stargaze1 : chainId ?? CHAIN_ID,
      }

      const { name, description, imageUrl, externalLink } = parseNftUriResponse(
        tokenData || ''
      )
      info.name = name || info.name
      info.description = description || info.description
      info.imageUrl = imageUrl || info.imageUrl
      info.externalLink = externalLink || info.externalLink

      return info
    },
})

export const nftCardInfoSelector = selectorFamily<
  NftCardInfo,
  WithChainId<{ tokenId: string; collection: string }>
>({
  key: 'nftCardInfo',
  get:
    ({ tokenId, collection, chainId }) =>
    async ({ get }) => {
      const tokenInfo = get(
        Cw721BaseSelectors.nftInfoSelector({
          contractAddress: collection,
          chainId,
          params: [{ tokenId }],
        })
      )

      return get(
        nftCardInfoWithUriSelector({
          tokenId,
          collection,
          tokenUri: tokenInfo.token_uri,
          chainId,
        })
      )
    },
})

export const nftCardInfosForDaoSelector = selectorFamily<
  NftCardInfo[],
  WithChainId<{
    coreAddress: string
    // If DAO is using the cw721-staking voting module adapter, it will have an
    // NFT governance collection. If this is the case, passing it here makes
    // sure we include the collection if it is not in the DAO's cw721 token
    // list.
    governanceCollectionAddress?: string
  }>
>({
  key: 'nftCardInfosForDao',
  get:
    ({ coreAddress, governanceCollectionAddress, chainId }) =>
    async ({ get }) => {
      const nftCollectionAddresses = get(
        DaoCoreV2Selectors.allCw721TokenListSelector({
          contractAddress: coreAddress,
          chainId,
          governanceCollectionAddress,
        })
      )

      // Wait for all to settle so we can filter out any that failed. These may
      // fail if weird IBC cross-chain stuff happens.
      const nftCollectionInfos = get(
        waitForAllSettled(
          nftCollectionAddresses.map((collectionAddress) =>
            nativeAndStargazeCollectionInfoSelector({
              nativeCollectionAddress: collectionAddress,
              chainId,
            })
          )
        )
      )
        .filter((info) => info.state === 'hasValue')
        .map((info) => info.contents) as NativeStargazeCollectionInfo[]

      const nftCollectionTokenIds = get(
        waitForAll(
          nftCollectionAddresses.map((collectionAddress) =>
            Cw721BaseSelectors.allTokensForOwnerSelector({
              contractAddress: collectionAddress,
              chainId,
              owner: coreAddress,
            })
          )
        )
      )

      const collectionsWithTokens = nftCollectionInfos
        .map((collectionInfo, index) => {
          const tokenIds = nftCollectionTokenIds[index]

          const infos = get(
            waitForAll(
              tokenIds.map((tokenId) =>
                Cw721BaseSelectors.nftInfoSelector({
                  contractAddress: collectionInfo.native.address,
                  chainId,
                  params: [{ tokenId }],
                })
              )
            )
          )

          const uriDataResponses = get(
            waitForAll(
              infos.map(({ token_uri } = { token_uri: undefined }) =>
                token_uri
                  ? nftTokenUriDataSelector(token_uri)
                  : constSelector(undefined)
              )
            )
          )

          return {
            collectionInfo,
            tokens: tokenIds
              .map((tokenId, index) => ({
                tokenId,
                info: infos[index],
                uriDataResponse: uriDataResponses[index],
              }))
              .filter(
                ({ info, uriDataResponse }) => !!info && !!uriDataResponse
              ) as {
              tokenId: string
              info: NftInfoResponse
              uriDataResponse: string
            }[],
          }
        })
        .filter(Boolean) as {
        collectionInfo: NativeStargazeCollectionInfo
        tokens: {
          tokenId: string
          info: NftInfoResponse
          uriDataResponse: string
        }[]
      }[]

      const infos: NftCardInfo[] = collectionsWithTokens
        .flatMap(
          ({
            collectionInfo: { native: nativeInfo, stargaze: stargazeInfo },
            tokens,
          }) =>
            tokens.map(
              ({
                tokenId,
                info: nftInfo,
                uriDataResponse,
              }): NftCardInfo | undefined => {
                const info: NftCardInfo = {
                  collection: {
                    address: stargazeInfo?.address ?? nativeInfo.address,
                    name: stargazeInfo?.info.name ?? nativeInfo.info.name,
                  },
                  tokenId,
                  externalLink: stargazeInfo?.address.startsWith('stars')
                    ? {
                        href: `${STARGAZE_URL_BASE}/media/${stargazeInfo.address}/${tokenId}`,
                        name: 'Stargaze',
                      }
                    : undefined,
                  imageUrl: nftInfo.token_uri ?? '',
                  // floorPrice?: {
                  //   amount: number
                  //   denom: string
                  // }
                  name: '',
                  description: '',
                  chainId: stargazeInfo
                    ? ChainInfoID.Stargaze1
                    : chainId ?? CHAIN_ID,
                }

                const { name, description, imageUrl, externalLink } =
                  parseNftUriResponse(uriDataResponse)
                info.name = name || info.name
                info.description = description || info.description
                info.imageUrl = imageUrl || info.imageUrl
                info.externalLink = externalLink || info.externalLink

                return info
              }
            )
        )
        .filter(Boolean) as NftCardInfo[]

      return infos
    },
})

type CollectionWithTokens = {
  collectionAddress: string
  tokens: string[]
}

// Retrieve all NFTs for a given wallet address using the indexer.
export const walletNftCardInfos = selectorFamily<
  NftCardInfo[],
  WithChainId<{
    walletAddress: string
  }>
>({
  key: 'walletNftCardInfos',
  get:
    ({ walletAddress, chainId }) =>
    async ({ get }) => {
      const id = get(refreshWalletBalancesIdAtom(walletAddress))

      const collections: CollectionWithTokens[] = get(
        queryWalletIndexerSelector({
          chainId,
          walletAddress,
          formulaName: 'nft/collections',
          id,
        })
      )
      if (!collections || !Array.isArray(collections)) {
        return []
      }

      const nftCardInfos = get(
        waitForAll(
          collections.flatMap(({ collectionAddress, tokens }) =>
            tokens.map((tokenId) =>
              nftCardInfoSelector({
                collection: collectionAddress,
                tokenId,
              })
            )
          )
        )
      )

      return nftCardInfos
    },
})

// Retrieve all NFTs a given wallet address has staked with a DAO (via
// dao-voting-cw721-staked) using the indexer.
export const walletStakedNftCardInfos = selectorFamily<
  NftCardInfo[],
  WithChainId<{
    walletAddress: string
  }>
>({
  key: 'walletStakedNftCardInfos',
  get:
    ({ walletAddress, chainId }) =>
    async ({ get }) => {
      const id = get(refreshWalletBalancesIdAtom(walletAddress))

      const collections: CollectionWithTokens[] = get(
        queryWalletIndexerSelector({
          chainId,
          walletAddress,
          formulaName: 'nft/stakedWithDaos',
          id,
        })
      )
      if (!collections || !Array.isArray(collections)) {
        return []
      }

      const nftCardInfos = get(
        waitForAll(
          collections.flatMap(({ collectionAddress, tokens }) =>
            tokens.map((tokenId) =>
              nftCardInfoSelector({
                collection: collectionAddress,
                tokenId,
              })
            )
          )
        )
      )

      return nftCardInfos
    },
})
