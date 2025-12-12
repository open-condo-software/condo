import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import React, { useEffect, useMemo, useState } from 'react'


import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button, Modal, Typography } from '@open-condo/ui'

import { OrganizationFeature, SubscriptionContext } from '../../../schema'
import { useOrganizationSubscription } from '../hooks'

const { Paragraph } = Typography

interface ModalContent {
    title: string
    description: string
    showButton?: boolean
    buttonText?: string
}


const getPlanAllFeaturesEnabled = (subscription: SubscriptionContext): boolean => {
    if (!subscription?.subscriptionPlan) return null
    
    const plan = subscription.subscriptionPlan
    return plan.news && plan.marketplace && plan.support && plan.ai && plan.passTickets
}

/**
 * Hook that returns modal content based on organization data
 */
const useOrganizationModalContent = (): ModalContent | null => {
    const intl = useIntl()
    const { organization } = useOrganization()
    const { subscription } = useOrganizationSubscription()

    return useMemo(() => {
        if (!organization) {
            return null
        }

        const havaActiveBanking = organization.features.includes(OrganizationFeature.ActiveBanking)
        const havaHighRevenueCustomer = organization.features.includes(OrganizationFeature.HighRevenueCustomer)

        // Определяем тип тарифа по галочкам в SubscriptionPlan
        const allFeaturesEnabled = getPlanAllFeaturesEnabled(subscription)
        
        const endDate = subscription?.endAt ? dayjs(subscription.endAt).format('DD.MM.YYYY') : null
        
        // 1. Клиент Сбербанка с бонусом на 12 дней тарифа "Лучший"
        const isSberClientWithBonus = subscription && havaActiveBanking && allFeaturesEnabled
        if (isSberClientWithBonus) {
            return {
                title: intl.formatMessage({ 
                    id: 'subscription.modal.sberClient.title',
                }),
                description: intl.formatMessage({ 
                    id: 'subscription.modal.sberClient.description',
                }),
                showButton: true,
                buttonText: intl.formatMessage({ 
                    id: 'subscription.modal.learnMoreAboutPlans',
                }),
            }
        }

        // 2. Бонус за лояльность - тариф "Лучший" за платежи > 15000₽
        const hasLoyaltyBonus = subscription && !subscription.isTrial && havaHighRevenueCustomer && allFeaturesEnabled
        if (hasLoyaltyBonus) {
            return {
                title: intl.formatMessage({ 
                    id: 'subscription.modal.loyaltyBest.title',
                }),
                description: intl.formatMessage({ 
                    id: 'subscription.modal.loyaltyBest.description',
                }, { endDate }),
                showButton: false,
            }
        }

        // 3. Пробный период "Базовый" на 7 дней
        const hasTrialBasic = subscription && subscription.isTrial && !allFeaturesEnabled
        if (hasTrialBasic) {
            return {
                title: intl.formatMessage({ 
                    id: 'subscription.modal.trialBasic.title',
                }),
                description: intl.formatMessage({ 
                    id: 'subscription.modal.trialBasic.description',
                }),
                showButton: true,
                buttonText: intl.formatMessage({ 
                    id: 'subscription.modal.learnMoreAboutPlans',
                }),
            }
        }

        // 4. Пробный период "Лучший" на 30 дней
        const hasTrialBest = subscription && subscription.isTrial && allFeaturesEnabled
        if (hasTrialBest) {
            return {
                title: intl.formatMessage({ 
                    id: 'subscription.modal.trialBest.title',
                }),
                description: intl.formatMessage({ 
                    id: 'subscription.modal.trialBest.description',
                }),
                showButton: true,
                buttonText: intl.formatMessage({ 
                    id: 'subscription.modal.learnMoreAboutPlans',
                }),
            }
        }

        // 5. Оплаченный тариф "Базовый"
        const hasPaidBasicPlan = subscription && !subscription.isTrial && !allFeaturesEnabled
        if (hasPaidBasicPlan) {
            return {
                title: intl.formatMessage({ 
                    id: 'subscription.modal.paidBasic.title',
                }),
                description: intl.formatMessage({ 
                    id: 'subscription.modal.paidBasic.description',
                }, { endDate }),
                showButton: false,
            }
        }

        // 6. Оплаченный тариф "Лучший" (активная подписка)
        const hasPaidBestActive = subscription && !subscription.isTrial && allFeaturesEnabled
        if (hasPaidBestActive) {
            return {
                title: intl.formatMessage({ 
                    id: 'subscription.modal.paidBestActive.title',
                }),
                description: intl.formatMessage({ 
                    id: 'subscription.modal.paidBestActive.description',
                }, { endDate }),
                showButton: false,
            }
        }

        return null
    }, [organization, intl, subscription])
}

const STORAGE_KEY_PREFIX = 'organization_modal_shown_'

/**
 * Modal that shows organization-specific information once per organization
 * Uses localStorage to track if modal was already shown
 */
export const OrganizationInfoModal: React.FC = () => {
    const router = useRouter()
    const content = useOrganizationModalContent()
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        if (!content) {
            return
        }

        const storageKey = `${STORAGE_KEY_PREFIX}`
        const wasShown = localStorage.getItem(storageKey)

        if (!wasShown) {
            setIsVisible(true)
        }
    }, [content])

    const handleClose = () => {
        const storageKey = `${STORAGE_KEY_PREFIX}`
        localStorage.setItem(storageKey, 'true')
        
        setIsVisible(false)
    }

    const handleButtonClick = () => {
        handleClose()
        router.push('/subscription')
    }

    if (!content || !isVisible) {
        return null
    }

    return (
        <Modal
            open={isVisible}
            title={content.title}
            onCancel={handleClose}
            footer={[
                ...(content.showButton ? [
                    <Button key='action' type='primary' onClick={handleButtonClick}>
                        {content.buttonText}
                    </Button>,
                ] : []),
            ]}
        >
            <Paragraph>
                {content.description}
            </Paragraph>
        </Modal>
    )
}
