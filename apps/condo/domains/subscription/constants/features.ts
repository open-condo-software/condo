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
    'b2bApp',
] as const

export type AvailableFeatureType = typeof AVAILABLE_FEATURES[number]