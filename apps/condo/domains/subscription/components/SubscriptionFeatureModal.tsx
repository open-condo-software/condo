import { AvailableSubscriptionPlan } from '@app/condo/schema'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Banner, Button, Modal, Space, Typography } from '@open-condo/ui'

import { SETTINGS_TAB_SUBSCRIPTION } from '@condo/domains/common/constants/settingsTabs'
import { useActivateSubscriptions, useTrialSubscriptions } from '@condo/domains/subscription/hooks'

import styles from './SubscriptionFeatureModal.module.css'

interface SubscriptionFeature {
    key: string
    iconUrl: string
    title: string
    description: string
}

interface SubscriptionModalBanner {
    title: string
    description: string
    backgroundColor: string
    imageUrl: string
}

interface SubscriptionFeatureModalConfig {
    banner: SubscriptionModalBanner
    features: Array<SubscriptionFeature>
}

interface SubscriptionFeatureModalProps {
    open: boolean
    onCancel: () => void
    plan: AvailableSubscriptionPlan
    subscriptionModalConfig?: SubscriptionFeatureModalConfig
}

export const SubscriptionFeatureModal: React.FC<SubscriptionFeatureModalProps> = ({
    open,
    onCancel,
    plan,
    subscriptionModalConfig,
}) => {
    const intl = useIntl()
    const TryTrialButtonText =  intl.formatMessage({ id: 'subscription.featureProgress.modal.tryTrialButton' })
    const router = useRouter()
    const { handleActivatePlan, activateLoading } = useActivateSubscriptions()
    const { trialSubscriptions } = useTrialSubscriptions()
    const [isActivating, setIsActivating] = useState(false)

    const title = useMemo(() => {
        return intl.formatMessage({ id: 'subscription.featureProgress.modal.title' }, { planName: plan?.plan?.name || '' })
    }, [intl, plan?.plan?.name])

    const features = useMemo(() => subscriptionModalConfig?.features, [subscriptionModalConfig?.features])

    const hasActivatedAnyTrial = trialSubscriptions.length > 0
    const viewPlansButtonText = intl.formatMessage({
        id: 'subscription.warns.activateSubscriptionButton',
    })

    const handleActivateTrial = useCallback(async () => {
        const price = plan.prices?.[0]

        setIsActivating(true)
        try {
            const planName = plan.plan?.name

            await handleActivatePlan({
                priceId: price.id,
                isTrial: true,
                planName,
                trialDays: plan.plan?.trialDays || 0,
                isCustomPrice: false,
            })
            onCancel()
        } finally {
            setIsActivating(false)
        }
    }, [plan, handleActivatePlan, onCancel])

    const handleViewPlans = useCallback(async () => {
        await router.push(`/settings?tab=${SETTINGS_TAB_SUBSCRIPTION}`)
        onCancel()
    }, [router, onCancel])

    const isLoading = activateLoading || isActivating

    const modalFooter = useMemo(() => {
        if (hasActivatedAnyTrial) {
            return (
                <Button
                    id='viewPlansButton'
                    type='primary'
                    onClick={handleViewPlans}
                    loading={isLoading}
                    disabled={isLoading}
                >
                    {viewPlansButtonText}
                </Button>
            )
        }

        return (
            <Space size={12} direction='horizontal'>
                <Button
                    id='viewPlansButton'
                    type='secondary'
                    onClick={handleViewPlans}
                >
                    {viewPlansButtonText}
                </Button>
                <Button
                    id='activateTrialButton'
                    type='primary'
                    onClick={handleActivateTrial}
                    loading={isLoading}
                    disabled={isLoading}
                >
                    {TryTrialButtonText}
                </Button>
            </Space>
        )
    }, [hasActivatedAnyTrial, handleViewPlans, handleActivateTrial, viewPlansButtonText, TryTrialButtonText, isLoading])

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            width='big'
            title={title}
            footer={modalFooter}
            className={styles.modal}
        >
            {features?.length > 0 && (
                <>
                    <Banner
                        title={subscriptionModalConfig.banner.title}
                        invertText
                        subtitle={subscriptionModalConfig.banner.description}
                        backgroundColor={subscriptionModalConfig.banner.backgroundColor}
                        imgUrl={subscriptionModalConfig.banner.imageUrl}
                        size='medium'
                    />
                    <div className={styles.featuresGrid}>
                        {features?.map((feature) => (
                            <Space key={feature.key} direction='vertical' size={16}>
                                <Space direction='horizontal' size={8}>
                                    <img 
                                        src={feature.iconUrl} 
                                        alt={feature.title}
                                        className={styles.featureIcon}
                                    />
                                    <Typography.Text size='large' strong>{feature.title}</Typography.Text>
                                </Space>
                                <Typography.Text type='secondary' size='medium'>
                                    {feature.description}
                                </Typography.Text>
                            </Space>
                        ))}
                    </div>
                </>
            )}
        </Modal>
    )
}
