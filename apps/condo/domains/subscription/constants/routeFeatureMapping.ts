import { FEATURE_KEY } from './features'

import { AvailableFeature } from '../hooks/useOrganizationSubscription'

/**
 * Routes that are always accessible without subscription
 * These are public pages, auth pages, error pages, and user settings
 */
const ALLOWED_WITHOUT_SUBSCRIPTION: string[] = [
    '/user',
    '/settings',
    '/auth',
    '/404',
    '/404-paymentLinkNoHandler',
    '/429',
    '/500',
    '/initial',
    '/share',
    '/tls',
    '/unsubscribed',
]

/**
 * Mapping of routes to specific subscription features
 * Routes not in this map require only active subscription (no specific feature)
 */
export const ROUTE_FEATURE_MAPPING: Record<string, AvailableFeature> = {
    '/payments': FEATURE_KEY.PAYMENTS,
    '/meter': FEATURE_KEY.METERS,
    '/ticket': FEATURE_KEY.TICKETS,
    '/news': FEATURE_KEY.NEWS,
    '/marketplace': FEATURE_KEY.MARKETPLACE,
}

/**
 * Check if a route is allowed without subscription
 */
function isAllowedWithoutSubscription (pathname: string): boolean {
    return ALLOWED_WITHOUT_SUBSCRIPTION.some(route => 
        pathname === route || pathname.startsWith(route + '/')
    )
}

/**
 * Check if a route requires subscription access
 * By default all routes require subscription except those in ALLOWED_WITHOUT_SUBSCRIPTION
 */
export function requiresSubscriptionAccess (pathname: string): boolean {
    return !isAllowedWithoutSubscription(pathname)
}

/**
 * Get required feature for a route
 * Returns AvailableFeature if specific feature is required, null otherwise
 */
export function getRequiredFeature (pathname: string): AvailableFeature | null {
    // Check exact match first
    if (pathname in ROUTE_FEATURE_MAPPING) {
        return ROUTE_FEATURE_MAPPING[pathname]
    }
    
    // Check if pathname starts with any of the mapped routes
    const routes = Object.keys(ROUTE_FEATURE_MAPPING)
    for (const route of routes) {
        if (pathname.startsWith(route + '/')) {
            return ROUTE_FEATURE_MAPPING[route]
        }
    }
    
    return null
}

/**
 * Check if pathname is a miniapp page (not about page)
 */
export function isMiniappPage (pathname: string): boolean {
    return pathname === '/miniapps/[id]'
}

/**
 * Extract miniapp ID from router query
 */
export function getMiniappId (query: Record<string, string | string[] | undefined>): string | null {
    const id = query.id
    return typeof id === 'string' ? id : null
}
