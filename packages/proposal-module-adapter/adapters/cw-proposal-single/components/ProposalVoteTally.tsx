import { Status } from '@dao-dao/tstypes/contracts/CwProposalSingle.common'

import { useProposal, useVotesInfo } from '../hooks'
import { ProposalVoteTally as StatelessProposalVoteTally } from './ui/ProposalVoteTally'

export const ProposalVoteTally = () => {
  const proposal = useProposal()

  return (
    <StatelessProposalVoteTally
      open={proposal.status === Status.Open}
      votesInfo={useVotesInfo()}
    />
  )
}
