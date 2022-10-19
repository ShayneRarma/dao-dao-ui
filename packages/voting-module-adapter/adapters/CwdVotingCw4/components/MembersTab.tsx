import { ComponentPropsWithoutRef } from 'react'
import { useTranslation } from 'react-i18next'

import { useActionForKey } from '@dao-dao/actions'
import { DaoMemberCard } from '@dao-dao/common'
import {
  useEncodedCwdProposalSinglePrefill,
  useVotingModule,
} from '@dao-dao/state'
import { ActionKey } from '@dao-dao/tstypes'
import {
  MembersTab as StatelessMembersTab,
  useDaoInfoContext,
} from '@dao-dao/ui'

import { useVotingModule as useCw4VotingModule } from '../hooks/useVotingModule'

export const MembersTab = () => {
  const { t } = useTranslation()
  const { coreAddress } = useDaoInfoContext()

  const { isMember = false } = useVotingModule(coreAddress, {
    fetchMembership: true,
  })
  const { totalVotingWeight } = useVotingModule(coreAddress, {
    fetchMembership: true,
  })
  const { members } = useCw4VotingModule(coreAddress, { fetchMembers: true })

  if (totalVotingWeight === undefined || !members) {
    throw new Error(t('error.loadingData'))
  }

  const manageMembersAction = useActionForKey(ActionKey.ManageMembers)
  // Prefill URL only valid if action exists.
  const prefillValid = !!manageMembersAction
  const encodedProposalPrefill = useEncodedCwdProposalSinglePrefill({
    actions: manageMembersAction
      ? [
          {
            action: manageMembersAction,
            data: {
              toAdd: [{ addr: '', weight: NaN }],
              toRemove: [],
            },
          },
        ]
      : [],
  })

  const memberCards: ComponentPropsWithoutRef<typeof DaoMemberCard>[] =
    members.map(({ addr, weight }) => ({
      address: addr,
      votingPowerPercent: (weight / totalVotingWeight) * 100,
    }))

  return (
    <StatelessMembersTab
      DaoMemberCard={DaoMemberCard}
      addMemberHref={
        prefillValid && encodedProposalPrefill
          ? `/dao/${coreAddress}/proposals/create?prefill=${encodedProposalPrefill}`
          : undefined
      }
      isMember={isMember}
      members={memberCards}
    />
  )
}
