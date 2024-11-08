/**
 * Check whether it's a server or client environment
 * @example
 * if (!isSSR()) {
 *     console.log(window.location.href)
 * }
 */
export function isSSR (): boolean {
    return typeof window === 'undefined'
}

/**
 * Check whether it's development environment or not
 * @example
 * const IS_DEBUG_LOGS_ENABLED = isDebug()
 */
export function isDebug (): boolean {
    return process.env.NODE_ENV === 'development'
}
