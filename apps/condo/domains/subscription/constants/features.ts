//import { AvailableFeature } from '../hooks/useOrganizationSubscription'

/**
 * Feature keys that can be controlled by subscription plans
 */
export const FEATURE_KEY: Record<string, any> = {
    PAYMENTS: 'payments',
    METERS: 'meters',
    TICKETS: 'tickets',
    NEWS: 'news',
    MARKETPLACE: 'marketplace',
    SUPPORT: 'support',
    AI: 'ai',
    CUSTOMIZATION: 'customization',
} as const
