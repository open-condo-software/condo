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
import { AvailableFeature, AvailableFeatureType } from '@condo/domains/subscription/constants/features'
import { useOrganizationSubscription } from '@condo/domains/subscription/hooks'
import { safeValidateSubscriptionFeatureModalConfig } from '@condo/domains/subscription/utils/subscriptionFeatureModal'

import { SubscriptionFeatureModal } from './SubscriptionFeatureModal'
import styles from './SubscriptionFeatureProgress.module.css'


export const SubscriptionFeatureProgress: React.FC = () => {
    const intl = useIntl()
    const router = useRouter()
    const { organization } = useOrganization()
    const { hasSubscription, isFeatureAvailable, isB2BAppEnabled } = useOrganizationSubscription()
    const { isCollapsed } = useLayoutContext()

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

    const featurePercentage = useMemo(() => {
        if (!organization || !bestPlan) return 0
        const baseFeatureCount = AvailableFeature.reduce((count, feature) => {
            const isAvailableInBestPlan = Boolean(bestPlan.plan[feature as keyof typeof bestPlan.plan])
            const isCurrentlyAvailable = isFeatureAvailable(feature as AvailableFeatureType)

            return count + (isAvailableInBestPlan && isCurrentlyAvailable ? 1 : 0)
        }, 0)


        const b2bAppCount = bestPlanB2BApps.reduce((count, appId) => {
            return count + (isB2BAppEnabled(appId) ? 1 : 0)
        }, 0)

        const totalAvailable = baseFeatureCount + b2bAppCount * 0.5

        const totalPossible = AvailableFeature.length - 1 + bestPlanB2BApps.length * 0.5

        if (totalPossible === 0) return 0

        return Math.round((totalAvailable / totalPossible) * 100)
    }, [organization, bestPlan, isFeatureAvailable, bestPlanB2BApps, isB2BAppEnabled])

    const [animatedPercentage, setAnimatedPercentage] = useState(0)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const isMountedRef = useRef(false)

    const { useFlagValue } = useFeatureFlags()
    const subscriptionModalConfig = useFlagValue(SUBSCRIPTION_MODAL_CONFIG)

    const validatedConfig = useMemo(() => {
        return safeValidateSubscriptionFeatureModalConfig(subscriptionModalConfig)
    }, [subscriptionModalConfig])

    const isConfigValid = validatedConfig !== null

    const openModal = useCallback(() => {
        if (!isConfigValid) return
        setIsModalOpen(true)
    }, [isConfigValid])

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

    const TooltipTitle = intl.formatMessage({ id: 'subscription.featureProgress.tooltip' })
    const DescriptionText = intl.formatMessage({ id: 'subscription.featureProgress.description' }, { percentage: animatedPercentage })
    const TryButtonText = intl.formatMessage({ id: 'subscription.featureProgress.tryButton' }, { currency: currencySymbol })

    const handleClick = () => {
        router.push('/settings?tab=subscription')
    }

    if (!hasSubscription || !bestPlan) {
        return null
    }

    return (
        <Tooltip title={isCollapsed ? TooltipTitle : null} placement='right'>
            <div className={styles.container} onClick={isCollapsed ? handleClick : undefined}>
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
            <SubscriptionFeatureModal
                open={isModalOpen}
                onCancel={closeModal}
                plan={bestPlan}
                subscriptionModalConfig={validatedConfig}
            />
        </Tooltip>
    )
}
