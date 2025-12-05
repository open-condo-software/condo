import { useRouter } from 'next/router'
import React, { useEffect, useState, useCallback } from 'react'

import { SubscriptionAccessModal } from './SubscriptionAccessModal'

import { requiresSubscriptionAccess, getRequiredFeature } from '../constants/routeFeatureMapping'
import { useOrganizationSubscription } from '../hooks/useOrganizationSubscription'


interface SubscriptionAccessGuardProps {
    children: React.ReactNode
}

/**
 * Guard component that checks subscription access for protected routes
 * Shows modal when user tries to access a page without proper subscription
 */
export const SubscriptionAccessGuard: React.FC<SubscriptionAccessGuardProps> = ({ children }) => {
    const router = useRouter()
    const { subscription, isExpired, isFeatureAvailable, loading } = useOrganizationSubscription()

    console.log(subscription)
    
    const [modalVisible, setModalVisible] = useState(false)
    const [modalType, setModalType] = useState<'no-subscription' | 'feature-locked'>('no-subscription')
    const [featureName, setFeatureName] = useState<string>()

    const checkAccess = useCallback(() => {
        const currentPath = router.pathname


        // Skip check if route doesn't require subscription
        if (!requiresSubscriptionAccess(currentPath)) {
            return
        }
        
        // Skip check if subscription data is still loading
        if (loading) {
            return
        }
        
        // Check if user has active subscription
        if (!subscription || isExpired) {
            setModalType('no-subscription')
            setModalVisible(true)
            return
        }
        
        // Check if specific feature is required
        const requiredFeature = getRequiredFeature(currentPath)
        if (requiredFeature && !isFeatureAvailable(requiredFeature)) {
            setModalType('feature-locked')
            setFeatureName(requiredFeature)
            setModalVisible(true)
            return
        }
    }, [router.pathname, subscription, isExpired, isFeatureAvailable, loading])

    useEffect(() => {
        // Check access on mount and route change
        checkAccess()
    }, [checkAccess])

    const handleModalClose = () => {
        setModalVisible(false)
    }

    return (
        <>
            {children}
            <SubscriptionAccessModal
                visible={modalVisible}
                onClose={handleModalClose}
                type={modalType}
                featureName={featureName}
            />
        </>
    )
}
