import React from 'react'

import { NoSubscriptionTooltip, NoSubscriptionTooltipProps } from '@condo/domains/subscription/components/NoSubscriptionTooltip'
import { useOrganizationSubscription } from '@condo/domains/subscription/hooks'

interface SubscriptionFeatureGuardProps extends Omit<NoSubscriptionTooltipProps, 'children'> {
    children: React.ReactElement
    feature?: NoSubscriptionTooltipProps['feature']
    fallback: React.ReactElement
}

/**
 * Component that conditionally renders content based on subscription feature or miniapp availability.
 *
 * If the organization has access to the specified feature(s) or miniapp, renders the children.
 * Otherwise, renders the fallback element wrapped in a NoSubscriptionTooltip.
 *
 * @param children - Element to render when feature/miniapp is available
 * @param feature - Feature name or array of feature names to check (optional if b2bAppId is provided)
 * @param b2bAppId - Miniapp ID to check availability for (optional if feature is provided)
 * @param fallback - Element to render when feature/miniapp is not available (will be wrapped in tooltip)
 * @param tooltipProps - Additional props passed to NoSubscriptionTooltip
 *
 * @example
 * // Feature-based guard
 * <SubscriptionGuardWithTooltip
 *   feature="analytics"
 *   fallback={<Button disabled>Analytics</Button>}
 * >
 *   <Button>Analytics</Button>
 * </SubscriptionGuardWithTooltip>
 *
 * @example
 * // Miniapp-based guard
 * <SubscriptionGuardWithTooltip
 *   b2bAppId="miniapp-id"
 *   fallback={<Button disabled>Connect</Button>}
 * >
 *   <Button>Connect</Button>
 * </SubscriptionGuardWithTooltip>
 */
export const SubscriptionGuardWithTooltip: React.FC<SubscriptionFeatureGuardProps> = ({
    children, 
    feature,
    fallback,
    b2bAppId,
    ...tooltipProps
}) => {
    const { isFeatureAvailable, isB2BAppEnabled } = useOrganizationSubscription()

    const isAppAvailableForTariff = b2bAppId ? isB2BAppEnabled(b2bAppId) : true

    const hasFeature = Array.isArray(feature)
        ? feature.every(f => isFeatureAvailable(f))
        : isFeatureAvailable(feature)

    if (b2bAppId && isAppAvailableForTariff) {
        return children
    }

    if (hasFeature) {
        return children
    }

    return (
        <NoSubscriptionTooltip feature={feature} b2bAppId={b2bAppId} {...tooltipProps}>
            {fallback}
        </NoSubscriptionTooltip>
    )
}
