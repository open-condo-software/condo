import { OrganizationFeature } from '@app/condo/schema'
import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button, Modal, Typography } from '@open-condo/ui'

import { ACTIVE_BANKING_SUBSCRIPTION_PLAN_ID, DEFAULT_TRIAL_SUBSCRIPTION_PLAN_ID } from '@condo/domains/common/constants/featureflags'
import { useOrganizationSubscription } from '@condo/domains/subscription/hooks'

const { Paragraph } = Typography

interface ModalContent {
    title: string
    description: string
    buttonText: string
}

const STORAGE_KEY = 'subscription_welcome_modal_shown'

/**
 * Hook that returns modal content based on subscription state
 * Returns null if no modal should be shown
 */
const useSubscriptionWelcomeModalContent = (): { content: ModalContent | null, loading: boolean } => {
    const intl = useIntl()
    const { organization, isLoading: organizationLoading } = useOrganization()
    const { subscriptionContext, loading: subscriptionLoading } = useOrganizationSubscription()
    const { useFlagValue } = useFeatureFlags()
    
    const activeBankingPlanId = useFlagValue(ACTIVE_BANKING_SUBSCRIPTION_PLAN_ID)
    const defaultTrialPlanId = useFlagValue(DEFAULT_TRIAL_SUBSCRIPTION_PLAN_ID)

    const loading = organizationLoading || subscriptionLoading

    const content = useMemo(() => {
        if (!organization || !subscriptionContext) {
            return null
        }

        const plan = subscriptionContext.subscriptionPlan
        const planId = plan?.id
        const planName = plan?.name || ''
        const endDate = subscriptionContext.endAt ? dayjs(subscriptionContext.endAt).format('DD.MM.YYYY') : null
        const hasActiveBankingFeature = organization.features?.includes(OrganizationFeature.ActiveBanking)
        const hasHighRevenueCustomerFeature = organization.features?.includes(OrganizationFeature.HighRevenueCustomer)
        const isActiveBankingPlan = activeBankingPlanId && planId === activeBankingPlanId
        const isDefaultTrialPlan = defaultTrialPlanId && planId === defaultTrialPlanId

        if (hasHighRevenueCustomerFeature) {
            return {
                title: intl.formatMessage({ id: 'subscription.welcomeModal.highRevenueCustomer.title' }),
                description: intl.formatMessage(
                    { id: 'subscription.welcomeModal.highRevenueCustomer.description' },
                    { planName }
                ),
                buttonText: intl.formatMessage({ id: 'subscription.welcomeModal.learnMoreAboutPlans' }),
            }
        }

        if (!subscriptionContext.isTrial && !(hasActiveBankingFeature && isActiveBankingPlan)) {
            return {
                title: intl.formatMessage({ id: 'subscription.welcomeModal.paidPlan.title' }),
                description: intl.formatMessage(
                    { id: 'subscription.welcomeModal.paidPlan.description' },
                    { planName, endDate }
                ),
                buttonText: intl.formatMessage({ id: 'subscription.welcomeModal.learnMoreAboutPlans' }),
            }
        }

        if (subscriptionContext.isTrial && !isActiveBankingPlan && !isDefaultTrialPlan) {
            return {
                title: intl.formatMessage({ id: 'subscription.welcomeModal.trialAllFeatures.title' }),
                description: intl.formatMessage(
                    { id: 'subscription.welcomeModal.trialAllFeatures.description' },
                    { planName, endDate }
                ),
                buttonText: intl.formatMessage({ id: 'subscription.welcomeModal.learnMoreAboutPlans' }),
            }
        }

        if (!subscriptionContext.isTrial && hasActiveBankingFeature && isActiveBankingPlan) {
            return {
                title: intl.formatMessage({ id: 'subscription.welcomeModal.activeBanking.title' }),
                description: intl.formatMessage(
                    { id: 'subscription.welcomeModal.activeBanking.description' },
                    { planName }
                ),
                buttonText: intl.formatMessage({ id: 'subscription.welcomeModal.learnMoreAboutPlans' }),
            }
        }

        if (subscriptionContext.isTrial && isDefaultTrialPlan) {
            return {
                title: intl.formatMessage({ id: 'subscription.welcomeModal.trialBasic.title' }),
                description: intl.formatMessage(
                    { id: 'subscription.welcomeModal.trialBasic.description' },
                    { planName, endDate }
                ),
                buttonText: intl.formatMessage({ id: 'subscription.welcomeModal.learnMoreAboutPlans' }),
            }
        }

        return null
    }, [organization, subscriptionContext, intl, activeBankingPlanId, defaultTrialPlanId])

    return { content, loading }
}

/**
 * Modal that shows subscription welcome information once per organization
 * Uses localStorage to track if modal was already shown for each organization
 */
export const SubscriptionWelcomeModal: React.FC = () => {
    const router = useRouter()
    const { organization } = useOrganization()
    const { content, loading } = useSubscriptionWelcomeModalContent()
    const [isVisible, setIsVisible] = useState(false)

    const organizationId = organization?.id

    const markAsSeen = useCallback(() => {
        if (!organizationId) return

        const stored = localStorage.getItem(STORAGE_KEY)
        const shownOrgs = stored ? JSON.parse(stored) : {}
        shownOrgs[organizationId] = true
        localStorage.setItem(STORAGE_KEY, JSON.stringify(shownOrgs))
    }, [organizationId])

    useEffect(() => {
        if (!organizationId || loading) {
            return
        }

        const stored = localStorage.getItem(STORAGE_KEY)
        const shownOrgs = stored ? JSON.parse(stored) : {}
        const wasShown = shownOrgs[organizationId]

        if (wasShown) {
            return
        }

        if (content) {
            setIsVisible(true)
        }
    }, [organizationId, content, loading])

    const handleClose = useCallback(() => {
        markAsSeen()
        setIsVisible(false)
    }, [markAsSeen])

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
