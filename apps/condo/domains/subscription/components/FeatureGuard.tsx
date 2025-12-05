import React, { useState } from 'react'


import { UpgradeModal } from './UpgradeModal'

import { useOrganizationSubscription } from '../hooks'

interface FeatureGuardProps {
    /**
     * Feature key to check access for
     */
    feature: any
    
    /**
     * Children to render if feature is available
     */
    children: React.ReactNode
    
    /**
     * Custom fallback to render if feature is not available
     * If not provided, UpgradeModal will be shown
     */
    fallback?: React.ReactNode
    
    /**
     * Localized feature name for UpgradeModal
     */
    featureName: string
    
    /**
     * Localized feature description for UpgradeModal
     */
    featureDescription?: string
    
    /**
     * Localized CTA button text for UpgradeModal
     */
    ctaText?: string
    
    /**
     * Callback when user clicks upgrade button
     */
    onUpgrade?: () => void
}

/**
 * Component that guards content based on subscription feature availability
 * 
 * @example
 * ```tsx
 * <FeatureGuard 
 *   feature="marketplace"
 *   featureName="Маркетплейс"
 *   featureDescription="Доступ к маркетплейсу услуг"
 * >
 *   <MarketplaceContent />
 * </FeatureGuard>
 * ```
 */
export const FeatureGuard: React.FC<FeatureGuardProps> = ({
    feature,
    children,
    fallback,
    featureName,
    featureDescription,
    ctaText,
    onUpgrade,
}) => {
    const { isFeatureAvailable } = useOrganizationSubscription()
    const [modalVisible, setModalVisible] = useState(false)

    const hasAccess = isFeatureAvailable(feature)

    // If feature is available, render children
    if (hasAccess) {
        return <>{children}</>
    }

    // If custom fallback provided, use it
    if (fallback) {
        return <>{fallback}</>
    }

    // Otherwise, show upgrade modal when user tries to access
    // For now, we'll show modal immediately, but in real scenario
    // you might want to show a placeholder that opens modal on click
    return (
        <>
            <div 
                onClick={() => setModalVisible(true)}
                style={{ cursor: 'pointer' }}
            >
                {children}
            </div>
            <UpgradeModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                feature={feature}
                featureName={featureName}
                featureDescription={featureDescription}
                ctaText={ctaText}
                onUpgrade={onUpgrade}
            />
        </>
    )
}
