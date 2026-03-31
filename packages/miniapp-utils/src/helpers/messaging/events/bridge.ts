import { z } from 'zod'

import type {
    GetFragmentData,
    GetFragmentParams,
    RedirectData,
    RedirectParams,
    RequestAuthData,
    RequestAuthParams,
    ResizeWindowData,
    ResizeWindowParams,
    ShowModalWindowData,
    ShowModalWindowParams,
    ShowNotificationData,
    ShowNotificationParams,
    UpdateModalWindowData,
    UpdateModalWindowParams,
    CloseModalWindowData,
    CloseModalWindowParams,
    CondoBridgeResultResponseEvent,
} from '@open-condo/bridge'

import { isSafeUrl } from '../../urls'
import { generateUUIDv4 } from '../../uuid'
import { zodSchemaToValidator, sendResponseMessage } from '../utils'

import type { AddHandlerType } from '../types'

type SimpleRouter = {
    push(url: string): unknown
}

export type NotificationsApi = (params: ShowNotificationParams) => void

export type ModalsApi = (params: ShowModalWindowParams & { onCancel?: () => void }) => {
    update(params: UpdateModalWindowParams['data']): void
    destroy(): void
}

export type RegisterBridgeEventsOptions = {
    addHandler: AddHandlerType
    router?: SimpleRouter
    notificationsApi?: NotificationsApi
    modalsApi?: ModalsApi
}

export function registerBridgeEvents ({
    addHandler,
    router,
    notificationsApi,
    modalsApi,
}: RegisterBridgeEventsOptions) {
    addHandler<ResizeWindowParams, ResizeWindowData>('condo-bridge', 'CondoWebAppResizeWindow', '*', zodSchemaToValidator(z.strictObject({
        height: z.number(),
    })), ({ params, source }) => {
        if (source.type !== 'frame') {
            throw new Error('Forbidden source type. Resize window is only available for registered iframes')
        }

        source.ref.height = `${params.height}px`

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
    })), async ({
        params: { url, target },
    }) => {
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
    })), async ({
        params: { url },
    }) => {
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
            description: z.string().optional(),
            type: z.enum(['success', 'error', 'warning', 'info']),
        })), ({ params }) => {
            notificationsApi(params)
            return { success: true }
        })
    }

    if (modalsApi) {
        addHandler<ShowModalWindowParams, ShowModalWindowData>('condo-bridge', 'CondoWebAppShowModalWindow', '*', zodSchemaToValidator(z.strictObject({
            title: z.string(),
            url: z.url(),
            size: z.enum(['big', 'small']).optional(),
        })), ({
            source,
            params,
            storage,
        }) => {
            if (source.type === 'worker') {
                throw new Error('Forbidden source type. Modals cannot be opened from service workers')
            }

            const modalId = generateUUIDv4()
            if (!isSafeUrl(params.url)) {
                throw new Error('Forbidden url. Your url is probably injected')
            }
            const originalSrc = new URL(params.url)
            originalSrc.searchParams.set('modalId', modalId)

            const sourceOrigin = new URL(source.type === 'frame' ? source.ref.src : window.location.href).origin
            const sourceTarget = source.type === 'frame' ? source.ref.contentWindow : source.ref

            if (sourceOrigin && originalSrc.origin !== sourceOrigin) {
                throw new Error('Forbidden url. Url must have same origin as sender')
            }

            const closeEventData: CondoBridgeResultResponseEvent<'CondoWebAppCloseModalWindow'> = {
                type: 'CondoWebAppCloseModalWindowResult',
                data: {
                    success: true,
                    modalId,
                },
            }

            const onCancel = () => {
                storage.events.delete(`modals:${modalId}`)
                if (sourceTarget) {
                    sendResponseMessage({
                        data: closeEventData,
                        target: sourceTarget,
                        origin: sourceOrigin,
                    })
                }
            }

            storage.events.set(`modals:${modalId}`, modalsApi({
                ...params,
                url: originalSrc.toString(),
                onCancel,
            }))

            return { modalId }
        })

        addHandler<UpdateModalWindowParams, UpdateModalWindowData>('condo-bridge', 'CondoWebAppUpdateModalWindow', '*', zodSchemaToValidator(z.strictObject({
            modalId: z.string(),
            data: z.strictObject({
                title: z.string().optional(),
                size: z.enum(['big', 'small']).optional(),
            }),
        })), ({ params, storage }) => {
            const modalActions = storage.events.get(`modals:${params.modalId}`) as ReturnType<ModalsApi>
            if (!modalActions) {
                return { updated: false }
            }

            modalActions.update(params.data)

            return { updated: true }
        })
        addHandler<CloseModalWindowParams, CloseModalWindowData>('condo-bridge', 'CondoWebAppCloseModalWindow', '*', zodSchemaToValidator(z.strictObject({
            modalId: z.string(),
        })), ({ params, storage }) => {
            const modalActions = storage.events.get(`modals:${params.modalId}`) as ReturnType<ModalsApi>
            if (!modalActions) {
                return { modalId: params.modalId, success: false }
            }

            modalActions.destroy()
            storage.events.delete(`modals:${params.modalId}`)

            return { modalId: params.modalId, success: true }
        })
    }
}