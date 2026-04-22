import React, { useMemo } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Space, Typography } from '@open-condo/ui'

import { useAIContext } from '@condo/domains/ai/components/AIContext'
import { AIFlowButton } from '@condo/domains/ai/components/AIFlowButton'
import { UI_AI_CHAT_WITH_CONDO } from '@condo/domains/common/constants/featureflags'
import { UserMessagesList } from '@condo/domains/notification/components/UserMessagesList'
import { InlineOrganizationSelect } from '@condo/domains/organization/components/OrganizationSelect'
import { SBBOLIndicator } from '@condo/domains/organization/components/SBBOLIndicator'
import { SubscriptionDaysIndicator, UpgradePlanButton } from '@condo/domains/subscription/components'
import { useOrganizationSubscription } from '@condo/domains/subscription/hooks'
import { useLinkedCardsModal } from '@condo/domains/subscription/hooks/useLinkedCardsModal'
import { usePaymentHistoryModal } from '@condo/domains/subscription/hooks/usePaymentHistoryModal'
import { UserMenu } from '@condo/domains/user/components/UserMenu'


export interface ITopMenuItemsProps {
    headerAction?: React.ElementType
}

export const TopMenuItems: React.FC<ITopMenuItemsProps> = (props) => {
    const auth = useAuth()
    const intl = useIntl()
    const { organization } = useOrganization()
    const { hasSubscription } = useOrganizationSubscription()
    const { useFlag } = useFeatureFlags()
    const { isAIOverlayOpen, openAIOverlay, closeAIOverlay } = useAIContext()
    const isAIChatEnabled = useFlag(UI_AI_CHAT_WITH_CONDO)

    const PaymentHistoryLabel = intl.formatMessage({ id: 'subscription.paymentHistory.title' })
    const LinkedCardsLabel = intl.formatMessage({ id: 'subscription.linkedCards.title' })

    const { LinkedCardsModal, openModal: openLinkedCardsModal } = useLinkedCardsModal()
    const { PaymentHistoryModal, openModal: openPaymentHistoryModal, hasPaymentHistory } = usePaymentHistoryModal()

    const subscriptionMenuItems = useMemo(() => {
        if (!hasPaymentHistory) return []
        return [
            {
                key: 'paymentHistory',
                label: <Typography.Text size='medium' type='inherit'>{PaymentHistoryLabel}</Typography.Text>,
                onClick: openPaymentHistoryModal,
            },
            {
                key: 'linkedCards',
                label: <Typography.Text size='medium' type='inherit'>{LinkedCardsLabel}</Typography.Text>,
                onClick: openLinkedCardsModal,
            },
        ]
    }, [hasPaymentHistory, openPaymentHistoryModal, openLinkedCardsModal, PaymentHistoryLabel, LinkedCardsLabel])

    if (auth.isLoading) return null

    return (
        <>
            {LinkedCardsModal}
            {PaymentHistoryModal}
            {props.headerAction ? props.headerAction : null}
            <Space direction='horizontal' size={40} className='top-menu-items'>
                <UpgradePlanButton />
                <SubscriptionDaysIndicator />
                <Space size={12}>
                    <SBBOLIndicator organization={organization} />
                    <InlineOrganizationSelect />
                </Space>
                <UserMenu extraMenuItems={subscriptionMenuItems} />
                <div style={{ maxHeight: '24px' }}>
                    <UserMessagesList disabled={!hasSubscription} />
                </div>
                { isAIChatEnabled && !isAIOverlayOpen && <AIFlowButton onClick={openAIOverlay} /> }
            </Space>
        </>
    )
}
