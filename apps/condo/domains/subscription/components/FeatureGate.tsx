import React from 'react'

import { NoSubscriptionTooltip, NoSubscriptionTooltipProps } from '@condo/domains/subscription/components/NoSubscriptionTooltip'
import { useOrganizationSubscription } from '@condo/domains/subscription/hooks'

interface FeatureGateProps extends Omit<NoSubscriptionTooltipProps, 'children'> {
    children: React.ReactElement
    feature: NoSubscriptionTooltipProps['feature']
    fallback: React.ReactElement
    id: string
}

export const FeatureGate: React.FC<FeatureGateProps> = ({ 
    children, 
    feature,
    fallback,
    id,
    ...tooltipProps 
}) => {
    const { isFeatureAvailable } = useOrganizationSubscription()

    const hasFeature = Array.isArray(feature)
        ? feature.every(f => isFeatureAvailable(f))
        : isFeatureAvailable(feature)

    return (
        <NoSubscriptionTooltip feature={feature} id={id} {...tooltipProps}>
            {hasFeature ? children : fallback}
        </NoSubscriptionTooltip>
    )
}
