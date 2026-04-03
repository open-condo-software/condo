import { useGetAvailableServiceSubscriptionPlansQuery, useGetSubscriptionContextByIdQuery } from '@app/condo/gql'
import Progress from 'antd/lib/progress'
import getConfig from 'next/config'
import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button, Space, Tooltip, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { AVAILABLE_FEATURES, AvailableFeatureType } from '@condo/domains/subscription/constants/features'
import { useOrganizationSubscription, useTrialSubscriptions } from '@condo/domains/subscription/hooks'

import { SubscriptionFeatureModal } from './SubscriptionFeatureModal'
import styles from './SubscriptionFeatureProgress.module.css'

const EXCLUDED_FROM_CALCULATION_FEATURES: Array<AvailableFeatureType> = ['customization'] as const

const calculateTotalPossibleFeatures = (baseFeatures: Readonly<Array<AvailableFeatureType>>, b2bAppsCount: number): number => {
    const featuresWithoutExcluded = baseFeatures.filter(feature => !EXCLUDED_FROM_CALCULATION_FEATURES.includes(feature))
    return featuresWithoutExcluded.length + b2bAppsCount * 0.5
}

const isFeatureExcludedFromCalculation = (feature: AvailableFeatureType): boolean => {
    return EXCLUDED_FROM_CALCULATION_FEATURES.includes(feature)
}

export const SubscriptionFeatureProgress: React.FC = () => {
    const intl = useIntl()
    const TooltipTitle = intl.formatMessage({ id: 'subscription.featureProgress.tooltip' })
    const { organization } = useOrganization()
    const { isFeatureAvailable, isB2BAppEnabled } = useOrganizationSubscription()
    const { isCollapsed } = useLayoutContext()
    const { trialSubscriptions } = useTrialSubscriptions()
    const [animatedPercentage, setAnimatedPercentage] = useState(0)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const isMountedRef = useRef(false)

    const { publicRuntimeConfig } = getConfig()
    const subscriptionModalConfig = publicRuntimeConfig?.subscriptionProgressModalConfig

    const activeSubscriptionContextId = organization?.subscription?.activeSubscriptionContextId

    const { data: contextData } = useGetSubscriptionContextByIdQuery({
        variables: {
            id: activeSubscriptionContextId || '',
        },
        skip: !activeSubscriptionContextId,
    })

    const { data: plansData } = useGetAvailableServiceSubscriptionPlansQuery({
        variables: {
            organization: { id: organization?.id },
        },
        skip: !organization?.id,
    })

    const bestPlan = useMemo(() => {
        const planId = contextData?.subscriptionContext?.subscriptionPlan?.id

        const availablePlans = plansData?.result?.plans || []
        return availablePlans
            .filter(p => p.plan.canBePromoted && planId && planId !== p.plan.id)
            .sort((a, b) => (b.plan.priority ?? 0) - (a.plan.priority ?? 0))[0]
    }, [plansData?.result?.plans, contextData?.subscriptionContext?.subscriptionPlan?.id])

    const bestPlanB2BApps = useMemo(() => {
        if (!bestPlan) return []
        return bestPlan.plan.enabledB2BApps || []
    }, [bestPlan])

    const formattedCurrency = useMemo(() => {
        const currencyCode = bestPlan?.prices?.[0]?.currencyCode
        if (!currencyCode) return '0'
        
        return new Intl.NumberFormat(intl.locale, {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(0)
    }, [bestPlan, intl.locale])

    const hasActivatedAnyTrial = trialSubscriptions.length > 0

    const DescriptionText = intl.formatMessage({ id: 'subscription.featureProgress.description' }, { percentage: animatedPercentage })
    const TryButtonText = hasActivatedAnyTrial
        ? intl.formatMessage({ id: 'subscription.featureProgress.tryButton.afterTrial' })
        : intl.formatMessage({ id: 'subscription.featureProgress.tryButton' }, { formattedPrice: formattedCurrency })

    const featurePercentage = useMemo(() => {
        if (!organization || !bestPlan) return 0
        const baseFeatureCount = AVAILABLE_FEATURES.reduce((count, feature) => {
            if (isFeatureExcludedFromCalculation(feature)) return count
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

    const openModal = useCallback(() => {
        setIsModalOpen(true)
    }, [])

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
        openModal()
    }

    if (!bestPlan || !bestPlan?.prices?.[0]) {
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
                    <Space size={12} direction='vertical' className={styles.expandedContent}>
                        <Typography.Text size='medium'>
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
                            id='openSubscriptionModalButton'
                            type='primary'
                            block
                            size='medium'
                            onClick={handleClick}
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
                subscriptionModalConfig={subscriptionModalConfig}
            />
        </Tooltip>
    )
}
