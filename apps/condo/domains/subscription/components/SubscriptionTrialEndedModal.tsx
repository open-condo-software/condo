import { useGetLastExpiredSubscriptionContextQuery } from '@app/condo/gql'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button, Modal, Typography } from '@open-condo/ui'

import { useOrganizationSubscription } from '../hooks'

const { Paragraph } = Typography

interface ModalContent {
    title: string
    description: string
    buttonText: string
}

const TRIAL_ENDED_STORAGE_KEY = 'subscription_trial_ended_modal_shown'
const SUBSCRIPTION_ENDED_STORAGE_KEY = 'subscription_ended_modal_shown'

type ModalType = 'trialEnded' | 'subscriptionEnded'

const useTrialEndedModalContent = (): { content: ModalContent | null, type: ModalType | null, loading: boolean } => {
    const intl = useIntl()
    const { organization } = useOrganization()
    const { subscriptionContext } = useOrganizationSubscription()

    const organizationId = organization?.id
    const now = useMemo(() => new Date().toISOString(), [])

    // Query for last expired subscription context (including trials)
    const { data: expiredData, loading } = useGetLastExpiredSubscriptionContextQuery({
        variables: {
            organizationId: organizationId || '',
            now,
        },
        skip: !organizationId,
    })

    return useMemo(() => {
        if (!organization || loading) {
            return { content: null, type: null, loading }
        }

        const trialEndedStored = typeof window !== 'undefined' ? localStorage.getItem(TRIAL_ENDED_STORAGE_KEY) : null
        const trialEndedOrgs = trialEndedStored ? JSON.parse(trialEndedStored) : {}
        const trialEndedShown = trialEndedOrgs[organizationId]

        const subscriptionEndedStored = typeof window !== 'undefined' ? localStorage.getItem(SUBSCRIPTION_ENDED_STORAGE_KEY) : null
        const subscriptionEndedOrgs = subscriptionEndedStored ? JSON.parse(subscriptionEndedStored) : {}
        const subscriptionEndedShown = subscriptionEndedOrgs[organizationId]

        const lastExpiredContext = expiredData?.lastExpiredContext?.[0]
        const lastExpiredWasTrial = lastExpiredContext?.isTrial === true

        // Case 1: Trial ended
        if (lastExpiredWasTrial && !trialEndedShown) {
            // 1.1: Trial ended but has current subscription
            if (subscriptionContext) {
                const planName = subscriptionContext.subscriptionPlan?.name || ''
                return {
                    content: {
                        title: intl.formatMessage({ id: 'subscription.trialEndedModal.hasSubscription.title' }),
                        description: intl.formatMessage(
                            { id: 'subscription.trialEndedModal.hasSubscription.description' },
                            { planName }
                        ),
                        buttonText: intl.formatMessage({ id: 'subscription.welcomeModal.learnMoreAboutPlans' }),
                    },
                    type: 'trialEnded' as ModalType,
                    loading,
                }
            }

            // 1.2: Trial ended and no current subscription
            return {
                content: {
                    title: intl.formatMessage({ id: 'subscription.trialEndedModal.noSubscription.title' }),
                    description: intl.formatMessage({ id: 'subscription.trialEndedModal.noSubscription.description' }),
                    buttonText: intl.formatMessage({ id: 'subscription.welcomeModal.learnMoreAboutPlans' }),
                },
                type: 'trialEnded' as ModalType,
                loading,
            }
        }

        // Case 2: No subscription AND (last expired was not trial OR trial modal already shown)
        if (!subscriptionContext && !subscriptionEndedShown && (!lastExpiredWasTrial || trialEndedShown)) {
            return {
                content: {
                    title: intl.formatMessage({ id: 'subscription.subscriptionEndedModal.title' }),
                    description: intl.formatMessage({ id: 'subscription.subscriptionEndedModal.description' }),
                    buttonText: intl.formatMessage({ id: 'subscription.welcomeModal.learnMoreAboutPlans' }),
                },
                type: 'subscriptionEnded' as ModalType,
                loading,
            }
        }

        return { content: null, type: null, loading }
    }, [organization, organizationId, subscriptionContext, expiredData, loading, intl])
}

/**
 * Modal that shows when trial or subscription ends
 * Shown once per organization
 */
export const SubscriptionTrialEndedModal: React.FC = () => {
    const router = useRouter()
    const { organization } = useOrganization()
    const { content, type, loading } = useTrialEndedModalContent()
    const [isVisible, setIsVisible] = useState(false)

    const organizationId = organization?.id

    useEffect(() => {
        if (!organizationId || !content || !type || loading) {
            return
        }

        setIsVisible(true)
    }, [organizationId, content, type, loading])

    const handleClose = useCallback(() => {
        if (!organizationId || !type) {
            setIsVisible(false)
            return
        }

        // Save correct localStorage key based on modal type
        if (type === 'trialEnded') {
            const stored = localStorage.getItem(TRIAL_ENDED_STORAGE_KEY)
            const shownOrgs = stored ? JSON.parse(stored) : {}
            shownOrgs[organizationId] = true
            localStorage.setItem(TRIAL_ENDED_STORAGE_KEY, JSON.stringify(shownOrgs))
        } else if (type === 'subscriptionEnded') {
            const stored = localStorage.getItem(SUBSCRIPTION_ENDED_STORAGE_KEY)
            const shownOrgs = stored ? JSON.parse(stored) : {}
            shownOrgs[organizationId] = true
            localStorage.setItem(SUBSCRIPTION_ENDED_STORAGE_KEY, JSON.stringify(shownOrgs))
        }
        setIsVisible(false)
    }, [organizationId, type])

    const handleButtonClick = useCallback(() => {
        handleClose()
        router.push('/settings?tab=subscription')
    }, [handleClose, router])

    if (!content || !isVisible) {
        return null
    }

    return (
        <Modal
            open={isVisible}
            title={content.title}
            onCancel={handleClose}
            footer={[
                <Button key='action' type='primary' onClick={handleButtonClick}>
                    {content.buttonText}
                </Button>,
            ]}
        >
            <Paragraph>
                {content.description}
            </Paragraph>
        </Modal>
    )
}
