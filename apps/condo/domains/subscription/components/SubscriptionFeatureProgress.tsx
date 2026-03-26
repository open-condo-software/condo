import { useGetAvailableSubscriptionPlansQuery, useGetOrganizationActivatedSubscriptionsQuery } from '@app/condo/gql'
import { Progress } from 'antd'
import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button, Space, Tooltip, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { CURRENCY_SYMBOLS } from '@condo/domains/common/constants/currencies'
import { SUBSCRIPTION_MODAL_CONFIG } from '@condo/domains/common/constants/featureflags'
import { analytics } from '@condo/domains/common/utils/analytics'
import { AVAILABLE_FEATURES, AvailableFeatureType } from '@condo/domains/subscription/constants/features'
import { useOrganizationSubscription } from '@condo/domains/subscription/hooks'
import { safeValidateSubscriptionFeatureModalConfig } from '@condo/domains/subscription/utils/subscriptionFeatureModal'

import { SubscriptionFeatureModal } from './SubscriptionFeatureModal'
import styles from './SubscriptionFeatureProgress.module.css'

const calculateTotalPossibleFeatures = (baseFeatures: readonly string[], b2bAppsCount: number): number => {
    const featuresWithoutCustomization = baseFeatures.filter(feature => feature !== 'customization')
    return featuresWithoutCustomization.length + b2bAppsCount * 0.5
}

export const SubscriptionFeatureProgress: React.FC = () => {
    const intl = useIntl()
    const TooltipTitle = intl.formatMessage({ id: 'subscription.featureProgress.tooltip' })
    const router = useRouter()
    const { organization } = useOrganization()
    const { isFeatureAvailable, isB2BAppEnabled } = useOrganizationSubscription()
    const { isCollapsed } = useLayoutContext()
    const [animatedPercentage, setAnimatedPercentage] = useState(0)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const isMountedRef = useRef(false)

    const { useFlagValue } = useFeatureFlags()
    const subscriptionModalConfig = useFlagValue(SUBSCRIPTION_MODAL_CONFIG)

    const { data: plansData } = useGetAvailableSubscriptionPlansQuery({
        variables: {
            organization: { id: organization?.id },
        },
        skip: !organization?.id,
    })

    const { data: activatedSubscriptionsData } = useGetOrganizationActivatedSubscriptionsQuery({
        variables: {
            organizationId: organization?.id || '',
        },
        skip: !organization?.id,
    })
    const activatedSubscriptions = useMemo(() => activatedSubscriptionsData?.activatedSubscriptions || [], [activatedSubscriptionsData?.activatedSubscriptions])

    const bestPlan = useMemo(() => {
        const availablePlans = plansData?.result?.plans || []
        return availablePlans
            .filter(p => {
                if (!p.plan.canBePromoted) return false
                return !activatedSubscriptions.find(s => dayjs(s.endAt).isAfter(dayjs()) && s.subscriptionPlan?.id === p.plan.id)
            })
            .sort((a, b) => (b.plan.priority ?? 0) - (a.plan.priority ?? 0))[0]
    }, [plansData?.result?.plans, activatedSubscriptions])

    const bestPlanB2BApps = useMemo(() => {
        if (!bestPlan) return []
        return bestPlan.plan.enabledB2BApps || []
    }, [bestPlan])

    const currencySymbol = useMemo(() => {
        const currencyCode = bestPlan?.prices?.[0]?.currencyCode
        return CURRENCY_SYMBOLS[currencyCode] || ''
    }, [bestPlan])

    const DescriptionText = intl.formatMessage({ id: 'subscription.featureProgress.description' }, { percentage: animatedPercentage })
    const TryButtonText = intl.formatMessage({ id: 'subscription.featureProgress.tryButton' }, { currency: currencySymbol })

    const featurePercentage = useMemo(() => {
        if (!organization || !bestPlan) return 0
        const baseFeatureCount = AVAILABLE_FEATURES.reduce((count, feature) => {
            if (feature === 'customization') return count
            const isCurrentlyAvailable = isFeatureAvailable(feature as AvailableFeatureType)

            return count + (isCurrentlyAvailable ? 1 : 0)
        }, 0)

        const b2bAppCount = bestPlanB2BApps.reduce((count, appId) => {
            return count + (isB2BAppEnabled(appId) ? 1 : 0)
        }, 0)

        const totalAvailable = baseFeatureCount + b2bAppCount * 0.5

        const totalPossible = calculateTotalPossibleFeatures(AVAILABLE_FEATURES, bestPlanB2BApps.length)

        if (totalPossible === 0) return 0

        return Math.round((totalAvailable / totalPossible) * 100)
    }, [organization, bestPlan, isFeatureAvailable, bestPlanB2BApps, isB2BAppEnabled])

    const validatedConfig = useMemo(() => {
        return safeValidateSubscriptionFeatureModalConfig(subscriptionModalConfig)
    }, [subscriptionModalConfig])

    const isConfigValid = validatedConfig !== null

    const openModal = useCallback(() => {
        if (!isConfigValid) return

        analytics.track('click', {
            component: 'Button',
            location: router.pathname,
            id: 'openModal',
            value: 'Open subscription feature modal',
        })

        setIsModalOpen(true)
    }, [isConfigValid, router.pathname])

    const closeModal = useCallback(() => {
        setIsModalOpen(false)
    }, [])

    useEffect(() => {
        if (!isMountedRef.current) {
            isMountedRef.current = true
        }

        let startTime: number | null = null
        let animationFrame: number
        const startValue = animatedPercentage

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp
            const progress = Math.min((timestamp - startTime) / 1500, 1)

            const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
            const currentValue = Math.round(startValue + easeOutCubic(progress) * (featurePercentage - startValue))

            setAnimatedPercentage(currentValue)

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate)
            }
        }

        if (featurePercentage !== animatedPercentage) {
            animationFrame = requestAnimationFrame(animate)
        }

        return () => {
            if (animationFrame) {
                cancelAnimationFrame(animationFrame)
            }
        }
    }, [animatedPercentage, featurePercentage])

    const handleClick = () => {
        router.push('/settings?tab=subscription')
    }

    if (!bestPlan) {
        return null
    }

    return (
        <Tooltip title={isCollapsed ? TooltipTitle : null} placement='right'>
            <div className={styles.container} onClick={handleClick}>
                {isCollapsed ? (
                    <Typography.Text type='inverted' size='small'>
                        {animatedPercentage}%
                    </Typography.Text>
                ) : (
                    <Space size={16} direction='vertical' className={styles.expandedContent}>
                        <Typography.Text size='small'>
                            {DescriptionText}
                        </Typography.Text>

                        <Progress
                            percent={animatedPercentage}
                            strokeColor={{
                                '0%': colors.green[5],
                                '100%': colors.blue[5],
                            }}
                            showInfo={false}
                        />
                        <Button
                            type='primary'
                            block
                            size='medium'
                            onClick={openModal}
                            disabled={!isConfigValid}
                        >
                            {TryButtonText}
                        </Button>
                    </Space>
                )}
            </div>
            {isConfigValid && <SubscriptionFeatureModal
                open={isModalOpen}
                onCancel={closeModal}
                plan={bestPlan}
                subscriptionModalConfig={validatedConfig}
            />}
        </Tooltip>
    )
}
