import type {
    WebBridge,
    CondoBridge,
    AnyRequestMethodName,
    RequestParams,
    RequestId,
    CondoBridgeSubscriptionListener,
} from './types/bridge'
import { promisifySend } from './promisify'
import pkg from '../package.json'

export const IS_CLIENT_SIDE = typeof window !== 'undefined'
// TODO(DOMA-5084): add mobile clients env checks
export const IS_BROWSER_CLIENT = IS_CLIENT_SIDE

const WEB_SPECIFIC_METHODS: Array<AnyRequestMethodName> = [
    'CondoWebAppResizeWindow',
    'CondoWebAppShowNotification',
]

const ALL_METHODS = [
    ...(IS_BROWSER_CLIENT ? WEB_SPECIFIC_METHODS : []),
]

const webBridge: WebBridge | undefined = IS_BROWSER_CLIENT
    ? parent
    : undefined

export function createCondoBridge (): CondoBridge {
    const subscribers: Array<CondoBridgeSubscriptionListener> = []

    function send<K extends AnyRequestMethodName> (method: K, params?: RequestParams<K> & RequestId) {
        if (webBridge && typeof webBridge.postMessage === 'function') {
            webBridge.postMessage({
                handler: method,
                params,
                type: 'condo-bridge',
                version: pkg.version,
            }, '*')
        }
    }

    function supports<K extends AnyRequestMethodName> (method: K) {
        return ALL_METHODS.includes(method)
    }

    function subscribe (listener: CondoBridgeSubscriptionListener) {
        subscribers.push(listener)
    }

    function unsubscribe (listener: CondoBridgeSubscriptionListener) {
        const idx = subscribers.indexOf(listener)

        if (idx >= 0) {
            subscribers.splice(idx, 1)
        }
    }

    function handleResponseEvent (event: MessageEvent) {
        const response = event.data
        if (typeof response !== 'object') {
            return
        }

        subscribers.forEach(listener => listener(response))
    }

    if (IS_BROWSER_CLIENT && 'addEventListener' in window) {
        window.addEventListener('message', handleResponseEvent)
    }

    return {
        send: promisifySend(send, subscribe),
        supports,
        subscribe,
        unsubscribe,
    }
}
