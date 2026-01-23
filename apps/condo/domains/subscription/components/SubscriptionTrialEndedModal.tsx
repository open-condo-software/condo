import { useGetLastExpiredSubscriptionContextQuery } from '@app/condo/gql'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button, Modal, Typography } from '@open-condo/ui'

import { SUBSCRIPTIONS } from '@condo/domains/common/constants/featureflags'

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

const MODAL_TYPE_TO_STORAGE_KEY: Record<ModalType, string> = {
    trialEnded: TRIAL_ENDED_STORAGE_KEY,
    subscriptionEnded: SUBSCRIPTION_ENDED_STORAGE_KEY,
}

const getShownOrgsFromStorage = (storageKey: string): Record<string, boolean> => {
    if (typeof window === 'undefined') {
        return {}
    }

    const stored = localStorage.getItem(storageKey)
    return stored ? JSON.parse(stored) : {}
}

const isModalShownForOrganization = (storageKey: string, organizationId: string): boolean => {
    const shownOrgs = getShownOrgsFromStorage(storageKey)
    return shownOrgs[organizationId] === true
}

const markModalAsShownForOrganization = (storageKey: string, organizationId: string): void => {
    const shownOrgs = getShownOrgsFromStorage(storageKey)
    shownOrgs[organizationId] = true
    localStorage.setItem(storageKey, JSON.stringify(shownOrgs))
}

const { publicRuntimeConfig: { enableSubscriptions } } = getConfig()

const useTrialEndedModalContent = (): { content: ModalContent | null, type: ModalType | null, loading: boolean } => {
    const intl = useIntl()
    const { organization } = useOrganization()
    const { subscriptionContext } = useOrganizationSubscription()
    const { useFlag } = useFeatureFlags()
    const hasSubscriptionsFlag = useFlag(SUBSCRIPTIONS)

    const organizationId = organization?.id
    const now = useMemo(() => new Date().toISOString(), [])

    const { data: expiredData, loading } = useGetLastExpiredSubscriptionContextQuery({
        variables: {
            organizationId: organizationId || '',
            now,
        },
        skip: !organizationId,
    })

    return useMemo(() => {
        if (!organization || loading || !enableSubscriptions || !hasSubscriptionsFlag) {
            return { content: null, type: null, loading }
        }

        const learnMoreButtonText = intl.formatMessage({ id: 'subscription.welcomeModal.learnMoreAboutPlans' })

        const trialEndedHasSubscriptionTitle = intl.formatMessage({ id: 'subscription.trialEndedModal.hasSubscription.title' })
        const trialEndedNoSubscriptionTitle = intl.formatMessage({ id: 'subscription.trialEndedModal.noSubscription.title' })
        const trialEndedNoSubscriptionDescription = intl.formatMessage({ id: 'subscription.trialEndedModal.noSubscription.description' })

        const subscriptionEndedTitle = intl.formatMessage({ id: 'subscription.subscriptionEndedModal.title' })
        const subscriptionEndedDescription = intl.formatMessage({ id: 'subscription.subscriptionEndedModal.description' })

        const getHasSubscriptionContent = (title: string, expiredPlanName: string): ModalContent => {
            const planName = subscriptionContext?.subscriptionPlan?.name || ''

            return {
                title,
                description: intl.formatMessage(
                    { id: 'subscription.trialEndedModal.hasSubscription.description' },
                    { planName, expiredPlanName }
                ),
                buttonText: learnMoreButtonText,
            }
        }

        const getNoSubscriptionContent = (title: string, description: string): ModalContent => {
            return {
                title,
                description,
                buttonText: learnMoreButtonText,
            }
        }

        const trialEndedShown = isModalShownForOrganization(TRIAL_ENDED_STORAGE_KEY, organizationId)
        const subscriptionEndedShown = isModalShownForOrganization(SUBSCRIPTION_ENDED_STORAGE_KEY, organizationId)

        const lastExpiredContext = expiredData?.lastExpiredContext?.[0]
        const lastExpiredWasTrial = lastExpiredContext?.isTrial === true
        const expiredPlanName = lastExpiredContext?.subscriptionPlan?.name || ''

        if (lastExpiredContext && lastExpiredWasTrial && !trialEndedShown) {
            if (subscriptionContext) {
                return {
                    content: {
                        ...getHasSubscriptionContent(trialEndedHasSubscriptionTitle, expiredPlanName),
                    },
                    type: 'trialEnded' as ModalType,
                    loading,
                }
            }

            return {
                content: {
                    ...getNoSubscriptionContent(
                        trialEndedNoSubscriptionTitle,
                        trialEndedNoSubscriptionDescription
                    ),
                },
                type: 'trialEnded' as ModalType,
                loading,
            }
        }

        if (lastExpiredContext && !lastExpiredWasTrial && !subscriptionEndedShown) {
            if (subscriptionContext) {
                return {
                    content: {
                        ...getHasSubscriptionContent(subscriptionEndedTitle, expiredPlanName),
                    },
                    type: 'subscriptionEnded' as ModalType,
                    loading,
                }
            }

            return {
                content: {
                    ...getNoSubscriptionContent(
                        subscriptionEndedTitle,
                        subscriptionEndedDescription
                    ),
                },
                type: 'subscriptionEnded' as ModalType,
                loading,
            }
        }

        return { content: null, type: null, loading }
    }, [organization, loading, hasSubscriptionsFlag, organizationId, expiredData?.lastExpiredContext, subscriptionContext, intl])
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
        const isWebview = document.querySelector('body.webview')
        if (isWebview || !organizationId || !content || !type || loading) {
            return
        }

        setIsVisible(true)
    }, [organizationId, content, type, loading])

    const handleClose = useCallback(() => {
        if (!organizationId || !type) {
            setIsVisible(false)
            return
        }

        const storageKey = MODAL_TYPE_TO_STORAGE_KEY[type]
        markModalAsShownForOrganization(storageKey, organizationId)
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
