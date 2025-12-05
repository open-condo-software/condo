import { FEATURE_KEY } from './features'

/**
 * Mapping of routes to subscription features
 * - null: requires active subscription but no specific feature
 * - FEATURE_KEY.*: requires active subscription AND specific feature
 * - undefined/not in map: no subscription check needed
 */
export const ROUTE_FEATURE_MAPPING: Record<string, string | null> = {
    // Pages that require active subscription
    '/reports': null,
    '/ticket': null,
    '/incident': null,
    '/property': null,
    '/contact': null,
    '/employee': null,
    '/billing': null,
    '/service-provider-profile': null,
    '/meter': null,
    '/miniapps': null,
    '/settings': null,
    
    // Pages that require specific features
    '/news': FEATURE_KEY.NEWS,
    '/marketplace': FEATURE_KEY.MARKETPLACE,
}

/**
 * Check if a route requires subscription access
 */
export function requiresSubscriptionAccess (pathname: string): boolean {
    // Check exact match first
    if (pathname in ROUTE_FEATURE_MAPPING) {
        return true
    }
    
    // Check if pathname starts with any of the mapped routes
    const routes = Object.keys(ROUTE_FEATURE_MAPPING)
    return routes.some(route => pathname.startsWith(route + '/'))
}

/**
 * Get required feature for a route
 * Returns null if only subscription is required, undefined if no check needed
 */
export function getRequiredFeature (pathname: string): string | null | undefined {
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
    
    return undefined
}
