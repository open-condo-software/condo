import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button, Modal, Typography } from '@open-condo/ui'

import { ACTIVE_BANKING_SUBSCRIPTION_PLAN_ID, DEFAULT_TRIAL_SUBSCRIPTION_PLAN_ID } from '@condo/domains/common/constants/featureflags'

import { OrganizationFeature } from '../../../schema'
import { useOrganizationSubscription } from '../hooks'

const { Paragraph } = Typography

interface ModalContent {
    title: string
    description: string
    buttonText: string
}

const STORAGE_KEY_PREFIX = 'subscription_welcome_modal_shown_'

/**
 * Hook that returns modal content based on subscription state
 * Returns null if no modal should be shown
 */
const useSubscriptionWelcomeModalContent = (): ModalContent | null => {
    const intl = useIntl()
    const { organization } = useOrganization()
    const { subscription } = useOrganizationSubscription()
    const { useFlagValue } = useFeatureFlags()
    
    const activeBankingPlanId = useFlagValue(ACTIVE_BANKING_SUBSCRIPTION_PLAN_ID)
    const defaultTrialPlanId = useFlagValue(DEFAULT_TRIAL_SUBSCRIPTION_PLAN_ID)

    return useMemo(() => {
        if (!organization || !subscription) {
            return null
        }

        const plan = subscription.subscriptionPlan
        const planId = plan?.id
        const planName = plan?.name || ''
        const endDate = subscription.endAt ? dayjs(subscription.endAt).format('DD.MM.YYYY') : null
        const hasActiveBanking = organization.features?.includes(OrganizationFeature.ActiveBanking)
        const isActiveBankingPlan = activeBankingPlanId && planId === activeBankingPlanId
        const isDefaultTrialPlan = defaultTrialPlanId && planId === defaultTrialPlanId

        // 1. Не триальный контекст с endAt (оплаченная подписка)
        if (!subscription.isTrial && subscription.endAt) {
            return {
                title: intl.formatMessage({ id: 'subscription.welcomeModal.paidPlan.title' }),
                description: intl.formatMessage(
                    { id: 'subscription.welcomeModal.paidPlan.description' },
                    { planName, endDate }
                ),
                buttonText: intl.formatMessage({ id: 'subscription.welcomeModal.learnMoreAboutPlans' }),
            }
        }

        // 2. Триал, но план не из фичафлагов (не banking и не default trial)
        if (subscription.isTrial && !isActiveBankingPlan && !isDefaultTrialPlan) {
            return {
                title: intl.formatMessage({ id: 'subscription.welcomeModal.trialAllFeatures.title' }),
                description: intl.formatMessage(
                    { id: 'subscription.welcomeModal.trialAllFeatures.description' },
                    { planName, endDate }
                ),
                buttonText: intl.formatMessage({ id: 'subscription.welcomeModal.learnMoreAboutPlans' }),
            }
        }

        // 3. Клиент Сбера с бессрочным доступом (endAt null + active_banking + activeBankingPlanId)
        if (!subscription.endAt && !subscription.isTrial && hasActiveBanking && isActiveBankingPlan) {
            return {
                title: intl.formatMessage({ id: 'subscription.welcomeModal.sberClient.title' }),
                description: intl.formatMessage(
                    { id: 'subscription.welcomeModal.sberClient.description' },
                    { planName }
                ),
                buttonText: intl.formatMessage({ id: 'subscription.welcomeModal.learnMoreAboutPlans' }),
            }
        }

        // 4. Триал на default trial план (показываем только если есть фичафлаг)
        if (subscription.isTrial && isDefaultTrialPlan) {
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
    }, [organization, subscription, intl, activeBankingPlanId, defaultTrialPlanId])
}

/**
 * Modal that shows subscription welcome information once per organization
 * Uses localStorage to track if modal was already shown for each organization
 */
export const SubscriptionWelcomeModal: React.FC = () => {
    const router = useRouter()
    const { organization } = useOrganization()
    const content = useSubscriptionWelcomeModalContent()
    const [isVisible, setIsVisible] = useState(false)

    const organizationId = organization?.id

    // Mark organization as "seen" in localStorage
    const markAsSeen = useCallback(() => {
        if (organizationId) {
            const storageKey = `${STORAGE_KEY_PREFIX}${organizationId}`
            localStorage.setItem(storageKey, 'true')
        }
    }, [organizationId])

    useEffect(() => {
        if (!organizationId) {
            return
        }

        const storageKey = `${STORAGE_KEY_PREFIX}${organizationId}`
        const wasShown = localStorage.getItem(storageKey)

        if (wasShown) {
            return
        }

        // Always mark as seen, even if no modal content
        markAsSeen()

        if (content) {
            setIsVisible(true)
        }
    }, [organizationId, content, markAsSeen])

    const handleClose = useCallback(() => {
        setIsVisible(false)
    }, [])

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
