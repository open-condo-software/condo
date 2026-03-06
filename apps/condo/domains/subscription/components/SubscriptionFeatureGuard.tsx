import React from 'react'

import { NoSubscriptionTooltip, NoSubscriptionTooltipProps } from '@condo/domains/subscription/components/NoSubscriptionTooltip'
import { useOrganizationSubscription } from '@condo/domains/subscription/hooks'

interface SubscriptionFeatureGuardProps extends Omit<NoSubscriptionTooltipProps, 'children'> {
    children: React.ReactElement
    feature: NoSubscriptionTooltipProps['feature']
    fallback: React.ReactElement
}

export const SubscriptionFeatureGuard: React.FC<SubscriptionFeatureGuardProps> = ({
    children, 
    feature,
    fallback,
    ...tooltipProps
}) => {
    const { isFeatureAvailable } = useOrganizationSubscription()

    const hasFeature = Array.isArray(feature)
        ? feature.every(f => isFeatureAvailable(f))
        : isFeatureAvailable(feature)

    if (hasFeature) {
        return children
    }

    return (
        <NoSubscriptionTooltip feature={feature} {...tooltipProps}>
            {fallback}
        </NoSubscriptionTooltip>
    )
}
