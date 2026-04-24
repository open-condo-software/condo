import { SUBSCRIPTION_PLAN_FEATURES } from '@condo/domains/subscription/constants'

export const AVAILABLE_FEATURES = SUBSCRIPTION_PLAN_FEATURES

export type AvailableFeatureType = typeof SUBSCRIPTION_PLAN_FEATURES[number]