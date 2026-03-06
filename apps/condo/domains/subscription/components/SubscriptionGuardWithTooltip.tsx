import React from 'react'

import { NoSubscriptionTooltip, NoSubscriptionTooltipProps } from '@condo/domains/subscription/components/NoSubscriptionTooltip'
import { useOrganizationSubscription } from '@condo/domains/subscription/hooks'

interface SubscriptionFeatureGuardProps extends Omit<NoSubscriptionTooltipProps, 'children'> {
    children: React.ReactElement
    feature: NoSubscriptionTooltipProps['feature']
    fallback: React.ReactElement
}

/**
 * Component that conditionally renders content based on subscription feature availability.
 * 
 * If the organization has access to the specified feature(s), renders the children.
 * Otherwise, renders the fallback element wrapped in a NoSubscriptionTooltip.
 * 
 * @param children - Element to render when feature is available
 * @param feature - Feature name or array of feature names to check
 * @param fallback - Element to render when feature is not available (will be wrapped in tooltip)
 * @param tooltipProps - Additional props passed to NoSubscriptionTooltip
 * 
 * @example
 * <SubscriptionGuardWithTooltip
 *   feature="analytics"
 *   fallback={<Button disabled>Analytics</Button>}
 * >
 *   <Button>Analytics</Button>
 * </SubscriptionGuardWithTooltip>
 */
export const SubscriptionGuardWithTooltip: React.FC<SubscriptionFeatureGuardProps> = ({
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
