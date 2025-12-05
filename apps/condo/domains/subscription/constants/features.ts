//import { AvailableFeature } from '../hooks/useOrganizationSubscription'

/**
 * Feature keys that can be controlled by subscription plans
 */
export const FEATURE_KEY: Record<string, any> = {
    NEWS: 'news',
    MARKETPLACE: 'marketplace',
    SUPPORT: 'support',
    AI: 'ai',
    PASS_TICKETS: 'passTickets',
} as const
