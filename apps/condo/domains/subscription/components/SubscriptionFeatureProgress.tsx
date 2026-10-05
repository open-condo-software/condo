import { useGetAvailableServiceSubscriptionPlansQuery, useGetSubscriptionContextByIdQuery } from '@app/condo/gql'
import Progress from 'antd/lib/progress'
import isEmpty from 'lodash/isEmpty'
import getConfig from 'next/config'
import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button, Space, Tooltip, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { UI_HIDE_PAID_FEATURES } from '@condo/domains/common/constants/featureflags'
import { SUBSCRIPTION_PLAN_FEATURES } from '@condo/domains/subscription/constants'
import { AvailableFeatureType } from '@condo/domains/subscription/constants/features'
import { useOrganizationSubscription, useTrialSubscriptions } from '@condo/domains/subscription/hooks'

import { SubscriptionFeatureModal } from './SubscriptionFeatureModal'
import styles from './SubscriptionFeatureProgress.module.css'

const { publicRuntimeConfig } = getConfig()
const subscriptionModalConfig = publicRuntimeConfig?.subscriptionProgressModalConfig

/** Capabilities are either plan features or B2B app ids, and each is checked differently */
const isPlanFeature = (capability: string): capability is AvailableFeatureType =>
    (SUBSCRIPTION_PLAN_FEATURES as ReadonlyArray<string>).includes(capability)

export const SubscriptionFeatureProgress: React.FC = () => {
    const intl = useIntl()
    const { useFlag } = useFeatureFlags()
    const hidePaidFeatures = useFlag(UI_HIDE_PAID_FEATURES)
    const TooltipTitle = intl.formatMessage({ id: 'subscription.featureProgress.tooltip' })
    const { organization } = useOrganization()
    const { isFeatureAvailable, isB2BAppEnabled, platformCapabilities } = useOrganizationSubscription()
    const { isCollapsed } = useLayoutContext()
    const { trialSubscriptions } = useTrialSubscriptions()
    const [animatedPercentage, setAnimatedPercentage] = useState(0)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const isMountedRef = useRef(false)

    const activeSubscriptionContextId = organization?.subscription?.activeSubscriptionContextId
    const hasSubscriptionModalConfig = useMemo(() => !isEmpty(subscriptionModalConfig), [])

    const { data: contextData } = useGetSubscriptionContextByIdQuery({
        variables: {
            id: activeSubscriptionContextId || '',
        },
        skip: !activeSubscriptionContextId || !hasSubscriptionModalConfig,
    })

    const { data: plansData } = useGetAvailableServiceSubscriptionPlansQuery({
        variables: {
            organization: { id: organization?.id },
        },
        skip: !organization?.id || !hasSubscriptionModalConfig,
    })

    /** The promoted plan above the current one; an organization without a plan is offered it as well */
    const bestPlan = useMemo(() => {
        const currentPlan = contextData?.subscriptionContext?.subscriptionPlan
        const currentPriority = currentPlan?.priority ?? -1

        const availablePlans = plansData?.result?.plans || []
        return availablePlans
            .filter(p => p.plan.canBePromoted && p.plan.id !== currentPlan?.id && (p.plan.priority ?? 0) > currentPriority)
            .sort((a, b) => (b.plan.priority ?? 0) - (a.plan.priority ?? 0))[0]
    }, [plansData?.result?.plans, contextData?.subscriptionContext?.subscriptionPlan])

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

    /**
     * Counted against everything the platform sells rather than against one promoted plan, and
     * read off the same per-feature expiry dates the settings page uses. Features bought
     * separately therefore push this number up, so the badge cannot claim the client is missing
     * something the tariff page shows as already connected.
     */
    const featurePercentage = useMemo(() => {
        if (!organization || platformCapabilities.length === 0) return 0

        const availableCount = platformCapabilities.reduce((count, capability) => {
            const isAvailable = isPlanFeature(capability)
                ? isFeatureAvailable(capability)
                : isB2BAppEnabled(capability)

            return count + (isAvailable ? 1 : 0)
        }, 0)

        return Math.round((availableCount / platformCapabilities.length) * 100)
    }, [organization, platformCapabilities, isFeatureAvailable, isB2BAppEnabled])

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

    // Nothing left to sell once every capability is already available, so the plate has nothing to say
    if (featurePercentage >= 100) {
        return null
    }

    if (hidePaidFeatures || !bestPlan || !bestPlan?.prices?.[0] || !hasSubscriptionModalConfig) {
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
