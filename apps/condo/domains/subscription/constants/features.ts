export const AVAILABLE_FEATURES = [
    'payments',
    'meters',
    'tickets',
    'news',
    'marketplace',
    'support',
    'ai',
    'customization',
    'properties',
    'analytics',
] as const

export type AvailableFeatureType = typeof AVAILABLE_FEATURES[number]