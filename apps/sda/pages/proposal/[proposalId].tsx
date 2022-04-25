import { useCallback, useState } from 'react'

import type { GetStaticPaths, GetStaticProps, NextPage } from 'next'
import { useRouter } from 'next/router'

import { constSelector, useRecoilValue } from 'recoil'

import { proposalExecutionTXHashSelector, useWallet } from '@dao-dao/state'
import { Vote } from '@dao-dao/state/clients/cw-proposal-single'
import {
  useCastVote,
  useExecute,
} from '@dao-dao/state/hooks/cw-proposal-single'
import { votingPowerAtHeightSelector } from '@dao-dao/state/recoil/selectors/clients/cw-core'
import {
  getVoteSelector,
  proposalSelector,
} from '@dao-dao/state/recoil/selectors/clients/cw-proposal-single'
import { StakingMode } from '@dao-dao/ui'
import {
  V1ProposalDetails,
  V1ProposalInfoCard,
  V1ProposalInfoVoteStatus,
} from '@dao-dao/ui/components/ProposalDetails'
import { convertThresholdDataToTQ } from '@dao-dao/utils/v1'
import toast from 'react-hot-toast'

import {
  makeGetStaticProps,
  PageWrapper,
  PageWrapperProps,
  StakingModal,
  TemplateRendererComponent,
} from '@/components'
import { useGovernanceModule, useGovernanceTokenInfo } from '@/hooks'
import { cleanChainError, DAO_ADDRESS } from '@/util'

const InnerProposal = () => {
  const router = useRouter()
  const { address: walletAddress, connected } = useWallet()

  const [showStaking, setShowStaking] = useState(false)
  const [loading, setLoading] = useState(false)

  const proposalIdQuery = router.query.proposalId
  const proposalId =
    typeof proposalIdQuery === 'string' && !isNaN(Number(proposalIdQuery))
      ? Number(proposalIdQuery)
      : undefined

  const { governanceTokenInfo } = useGovernanceTokenInfo()
  const { governanceModuleAddress, governanceModuleConfig } =
    useGovernanceModule()

  const proposalResponse = useRecoilValue(
    governanceModuleAddress && proposalId !== undefined
      ? proposalSelector({
          contractAddress: governanceModuleAddress,
          params: [{ proposalId }],
        })
      : constSelector(undefined)
  )
  const voteResponse = useRecoilValue(
    governanceModuleAddress && proposalId !== undefined && walletAddress
      ? getVoteSelector({
          contractAddress: governanceModuleAddress,
          params: [{ proposalId, voter: walletAddress }],
        })
      : constSelector(undefined)
  )

  const votingPowerAtHeight = useRecoilValue(
    walletAddress && proposalResponse
      ? votingPowerAtHeightSelector({
          contractAddress: DAO_ADDRESS,
          params: [
            {
              address: walletAddress,
              height: proposalResponse.proposal.start_height,
            },
          ],
        })
      : constSelector(undefined)
  )

  const txHash = useRecoilValue(
    governanceModuleAddress && proposalId !== undefined
      ? proposalExecutionTXHashSelector({
          contractAddress: governanceModuleAddress,
          proposalId,
        })
      : constSelector(undefined)
  )

  const castVote = useCastVote({
    contractAddress: governanceModuleAddress ?? '',
    sender: walletAddress ?? '',
  })
  const executeProposal = useExecute({
    contractAddress: governanceModuleAddress ?? '',
    sender: walletAddress ?? '',
  })

  const onVote = useCallback(
    async (vote: Vote) => {
      if (!connected || proposalId === undefined) return

      setLoading(true)

      try {
        await castVote({
          proposalId,
          vote,
        })
        toast.success('Vote successfully cast.')
      } catch (err) {
        console.error(err)
        toast.error(cleanChainError(err.message))
      }

      setLoading(false)
    },
    [castVote, connected, proposalId, setLoading]
  )

  const onExecute = useCallback(async () => {
    if (!connected || proposalId === undefined) return

    setLoading(true)

    try {
      const response = await executeProposal({
        proposalId,
      })
      toast.success(
        `Executed successfully. Transaction hash (${response.transactionHash}) can be found in the proposal details.`
      )
    } catch (err) {
      console.error(err)
      toast.error(cleanChainError(err.message))
    }

    setLoading(false)
  }, [executeProposal, connected, proposalId, setLoading])

  if (
    !proposalResponse ||
    !connected ||
    !votingPowerAtHeight ||
    !voteResponse ||
    !governanceTokenInfo ||
    !governanceModuleConfig
  ) {
    throw new Error('Failed to load page data.')
  }

  const { threshold, quorum } = convertThresholdDataToTQ(
    proposalResponse.proposal.threshold
  )

  const memberWhenProposalCreated = Number(votingPowerAtHeight.power) > 0

  return (
    <div className="grid grid-cols-4 lg:grid-cols-6">
      <div className="col-span-4 p-6 w-full">
        <div className="px-6 mt-6 lg:hidden">
          <V1ProposalInfoCard
            memberWhenProposalCreated={memberWhenProposalCreated}
            proposalExecutionTXHash={txHash}
            proposalResponse={proposalResponse}
            walletVote={voteResponse.vote?.vote ?? undefined}
          />
        </div>

        <V1ProposalDetails
          TemplateRendererComponent={TemplateRendererComponent}
          loading={loading}
          onExecute={onExecute}
          onVote={onVote}
          proposal={proposalResponse.proposal}
          setShowStaking={setShowStaking}
          showStaking={showStaking}
          stakingModal={
            <StakingModal
              defaultMode={StakingMode.Stake}
              onClose={() => setShowStaking(false)}
            />
          }
          walletVote={voteResponse.vote?.vote ?? undefined}
          walletWeightPercent={
            (Number(votingPowerAtHeight.power) /
              Number(proposalResponse.proposal.total_power)) *
            100
          }
        />

        <div className="px-6 pb-6 mt-6 lg:hidden">
          <h3 className="mb-6 text-base font-medium">Referendum status</h3>

          <V1ProposalInfoVoteStatus
            maxVotingSeconds={
              'time' in governanceModuleConfig.max_voting_period
                ? governanceModuleConfig.max_voting_period.time
                : undefined
            }
            proposal={proposalResponse.proposal}
            quorum={quorum}
            threshold={threshold}
            tokenDecimals={governanceTokenInfo.decimals}
          />
        </div>
      </div>

      <div className="hidden col-span-2 p-6 min-h-screen lg:block bg-base-200">
        <h2 className="mb-6 text-base font-medium">Details</h2>
        <V1ProposalInfoCard
          memberWhenProposalCreated={memberWhenProposalCreated}
          proposalExecutionTXHash={txHash}
          proposalResponse={proposalResponse}
          walletVote={voteResponse.vote?.vote ?? undefined}
        />

        <h3 className="mt-8 mb-6 text-base font-medium">Referendum status</h3>
        <V1ProposalInfoVoteStatus
          maxVotingSeconds={
            'time' in governanceModuleConfig.max_voting_period
              ? governanceModuleConfig.max_voting_period.time
              : undefined
          }
          proposal={proposalResponse.proposal}
          quorum={quorum}
          threshold={threshold}
          tokenDecimals={governanceTokenInfo.decimals}
        />
      </div>
    </div>
  )
}

const ProposalPage: NextPage<PageWrapperProps> = ({
  children: _,
  ...props
}) => (
  <PageWrapper {...props}>
    <InnerProposal />
  </PageWrapper>
)

export default ProposalPage

// Fallback to loading screen if page has not yet been statically
// generated.
export const getStaticPaths: GetStaticPaths = () => ({
  paths: [],
  fallback: true,
})

export const getStaticProps: GetStaticProps = async (...props) => {
  const proposalIdQuery = props[0].params?.proposalId
  if (typeof proposalIdQuery !== 'string' || isNaN(Number(proposalIdQuery))) {
    return { notFound: true }
  }

  const proposalId = Number(proposalIdQuery)
  return await makeGetStaticProps({
    followingTitle: `Proposal #${proposalId}`,
  })(...props)
}
