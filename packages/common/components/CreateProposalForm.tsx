import { EyeIcon, EyeOffIcon, PlusIcon } from '@heroicons/react/outline'
import { useWallet } from '@noahsaso/cosmodal'
import { useRouter } from 'next/router'
import { ReactNode, useCallback, useEffect, useState } from 'react'
import {
  FormProvider,
  SubmitErrorHandler,
  SubmitHandler,
  useFieldArray,
  useForm,
} from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  constSelector,
  useRecoilState,
  useRecoilValue,
  useResetRecoilState,
} from 'recoil'

import {
  Action,
  ActionKey,
  ActionSelector,
  FormProposalData,
  UseDefaults,
  UseTransformToCosmos,
  useActionsForVotingModuleType,
} from '@dao-dao/actions'
import { Airplane } from '@dao-dao/icons'
import {
  Cw20BaseSelectors,
  CwCoreSelectors,
  activeDraftIdAtom,
  activeDraftSelector,
  draftsAtom,
  useProposalModule,
  useVotingModule,
} from '@dao-dao/state'
import { CosmosMsgFor_Empty } from '@dao-dao/types/contracts/cw3-dao'
import {
  Button,
  CosmosMessageDisplay,
  InputErrorMessage,
  InputLabel,
  MarkdownPreview,
  TextAreaInput,
  TextInput,
  Tooltip,
} from '@dao-dao/ui'
import {
  VotingModuleType,
  decodedMessagesString,
  usePlatform,
  validateRequired,
} from '@dao-dao/utils'

enum ProposeSubmitValue {
  Preview = 'Preview',
  Submit = 'Submit',
}

export interface ProposalData extends Omit<FormProposalData, 'actionData'> {
  messages: CosmosMsgFor_Empty[]
}

export interface CreateProposalFormProps {
  onSubmit: (data: ProposalData) => void
  loading: boolean
  coreAddress: string
  votingModuleType: VotingModuleType
  connectWalletButton?: ReactNode
}

export const CreateProposalForm = ({
  onSubmit,
  loading,
  coreAddress,
  votingModuleType,
  connectWalletButton,
}: CreateProposalFormProps) => {
  const { t } = useTranslation()
  const router = useRouter()
  const { connected, address: walletAddress } = useWallet()

  const { proposalModuleConfig } = useProposalModule(coreAddress)
  const { isMember } = useVotingModule(coreAddress)

  // Info about if deposit can be paid.
  const depositTokenBalance = useRecoilValue(
    proposalModuleConfig?.deposit_info?.deposit &&
      proposalModuleConfig?.deposit_info?.deposit !== '0' &&
      walletAddress
      ? Cw20BaseSelectors.balanceSelector({
          contractAddress: proposalModuleConfig.deposit_info.token,
          params: [{ address: walletAddress }],
        })
      : constSelector(undefined)
  )

  const canPayDeposit =
    !proposalModuleConfig?.deposit_info?.deposit ||
    proposalModuleConfig?.deposit_info?.deposit === '0' ||
    Number(depositTokenBalance?.balance) >=
      Number(proposalModuleConfig?.deposit_info?.deposit)

  // Info about if the DAO is paused.
  const pauseInfo = useRecoilValue(
    CwCoreSelectors.pauseInfoSelector({ contractAddress: coreAddress })
  )
  const isPaused = pauseInfo && 'Paused' in pauseInfo

  const formMethods = useForm<FormProposalData>({
    mode: 'onChange',
    defaultValues: {
      title: '',
      description: '',
      actionData: [],
    },
  })

  // Unpack here because we use these at the top level as well as
  // inside of nested components.
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = formMethods

  // Prefill form with data from parameter once ready.
  useEffect(() => {
    const potentialDefaultValue = router.query.prefill
    if (!router.isReady || typeof potentialDefaultValue !== 'string') {
      return
    }

    try {
      const data = JSON.parse(potentialDefaultValue)
      if (data.constructor.name === 'Object') {
        reset(data)
      }
      // If failed to parse, do nothing.
    } catch {}
  }, [router.query.prefill, router.isReady, reset])

  const [showPreview, setShowPreview] = useState(false)
  const [showActionSelector, setShowActionSelector] = useState(false)
  const [showSubmitErrorNote, setShowSubmitErrorNote] = useState(false)

  const proposalDescription = watch('description')
  const proposalTitle = watch('title')
  const proposalActionData = watch('actionData')

  const [activeDraftId, setActiveDraftId] = useRecoilState(activeDraftIdAtom)
  const [myDraft, setMyDraft] = useRecoilState(activeDraftSelector)
  const draftResetter = useResetRecoilState(activeDraftSelector)
  const [draftIds, setDraftIds] = useRecoilState(draftsAtom)
  const [loadedDraft, setLoadedDraft] = useState<boolean>(false)

  useEffect(() => {
    if (
      router.query.draftId &&
      typeof router.query.draftId == 'string' &&
      router.query.prefill === undefined
    ) {
      console.log('query draftId changed', router.query.draftId)
      // check if valid draft in local storage
      // OR if proposal fields are non-empty
      // otherwise clear query string
      // draftResetter()
      setLoadedDraft(false)
      setActiveDraftId(router.query.draftId)
      formMethods.reset({ title: '', description: '', actionData: [] })
    }
  }, [
    router.query.draftId,
    router.query.prefill,
    draftResetter,
    setLoadedDraft,
    setActiveDraftId,
  ])

  console.log('myDraft', myDraft)
  console.log('loadedDraft', loadedDraft)

  useEffect(() => {
    if (myDraft && !loadedDraft) {
      console.log('reset - nonnull draf and !loadedDraft', myDraft)
      const { title, description, actionData } = myDraft
      formMethods.reset({ title, description, actionData })
    }
  }, [myDraft, loadedDraft])

  useEffect(() => {
    if (!loadedDraft && !formMethods.formState.isDirty) {
      setLoadedDraft(true)
    }
  }, [loadedDraft, formMethods.formState.isDirty, setLoadedDraft])

  const isNonEmpty =
    proposalDescription.length > 0 ||
    proposalTitle.length > 0 ||
    proposalActionData.length > 0

  useEffect(() => {
    if (activeDraftId === undefined && isNonEmpty) {
      console.log('started typing, create draft')
      const draftId = Date.now().toString()
      setLoadedDraft(true)
      router.replace({ query: { ...router.query, draftId } }, undefined, {
        shallow: true,
      })
    }
  }, [isNonEmpty, activeDraftId])

  useEffect(() => {
    if (
      activeDraftId !== undefined &&
      isNonEmpty &&
      loadedDraft &&
      formMethods.formState.isDirty
    ) {
      console.log('updated draft, save to local storage', myDraft)
      console.log(
        'updated draft, save to local storage activeDraftId',
        activeDraftId
      )
      console.log(
        'updated draft, save to local storage queryLocalStorage',
        router.query.draftId
      )
      console.log(
        'updated draft, save to local storage loadedDraft',
        loadedDraft
      )

      setMyDraft({
        title: proposalTitle,
        description: proposalDescription,
        actionData: proposalActionData,
        daoAddress: coreAddress,
      })
    }
  }, [
    proposalDescription,
    proposalTitle,
    proposalActionData,
    loadedDraft,
    isNonEmpty,
    activeDraftId,
    formMethods.formState.isDirty,
  ])

  const { append, remove } = useFieldArray({
    name: 'actionData',
    control,
    shouldUnregister: true,
  })

  const actions = useActionsForVotingModuleType(votingModuleType)
  // Call relevant action hooks in the same order every time.
  const actionsWithData: Partial<
    Record<
      ActionKey,
      {
        action: Action
        transform: ReturnType<UseTransformToCosmos>
        defaults: ReturnType<UseDefaults>
      }
    >
  > = actions.reduce(
    (acc, action) => ({
      ...acc,
      [action.key]: {
        action,
        transform: action.useTransformToCosmos(coreAddress),
        defaults: action.useDefaults(coreAddress),
      },
    }),
    {}
  )

  const onSubmitForm: SubmitHandler<FormProposalData> = useCallback(
    ({ actionData, ...data }, event) => {
      setShowSubmitErrorNote(false)

      const nativeEvent = event?.nativeEvent as SubmitEvent
      const submitterValue = (nativeEvent?.submitter as HTMLInputElement)?.value

      if (submitterValue === ProposeSubmitValue.Preview) {
        setShowPreview((p) => !p)
        return
      }

      onSubmit({
        ...data,
        messages: actionData
          .map(({ key, data }) => actionsWithData[key]?.transform(data))
          // Filter out undefined messages.
          .filter(Boolean) as CosmosMsgFor_Empty[],
      })
    },
    [onSubmit, actionsWithData]
  )

  const onSubmitError: SubmitErrorHandler<FormProposalData> = useCallback(
    () => setShowSubmitErrorNote(true),
    [setShowSubmitErrorNote]
  )

  // Detect if Mac for checking keypress.
  const { isMac } = usePlatform()
  // Keybinding to open add action selector.
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (
        // If already showing action selector, do nothing. This allows the
        // keybinding to function normally when the selector is open. The
        // escape keybinding can always be used to exit the modal.
        showActionSelector ||
        // Or if focused on an input.
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return
      }

      if ((!isMac && event.ctrlKey) || event.metaKey) {
        if (event.key === 'a') {
          event.preventDefault()
          setShowActionSelector(true)
        }
      }
    },
    [isMac, showActionSelector]
  )
  // Setup search keypress.
  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])

  return (
    <FormProvider {...formMethods}>
      <form
        className="max-w-[800px]"
        onSubmit={handleSubmit(onSubmitForm, onSubmitError)}
      >
        {showPreview && (
          <>
            <div className="max-w-prose">
              <h1 className="my-6 text-xl header-text">{proposalTitle}</h1>
            </div>
            <div className="mt-[22px] mb-[36px]">
              <MarkdownPreview markdown={proposalDescription} />
            </div>
            <CosmosMessageDisplay
              value={decodedMessagesString(
                proposalActionData
                  .map(({ key, data }) => actionsWithData[key]?.transform(data))
                  // Filter out undefined messages.
                  .filter(Boolean) as CosmosMsgFor_Empty[]
              )}
            />
          </>
        )}
        <div className={showPreview ? 'hidden' : ''}>
          <div className="flex flex-col gap-1 my-3">
            <InputLabel name={t('form.proposalTitle')} />
            <TextInput
              error={errors.title}
              fieldName="title"
              register={register}
              validation={[validateRequired]}
            />
            <InputErrorMessage error={errors.title} />
          </div>
          <div className="flex flex-col gap-1 my-3">
            <InputLabel name={t('form.proposalDescription')} />
            <TextAreaInput
              error={errors.description}
              fieldName="description"
              register={register}
              validation={[validateRequired]}
            />
            <InputErrorMessage error={errors.description} />
          </div>
          <ul className="list-none">
            {proposalActionData.map((actionData, index) => {
              const Component =
                actionsWithData[actionData.key]?.action?.Component
              if (!Component) {
                throw new Error(`Error detecting action type ${actionData.key}`)
              }

              return (
                <li key={index}>
                  <Component
                    allActionsWithData={proposalActionData}
                    coreAddress={coreAddress}
                    errors={errors.actionData?.[index]?.data || {}}
                    getFieldName={(fieldName) =>
                      `actionData.${index}.data.${fieldName}`
                    }
                    index={index}
                    onRemove={() => remove(index)}
                  />
                </li>
              )
            })}
          </ul>
          <div className="mt-2">
            <Button
              disabled={loading}
              onClick={() => setShowActionSelector(true)}
              type="button"
              variant="secondary"
            >
              <PlusIcon className="inline h-4" /> {t('button.addAnAction')}{' '}
              <p className="ml-4 text-secondary">{isMac ? '⌘' : '⌃'}A</p>
            </Button>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-4">
          {connected ? (
            <Tooltip
              label={
                !isMember
                  ? t('error.mustBeMemberToCreateProposal')
                  : !canPayDeposit
                  ? t('error.notEnoughForDeposit')
                  : isPaused
                  ? t('error.daoIsPaused')
                  : undefined
              }
            >
              <Button
                disabled={!isMember || !canPayDeposit || isPaused}
                loading={loading}
                type="submit"
                value={ProposeSubmitValue.Submit}
              >
                {t('button.publishProposal') + ' '}
                <Airplane color="currentColor" height="14px" width="14px" />
              </Button>
            </Tooltip>
          ) : (
            connectWalletButton
          )}
          <Button
            disabled={loading}
            type="submit"
            value={ProposeSubmitValue.Preview}
            variant="secondary"
          >
            {showPreview ? (
              <>
                {t('button.hidePreview')}
                <EyeOffIcon className="inline ml-2 h-5 stroke-current" />
              </>
            ) : (
              <>
                {t('button.preview')}
                <EyeIcon className="inline ml-2 h-5 stroke-current" />
              </>
            )}
          </Button>
        </div>
        {showSubmitErrorNote && (
          <p className="mt-2 text-right text-error secondary-text">
            {t('error.createProposalSubmitInvalid')}
          </p>
        )}
      </form>

      {showActionSelector && (
        <ActionSelector
          onClose={() => setShowActionSelector(false)}
          onSelectAction={({ key }) => {
            append({
              key,
              data: actionsWithData[key]?.defaults ?? {},
            })
            setShowActionSelector(false)
          }}
          votingModuleType={votingModuleType}
        />
      )}
    </FormProvider>
  )
}
