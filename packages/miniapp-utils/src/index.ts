/**
 * Helpers
 */

export { Analytics } from './helpers/analytics'
export type { AnalyticsPlugin } from './helpers/analytics'

export { prepareSSRContext, getTracingMiddleware } from './helpers/apollo'
export type { TracingMiddlewareOptions } from './helpers/apollo'

export { nonNull } from './helpers/collections'

export { SSRCookiesHelper } from './helpers/cookies'
export type { UseSSRCookies, UseSSRCookiesExtractor, SSRCookiesContextValues } from './helpers/cookies'

export { isDebug, isSSR } from './helpers/environment'

export { getPosthogEndpoint } from './helpers/posthog'

export {
    FINGERPRINT_ID_COOKIE_NAME,
    FINGERPRINT_ID_LENGTH,
    generateFingerprint,
    getClientSideFingerprint,
    getClientSideSenderInfo,
} from './helpers/sender'

export { generateUUIDv4 } from './helpers/uuid'

/**
 * Hooks
 */

export { useEffectOnce } from './hooks/useEffectOnce'
export { useIntersectionObserver } from './hooks/useIntersectionObserver'
export { usePrevious } from './hooks/usePrevious'
