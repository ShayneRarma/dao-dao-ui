// GNU AFFERO GENERAL PUBLIC LICENSE Version 3. Copyright (C) 2022 DAO DAO Contributors.
// See the "LICENSE" file in the root directory of this package for more copyright information.

import { toHex } from '@cosmjs/encoding'
import { WalletConnectionStatus, useWallet } from '@noahsaso/cosmodal'
import cloneDeep from 'lodash.clonedeep'
import { GetStaticProps, NextPage } from 'next'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useRecoilState, useSetRecoilState } from 'recoil'

import { serverSideTranslations } from '@dao-dao/i18n/serverSideTranslations'
import { meTransactionAtom, refreshSavedTxsAtom } from '@dao-dao/state'
import {
  ConnectWallet,
  ProfileDisconnectedCard,
  ProfileHomeCard,
  SAVED_TX_PREFIX,
  SuspenseLoader,
  savedTxsSelector,
  temporarySavedTxsAtom,
  useCfWorkerAuthPostRequest,
} from '@dao-dao/stateful'
import { ActionsProvider, useCoreActions } from '@dao-dao/stateful/actions'
import {
  Loader,
  Me,
  MeDisconnected,
  useCachedLoadable,
} from '@dao-dao/stateless'
import { MeProps, MeTransactionForm, MeTransactionSave } from '@dao-dao/types'
import { ActionContextType, ActionsWithData } from '@dao-dao/types/actions'
import {
  CHAIN_BECH32_PREFIX,
  CHAIN_ID,
  KVPK_API_BASE,
  cwMsgToEncodeObject,
  loadableToLoadingData,
  processError,
} from '@dao-dao/utils'

const InnerMe = () => {
  const { t } = useTranslation()

  const {
    connected,
    address: walletAddress = '',
    publicKey,
    signingCosmWasmClient,
  } = useWallet()

  const actions = useCoreActions()

  // Call relevant action hooks in the same order every time.
  const actionsWithData: ActionsWithData = actions.reduce(
    (acc, action) => ({
      ...acc,
      [action.key]: {
        action,
        transform: action.useTransformToCosmos(),
        defaults: action.useDefaults(),
      },
    }),
    {}
  )

  const [_meTransactionAtom, setWalletTransactionAtom] =
    useRecoilState(meTransactionAtom)

  const formMethods = useForm<MeTransactionForm>({
    mode: 'onChange',
    // Don't clone every render.
    defaultValues: useMemo(
      () => cloneDeep(_meTransactionAtom),
      [_meTransactionAtom]
    ),
  })
  // Trigger validation on first render, in case loaded from localStorage.
  useEffect(() => {
    formMethods.trigger()
  }, [formMethods])

  const meTransaction = formMethods.watch()
  // Debounce saving latest data to atom and thus localStorage every 10 seconds.
  useEffect(() => {
    // Deep clone to prevent values from becoming readOnly.
    const timeout = setTimeout(
      () => setWalletTransactionAtom(cloneDeep(meTransaction)),
      10000
    )
    return () => clearTimeout(timeout)
  }, [setWalletTransactionAtom, meTransaction])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [txHash, setTxHash] = useState('')
  const execute: MeProps['execute'] = useCallback(
    async (data) => {
      if (!signingCosmWasmClient || !walletAddress) {
        setError(t('error.connectWalletToContinue'))
        return
      }

      setLoading(true)
      setError('')
      setTxHash('')

      try {
        const encodeObjects = data.map((msg) =>
          cwMsgToEncodeObject(msg, walletAddress)
        )
        const tx = await signingCosmWasmClient.signAndBroadcast(
          walletAddress,
          encodeObjects,
          'auto'
        )

        toast.success(t('success.transactionExecuted'))
        setTxHash(tx.transactionHash)
      } catch (err) {
        console.error(err)
        const error = processError(err)
        setError(error)
      } finally {
        setLoading(false)
      }
    },
    [signingCosmWasmClient, t, walletAddress]
  )

  const { ready: txSavesReady, postRequest: postTxSavesRequest } =
    useCfWorkerAuthPostRequest(KVPK_API_BASE, 'Transaction Saves')

  const setRefreshSaves = useSetRecoilState(refreshSavedTxsAtom)
  const refreshSaves = useCallback(
    () => setRefreshSaves((id) => id + 1),
    [setRefreshSaves]
  )

  const setTemporarySaves = useSetRecoilState(
    temporarySavedTxsAtom(publicKey?.hex ?? '')
  )
  const savesLoading = loadableToLoadingData(
    useCachedLoadable(
      publicKey?.hex ? savedTxsSelector(publicKey.hex) : undefined
    ),
    []
  )
  const [saving, setSaving] = useState(false)

  const save = async (save: MeTransactionSave) => {
    if (!txSavesReady) {
      toast.error(t('error.connectWalletToContinue'))
      return false
    }

    setSaving(true)
    try {
      const nameHash = toHex(
        new Uint8Array(
          await crypto.subtle.digest(
            'SHA-512',
            new TextEncoder().encode(save.name)
          )
        )
      )

      await postTxSavesRequest('/set', {
        key: SAVED_TX_PREFIX + nameHash,
        value: save,
      })

      setTemporarySaves((prev) => ({
        ...prev,
        [nameHash]: save,
      }))
      refreshSaves()

      return true
    } catch (err) {
      console.error(err)
      toast.error(processError(err))
    } finally {
      setSaving(false)
    }

    return false
  }
  const deleteSave = async (save: MeTransactionSave) => {
    if (!txSavesReady) {
      toast.error(t('error.connectWalletToContinue'))
      return false
    }

    try {
      const nameHash = toHex(
        new Uint8Array(
          await crypto.subtle.digest(
            'SHA-512',
            new TextEncoder().encode(save.name)
          )
        )
      )

      await postTxSavesRequest('/set', {
        key: SAVED_TX_PREFIX + nameHash,
        value: null,
      })

      setTemporarySaves((prev) => ({
        ...prev,
        [nameHash]: null,
      }))
      refreshSaves()

      return true
    } catch (err) {
      console.error(err)
      toast.error(processError(err))
    }

    return false
  }

  return (
    <Me
      SuspenseLoader={SuspenseLoader}
      actions={actions}
      actionsWithData={actionsWithData}
      connected={connected}
      deleteSave={deleteSave}
      error={error}
      execute={execute}
      formMethods={formMethods}
      loading={loading}
      rightSidebarContent={
        connected ? <ProfileHomeCard /> : <ProfileDisconnectedCard />
      }
      save={save}
      saves={savesLoading}
      saving={saving}
      txHash={txHash}
    />
  )
}

const WalletPage: NextPage = () => {
  const { address: walletAddress = '', connected, status } = useWallet()

  return connected ? (
    <ActionsProvider
      // If walletAddress changes, refresh actions.
      key={walletAddress}
      options={{
        chainId: CHAIN_ID,
        bech32Prefix: CHAIN_BECH32_PREFIX,
        address: walletAddress,
        context: {
          type: ActionContextType.Wallet,
        },
      }}
    >
      {/* Suspend to prevent hydration error since we load state on first render from localStorage. */}
      <SuspenseLoader fallback={<Loader />}>
        <InnerMe />
      </SuspenseLoader>
    </ActionsProvider>
  ) : (
    <MeDisconnected
      autoConnecting={
        status === WalletConnectionStatus.Initializing ||
        status === WalletConnectionStatus.AttemptingAutoConnection
      }
      connectWalletButton={<ConnectWallet />}
      rightSidebarContent={<ProfileDisconnectedCard />}
    />
  )
}

export default WalletPage

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['translation'])),
  },
})