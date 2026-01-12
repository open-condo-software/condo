import type { AvailableFeature } from './features'

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
    '/payments': 'payments',
    '/meter': 'meters',
    '/ticket': 'tickets',
    '/news': 'news',
    '/marketplace': 'marketplace',
}

function isAllowedWithoutSubscription (pathname: string): boolean {
    return ALLOWED_WITHOUT_SUBSCRIPTION.some(route => 
        pathname === route || pathname.startsWith(route + '/')
    )
}

export function requiresSubscriptionAccess (pathname: string): boolean {
    return !isAllowedWithoutSubscription(pathname)
}

/**
 * Get required feature for a route
 * Returns AvailableFeature if specific feature is required, null otherwise
 */
export function getRequiredFeature (pathname: string): AvailableFeature | null {
    if (pathname in ROUTE_FEATURE_MAPPING) {
        return ROUTE_FEATURE_MAPPING[pathname]
    }
    
    const routes = Object.keys(ROUTE_FEATURE_MAPPING)
    for (const route of routes) {
        if (pathname.startsWith(route + '/')) {
            return ROUTE_FEATURE_MAPPING[route]
        }
    }
    
    return null
}

export function isMiniappPage (pathname: string): boolean {
    return pathname === '/miniapps/[id]'
}

export function getMiniappId (query: Record<string, string | string[] | undefined>): string | null {
    const id = query.id
    return typeof id === 'string' ? id : null
}
