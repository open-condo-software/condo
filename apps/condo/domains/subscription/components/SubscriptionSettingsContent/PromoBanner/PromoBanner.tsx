import { useGetPendingBankingRequestQuery } from '@app/condo/gql'
import { UserHelpRequestTypeType } from '@app/condo/schema'
import getConfig from 'next/config'
import React, { useCallback, useState } from 'react'

import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Card, Typography, Space, Button } from '@open-condo/ui'

import { LoginWithSBBOLButton } from '@condo/domains/common/components/LoginWithSBBOLButton'
import { UserHelpRequest } from '@condo/domains/onboarding/utils/clientSchema'


const { publicRuntimeConfig: { hasSbbolAuth } } = getConfig()

export const PromoBanner: React.FC = () => {
    const intl = useIntl()
    const BannerTitle = intl.formatMessage({ id: 'subscription.promoBanner.title' })
    const BannerDescription = intl.formatMessage({ id: 'subscription.promoBanner.description' })
    const RkoButtonLabel = intl.formatMessage({ id: 'subscription.promoBanner.rkoButton' })
    const RequestPendingMessage = intl.formatMessage({ id: 'subscription.promoBanner.requestPending' })

    const { user } = useAuth()
    const { organization } = useOrganization()

    const [loading, setLoading] = useState(false)

    const {
        data: pendingRequestData,
        refetch: refetchPendingRequest,
    } = useGetPendingBankingRequestQuery({
        variables: { organizationId: organization?.id },
        skip: !organization?.id,
    })
    const hasPendingRequest = (pendingRequestData?.pendingBankingRequest?.length ?? 0) > 0

    const createHelpRequestAction = UserHelpRequest.useCreate({
        organization: { connect: { id: organization?.id } },
    })

    const handleActivateBankingRequest = useCallback(async () => {
        if (!organization?.id || !user?.phone) return

        setLoading(true)
        try {
            await createHelpRequestAction({
                type: UserHelpRequestTypeType.ActivateBanking,
                phone: user.phone,
                email: user.email ?? null,
            })
            await refetchPendingRequest()
        } catch (error) {
            console.error('Failed to create help request:', error)
        } finally {
            setLoading(false)
        }
    }, [createHelpRequestAction, organization?.id, user?.phone, user?.email, refetchPendingRequest])

    // Don't show banner if organization already has ACTIVE_BANKING feature or no SBBOL auth
    const organizationFeatures: string[] = organization?.features || []
    const hasBankingFeature = organizationFeatures.includes('ACTIVE_BANKING')
    // if (!hasSbbolAuth || hasBankingFeature) {
    //     return null
    // }
    if (hasBankingFeature) {
        return null
    }

    return (
        <Card>
            <Space size={16} direction='vertical'>
                <Space size={8} direction='vertical'>
                    <Typography.Title level={4}>
                        {BannerTitle}
                    </Typography.Title>
                    <Typography.Text type='secondary'>
                        {BannerDescription}
                    </Typography.Text>
                </Space>
                <Space size={12} direction='horizontal'>
                    <LoginWithSBBOLButton checkTlsCert={true} />
                    <Button
                        type='secondary'
                        onClick={handleActivateBankingRequest}
                        loading={loading}
                        disabled={hasPendingRequest}
                    >
                        {hasPendingRequest ? RequestPendingMessage : RkoButtonLabel}
                    </Button>
                </Space>
            </Space>
        </Card>
    )
}
