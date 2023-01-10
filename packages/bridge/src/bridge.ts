import type { WebBridge, AnyRequestMethodName, RequestParams, RequestIdParam, CondoBridge } from './types/bridge'
import pkg from '../package.json'

export const IS_CLIENT_SIDE = typeof window !== 'undefined'
// TODO(DOMA-5084): add mobile clients env checks
export const IS_BROWSER_CLIENT = IS_CLIENT_SIDE

const WEB_SPECIFIC_METHODS = [
    'CondoWebAppResizeWindow',
]

export const AVAILABLE_METHODS = [
    ...(IS_BROWSER_CLIENT ? WEB_SPECIFIC_METHODS : []),
]

const webBridge: WebBridge | undefined = IS_BROWSER_CLIENT
    ? parent
    : undefined

export function createCondoBridge (): CondoBridge {
    function send<K extends AnyRequestMethodName> (method: K, params?: RequestParams<K> & RequestIdParam) {
        if (webBridge && typeof webBridge.postMessage === 'function') {
            webBridge.postMessage({
                handler: method,
                params,
                type: 'condo-bridge',
                version: pkg.version,
            }, '*')
        }
    }

    return {
        send,
    }
}
