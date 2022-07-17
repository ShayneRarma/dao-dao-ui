import { FC } from 'react'

import { useVotingModule } from '@dao-dao/state'
import {
  MobileHeaderLoader,
  MobileHeader as StatelessMobileHeader,
  SuspenseLoader,
} from '@dao-dao/ui'

import { useDAOInfoContext } from '@/components'
import { usePinnedDAOs } from '@/hooks'

const DAOMobileHeaderInternal: FC = () => {
  const { coreAddress, name, imageUrl } = useDAOInfoContext()
  const { isMember } = useVotingModule(coreAddress, { fetchMembership: true })

  const { isPinned, setPinned, setUnpinned } = usePinnedDAOs()
  const pinned = isPinned(coreAddress)

  return (
    <StatelessMobileHeader
      contractAddress={coreAddress}
      imageUrl={imageUrl ?? ''}
      member={isMember ?? false}
      name={name}
      onPin={() => {
        if (pinned) {
          setUnpinned(coreAddress)
        } else {
          setPinned(coreAddress)
        }
      }}
      pinned={pinned}
    />
  )
}

export const DAOMobileHeader: FC = () => (
  <SuspenseLoader
    fallback={
      <MobileHeaderLoader contractAddress={useDAOInfoContext().coreAddress} />
    }
  >
    <DAOMobileHeaderInternal />
  </SuspenseLoader>
)
