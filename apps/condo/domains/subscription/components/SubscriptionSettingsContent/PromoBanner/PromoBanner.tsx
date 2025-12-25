import { useGetPendingBankingRequestQuery } from '@app/condo/gql'
import { OrganizationFeature, UserHelpRequestTypeType } from '@app/condo/schema'
import getConfig from 'next/config'
import React, { useCallback, useState } from 'react'

import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Typography, Space, Button } from '@open-condo/ui'

import { LoginWithSBBOLButton } from '@condo/domains/common/components/LoginWithSBBOLButton'
import { UserHelpRequest } from '@condo/domains/onboarding/utils/clientSchema'

import styles from './PromoBanner.module.css'


const { publicRuntimeConfig: { hasSbbolAuth } } = getConfig()

export const PromoBanner: React.FC = () => {
    const intl = useIntl()
    const { user } = useAuth()
    const { organization } = useOrganization()

    const BannerTitle = intl.formatMessage({ id: 'subscription.promoBanner.title' })
    const BannerDescription = intl.formatMessage({ id: 'subscription.promoBanner.description' })
    const ActivateButtonLabel = intl.formatMessage({ id: 'subscription.promoBanner.activateButton' })
    const RequestPendingMessage = intl.formatMessage({ id: 'subscription.promoBanner.requestPending' })

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

    const hasBankingFeature = organization?.features?.includes(OrganizationFeature.ActiveBanking)
    if (hasBankingFeature && !hasSbbolAuth) return null

    return (
        <div className={styles.bannerWrapper}>
            <div className={styles.bannerCard}>
                <Space size={16} direction='vertical' className={styles.bannerContent}>
                    <Typography.Title level={4}>
                        {BannerTitle}
                    </Typography.Title>
                    <Typography.Text type='secondary' size='medium'>
                        {BannerDescription}
                    </Typography.Text>
                    <Space size={12} direction='horizontal'>
                        <LoginWithSBBOLButton checkTlsCert className={styles.greenButton} />
                        <Button
                            type='primary'
                            onClick={handleActivateBankingRequest}
                            loading={loading}
                            disabled={hasPendingRequest}
                        >
                            {hasPendingRequest ? RequestPendingMessage : ActivateButtonLabel}
                        </Button>
                    </Space>
                </Space>
                <div className={styles.imageWrapper}>
                    <img src='/global-hints/subscriptions/greenTick.png' alt='Bank logo' />
                </div>
            </div>
        </div>
    )
}
