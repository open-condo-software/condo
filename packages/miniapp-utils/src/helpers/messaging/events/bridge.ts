import { z } from 'zod'

import type {
    ResizeWindowParams,
    ResizeWindowData,
    GetFragmentParams,
    GetFragmentData,
    RedirectParams,
    RedirectData,
    ShowNotificationParams,
    ShowNotificationData,
    RequestAuthParams,
    RequestAuthData,
} from '@open-condo/bridge'

import { isSafeUrl } from '../../urls'
import { zodSchemaToValidator } from '../utils'

import type { AddHandlerType } from '../types'

type SimpleRouter = {
    push(url: string): unknown
}

export type RegisterBridgeEventsOptions = {
    addHandler: AddHandlerType
    router?: SimpleRouter
    notificationsApi?: (params: ShowNotificationParams) => void
}

export function registerBridgeEvents ({
    addHandler,
    router,
    notificationsApi,
}: RegisterBridgeEventsOptions) {
    addHandler<ResizeWindowParams, ResizeWindowData>('condo-bridge', 'CondoWebAppResizeWindow', '*', zodSchemaToValidator(z.strictObject({
        height: z.number(),
    })), (params: ResizeWindowParams, frame) => {
        if (frame) {
            frame.height = `${params.height}px`
        }
        return { height: params.height }
    })
    addHandler<GetFragmentParams, GetFragmentData>('condo-bridge', 'CondoWebAppGetFragment', '*', zodSchemaToValidator(z.strictObject({})), () => {
        const hash = window.location.hash
        const rawFragment = hash.startsWith('#') ? hash.substring(1) : hash
        const fragment = decodeURIComponent(rawFragment)

        return { fragment }
    })

    addHandler<RedirectParams, RedirectData>('condo-bridge', 'CondoWebAppRedirect', '*', zodSchemaToValidator(z.strictObject({
        url: z.url(),
        target: z.union([z.literal('_blank'), z.literal('_self')]),
    })), async ({ url, target }: RedirectParams) => {
        if (!isSafeUrl(url)) {
            throw new Error('Forbidden url. Your url is probably injected')
        }

        if (target === '_blank') {
            window.open(url, target)
        } else {
            const urlOrigin = (new URL(url)).origin
            if (window.origin !== urlOrigin) {
                throw new Error('The redirect url must have the same origin as parent window, if target is not _blank')
            }
            if (router) {
                router.push(url)
            } else {
                window.open(url, target)
            }
        }

        return { success: true }
    })

    addHandler<RequestAuthParams, RequestAuthData>('condo-bridge', 'CondoWebAppRequestAuth', '*', zodSchemaToValidator(z.strictObject({
        url: z.url(),
    })), async ({ url }) => {
        if (!isSafeUrl(url)) {
            throw new Error('Forbidden url. Your url is probably injected')
        }

        const response = await fetch(url, { credentials: 'include' })
        const body = await response.text()

        return { response: { status: response.status, body, url: response.url } }
    })

    if (notificationsApi) {
        addHandler<ShowNotificationParams, ShowNotificationData>('condo-bridge', 'CondoWebAppShowNotification', '*', zodSchemaToValidator(z.strictObject({
            message: z.string(),
            description: z.string(),
            type: z.enum(['success', 'error', 'warning', 'info']),
        })), (params: ShowNotificationParams) => {
            notificationsApi(params)
            return { success: true }
        })
    }
}