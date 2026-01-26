import { useGetLastExpiredSubscriptionContextQuery, useCreateUserHelpRequestMutation, useGetPendingBankingRequestQuery } from '@app/condo/gql'
import { OrganizationFeature, UserHelpRequestTypeType } from '@app/condo/schema'
import { notification } from 'antd'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { Lock, Unlock } from '@open-condo/icons'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button, Modal, Typography, Space } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { LoginWithSBBOLButton } from '@condo/domains/common/components/LoginWithSBBOLButton'
import { SUBSCRIPTIONS, ACTIVE_BANKING_SUBSCRIPTION_PLAN_ID } from '@condo/domains/common/constants/featureflags'

import styles from './SubscriptionTrialEndedModal.module.css'

import { useOrganizationSubscription } from '../hooks'


const { publicRuntimeConfig: { hasSbbolAuth, subscriptionFeatureHelpLinks = {} } } = getConfig()

type ModalVariant = 'activeBanking' | 'nonActiveBanking'

interface FeatureItemProps {
    label: string
    available: boolean
    helpLink?: string
}

const FeatureItem: React.FC<FeatureItemProps> = ({ label, available, helpLink }) => {
    const icon = available ? <Unlock color={colors.green[5]} size='small' /> : <Lock color={colors.red[5]} size='small' />

    const textContent = helpLink && !available ? (
        <Typography.Link href={helpLink} target='_blank' rel='noopener noreferrer'>
            <Typography.Text size='medium' type='secondary'>{label}</Typography.Text>
        </Typography.Link>
    ) : (
        <Typography.Text size='medium' type='secondary'>{label}</Typography.Text>
    )

    return (
        <Space size={8} direction='horizontal' align='center'>
            {icon}
            {textContent}
        </Space>
    )
}

interface ModalContent {
    title: string
    description: string
    variant: ModalVariant
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

const ACTIVE_BANKING_PAID_FEATURES_FIRST_COLUMN = [
    { featureKey: 'support', label: 'subscription.features.personalManager' },
    { featureKey: 'news', label: 'subscription.features.news' },
    { featureKey: 'marketplace', label: 'subscription.features.marketplace' },
]

const ACTIVE_BANKING_PAID_FEATURES_SECOND_COLUMN = [
    { featureKey: 'passes', label: 'subscription.features.passes' },
    { featureKey: 'ai', label: 'subscription.features.ai' },
]

const NON_ACTIVE_BANKING_FREE_FEATURES_FIRST_COLUMN = [
    { featureKey: 'payments', label: 'subscription.features.payments' },
    { label: 'subscription.features.residents' },
]

const NON_ACTIVE_BANKING_FREE_FEATURES_SECOND_COLUMN = [
    { featureKey: 'tickets', label: 'subscription.features.tickets' },
    { featureKey: 'meters', label: 'subscription.features.meters' },
]

const useTrialEndedModalContent = (): { content: ModalContent | null, type: ModalType | null, loading: boolean } => {
    const intl = useIntl()
    const { organization } = useOrganization()
    const { subscriptionContext } = useOrganizationSubscription()
    const { useFlag, useFlagValue } = useFeatureFlags()
    const hasSubscriptionsFlag = useFlag(SUBSCRIPTIONS)
    const activeBankingPlanId = useFlagValue(ACTIVE_BANKING_SUBSCRIPTION_PLAN_ID)

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

        const trialEndedShown = isModalShownForOrganization(TRIAL_ENDED_STORAGE_KEY, organizationId)
        const subscriptionEndedShown = isModalShownForOrganization(SUBSCRIPTION_ENDED_STORAGE_KEY, organizationId)

        const lastExpiredContext = expiredData?.lastExpiredContext?.[0]
        if (!lastExpiredContext) {
            return { content: null, type: null, loading }
        }

        const lastExpiredWasTrial = lastExpiredContext.isTrial === true
        const lastExpiredPlanId = lastExpiredContext.subscriptionPlan?.id

        const currentPlanId = subscriptionContext?.subscriptionPlan?.id
        const hasActiveBanking = organization?.features?.includes(OrganizationFeature.ActiveBanking)
        const currentIsActiveBankingPlan = activeBankingPlanId && currentPlanId === activeBankingPlanId
        const lastExpiredWasNotActiveBankingPlan = !activeBankingPlanId || lastExpiredPlanId !== activeBankingPlanId

        let variant: ModalVariant
        if (hasActiveBanking && currentIsActiveBankingPlan && lastExpiredWasNotActiveBankingPlan) {
            variant = 'activeBanking'
        } else if (!subscriptionContext) {
            variant = 'nonActiveBanking'
        } else {
            return { content: null, type: null, loading }
        }

        const titleKey = lastExpiredWasTrial ? 'subscription.trialEndedModal.trial.title' : 'subscription.trialEndedModal.paid.title'
        const title = intl.formatMessage({ id: titleKey })
        const description = intl.formatMessage({ id: `subscription.trialEndedModal.${variant}.description` })

        const modalType: ModalType = lastExpiredWasTrial ? 'trialEnded' : 'subscriptionEnded'
        const modalShown = modalType === 'trialEnded' ? trialEndedShown : subscriptionEndedShown

        if (modalShown) {
            return { content: null, type: null, loading }
        }

        return {
            content: {
                title,
                description,
                variant,
            },
            type: modalType,
            loading,
        }
    }, [organization, loading, hasSubscriptionsFlag, organizationId, expiredData?.lastExpiredContext, subscriptionContext, intl, activeBankingPlanId])
}

/**
 * Modal that shows when trial or subscription ends
 * Shown once per organization
 */
export const SubscriptionTrialEndedModal: React.FC = () => {
    const intl = useIntl()
    const router = useRouter()
    const { user } = useAuth()
    const { organization } = useOrganization()
    const { content, type, loading } = useTrialEndedModalContent()
    const [isVisible, setIsVisible] = useState(false)
    const [bankingLoading, setBankingLoading] = useState(false)

    const organizationId = organization?.id

    const {
        data: pendingRequestData,
        refetch: refetchPendingRequest,
    } = useGetPendingBankingRequestQuery({
        variables: { organizationId: organizationId },
        skip: !organizationId || content?.variant !== 'nonActiveBanking',
    })

    const hasPendingRequest = (pendingRequestData?.pendingBankingRequest?.length ?? 0) > 0

    const [createUserHelpRequest] = useCreateUserHelpRequestMutation()

    const RequestPendingMessage = intl.formatMessage({ id: 'subscription.promoBanner.requestPending' })
    const ActivateButtonLabel = intl.formatMessage({ id: 'subscription.promoBanner.activateButton' })
    const RequestSentMessage = intl.formatMessage({ id: 'subscription.promoBanner.requestSent' })
    const RequestSentDescription = intl.formatMessage({ id: 'subscription.promoBanner.requestSentDescription' })
    const ServerErrorMessage = intl.formatMessage({ id: 'global.errors.serverError.title' })

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

    const handleSubscriptionButtonClick = useCallback(() => {
        handleClose()
        router.push('/settings?tab=subscription')
    }, [handleClose, router])

    const handleActivateBankingRequest = useCallback(async () => {
        if (!organizationId || !user?.phone) return

        setBankingLoading(true)
        try {
            await createUserHelpRequest({
                variables: {
                    data: {
                        type: UserHelpRequestTypeType.ActivateBanking,
                        organization: { connect: { id: organizationId } },
                        phone: user.phone,
                        email: user.email ?? null,
                        dv: 1,
                        sender: getClientSideSenderInfo(),
                    },
                },
            })
            await refetchPendingRequest()
            handleClose()
            notification.success({
                message: (
                    <Typography.Text strong size='large'>
                        {RequestSentMessage}
                    </Typography.Text>
                ),
                description: RequestSentDescription,
                duration: 5,
            })
        } catch (error) {
            console.error('Failed to create help request:', error)
            notification.error({
                message: ServerErrorMessage,
                duration: 5,
            })
        } finally {
            setBankingLoading(false)
        }
    }, [organizationId, user?.phone, user?.email, createUserHelpRequest, refetchPendingRequest, RequestSentMessage, RequestSentDescription, handleClose, ServerErrorMessage])

    if (!content || !isVisible) {
        return null
    }

    const featuresTitle = intl.formatMessage({ id: `subscription.trialEndedModal.${content.variant}.featuresTitle` })

    const renderFeaturesList = () => {
        const isActiveBanking = content.variant === 'activeBanking'
        const firstColumn = isActiveBanking 
            ? ACTIVE_BANKING_PAID_FEATURES_FIRST_COLUMN 
            : NON_ACTIVE_BANKING_FREE_FEATURES_FIRST_COLUMN
        const secondColumn = isActiveBanking 
            ? ACTIVE_BANKING_PAID_FEATURES_SECOND_COLUMN 
            : NON_ACTIVE_BANKING_FREE_FEATURES_SECOND_COLUMN
        const available = !isActiveBanking

        return (
            <Space
                direction='vertical'
                size={20}
                width='100%'
                className={styles.featuresBlock}
            >
                <Typography.Title level={4}>
                    {featuresTitle}
                </Typography.Title>
                <Space size={20} direction='horizontal' width='100%' align='start'>
                    <Space size={8} direction='vertical' align='start'>
                        {firstColumn.map((feature) => (
                            <FeatureItem
                                key={feature.featureKey || feature.label}
                                label={intl.formatMessage({ id: feature.label as FormatjsIntl.Message['ids'] })}
                                available={available}
                                helpLink={feature.featureKey ? subscriptionFeatureHelpLinks[feature.featureKey] : undefined}
                            />
                        ))}
                    </Space>
                    <Space size={8} direction='vertical' align='start'>
                        {secondColumn.map((feature) => (
                            <FeatureItem
                                key={feature.featureKey || feature.label}
                                label={intl.formatMessage({ id: feature.label as FormatjsIntl.Message['ids'] })}
                                available={available}
                                helpLink={feature.featureKey ? subscriptionFeatureHelpLinks[feature.featureKey] : undefined}
                            />
                        ))}
                    </Space>
                </Space>
            </Space>
        )
    }

    const renderFooter = () => {
        if (content.variant === 'activeBanking') {
            const buttonText = intl.formatMessage({ id: 'subscription.trialEndedModal.activeBanking.button' })
            return [
                <Button key='action' type='primary' onClick={handleSubscriptionButtonClick}>
                    {buttonText}
                </Button>,
            ]
        }

        if (!hasSbbolAuth) {
            return [
                <Button key='action' type='primary' onClick={handleSubscriptionButtonClick}>
                    {intl.formatMessage({ id: 'subscription.trialEndedModal.activeBanking.button' })}
                </Button>,
            ]
        }

        return [
            <div key='footer' className={styles.footerButtons}>
                <LoginWithSBBOLButton checkTlsCert />
                <Button
                    type='primary'
                    onClick={handleActivateBankingRequest}
                    loading={bankingLoading}
                    disabled={hasPendingRequest}
                >
                    {hasPendingRequest ? RequestPendingMessage : ActivateButtonLabel}
                </Button>
            </div>,
        ]
    }

    return (
        <Modal
            open={isVisible}
            title={content.title}
            onCancel={handleClose}
            footer={renderFooter()}
        >
            <Space direction='vertical' size={40}>
                <Typography.Paragraph>
                    {content.description}
                </Typography.Paragraph>
                {renderFeaturesList()}
            </Space>
        </Modal>
    )
}
