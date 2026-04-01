import { deleteCookie, getCookie } from 'cookies-next'
import React, { useEffect, useMemo, useState, createContext, useContext } from 'react'
import { z } from 'zod'

import { generateUUIDv4 } from './uuid'

import type { AppType, Optional } from './common/types'
import type { IncomingMessage, ServerResponse } from 'http'

const EMBEDDING_CONTEXT_COOKIE_NAME = 'embeddingContext'
const EMBEDDING_CONTEXT_QUERY_PARAM = 'embeddingContext'
const EMBEDDING_CONTEXT_PRIMARY_TAB_SESSION_STORAGE_KEY = 'isEmbeddingContextProvider'
const EMBEDDING_CONTEXT_PROP_NAME = '__EMBEDDING_CONTEXT__'
const EMBEDDING_CONTEXT_CLEANUP_POLLING_TIMEOUT_IN_MS = 2_000

const EMBEDDING_CONTEXT_SCHEMA = z.strictObject({
    dv: z.literal(1),
    app: z.strictObject({
        id: z.string(),
        version: z.string().optional(),
        build: z.string().optional(),
    }),
    platform: z.enum(['ios', 'android', 'web']),
    device: z.strictObject({
        id: z.string(),
    }),
})

const EMBEDDING_CONTEXT_WITH_SOURCE_SCHEMA = z.strictObject({
    ctx: EMBEDDING_CONTEXT_SCHEMA,
    source: z.enum(['query', 'cookie']),
})

const IS_PRIMARY_ALIVE_MESSAGE_SCHEMA = z.object({
    type: z.literal('EmbeddingContextPrimaryPolling'),
    data: z.strictObject({
        requestId: z.string(),
    }),
})

const IS_PRIMARY_ALIVE_RESPONSE_SCHEMA = z.object({
    type: z.literal('EmbeddingContextPrimaryPollingResult'),
    data: z.strictObject({
        requestId: z.string(),
        isPrimary: z.boolean(),
    }),
})

type EmbeddingContext = z.infer<typeof EMBEDDING_CONTEXT_SCHEMA>
type EmbeddingContextWithSource = z.infer<typeof EMBEDDING_CONTEXT_WITH_SOURCE_SCHEMA>
type IsPrimaryAliveMessage = z.infer<typeof IS_PRIMARY_ALIVE_MESSAGE_SCHEMA>
type IsPrimaryAliveResponse = z.infer<typeof IS_PRIMARY_ALIVE_RESPONSE_SCHEMA>

const ReactEmbeddingContext = createContext<EmbeddingContext | null>(null)

export function useEmbeddingContext (): EmbeddingContext | null {
    return useContext(ReactEmbeddingContext)
}

function b64toContext (b64: string): EmbeddingContext | null {
    try {
        const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
        const decodedUTFString = new TextDecoder().decode(bytes)
        const parsedCtx = JSON.parse(decodedUTFString)
        return EMBEDDING_CONTEXT_SCHEMA.parse(parsedCtx)
    } catch {
        return null
    }
}

export function getEmbeddingContext (req?: Optional<IncomingMessage>, res?: Optional<ServerResponse>): EmbeddingContextWithSource | null {
    // NOTE: context can be found in query for primary tab
    const queryParamValue = req
        ? new URL(req.url ?? '/', 'https://_').searchParams.get(EMBEDDING_CONTEXT_QUERY_PARAM)
        : new URLSearchParams(window.location.search).get(EMBEDDING_CONTEXT_QUERY_PARAM)
    if (queryParamValue) {
        const ctx = b64toContext(decodeURIComponent(queryParamValue))
        if (ctx) return { ctx, source: 'query' }
    }

    // NOTE: context can be found in cookie for secondary tabs
    const cookieValue = getCookie(EMBEDDING_CONTEXT_COOKIE_NAME, { req, res })
    if (cookieValue) {
        const ctx = b64toContext(cookieValue)
        if (ctx) return { ctx, source: 'cookie' }
    }

    return null
}

export function withEmbeddingContext<
    PropsType extends Record<string, unknown>,
    ComponentType,
    RouterType,
> (App: AppType<PropsType, ComponentType, RouterType>): AppType<PropsType, ComponentType, RouterType> {
    const WithEmbeddingContext: AppType<PropsType, ComponentType, RouterType> = (props) => {
        const { pageProps } = props

        const propsContextWithSource = useMemo(() => {
            const { success, data } = EMBEDDING_CONTEXT_WITH_SOURCE_SCHEMA.safeParse(pageProps[EMBEDDING_CONTEXT_PROP_NAME])
            if (!success) return null
            return data
        }, [pageProps])

        const [embeddingContext, setEmbeddingContext] = useState<EmbeddingContext | null>(propsContextWithSource?.ctx ?? null)
        const [isPrimaryTab, setIsPrimaryTab] = useState<boolean | null>(propsContextWithSource?.source === 'query' ? true : null)
        const [bcChannel, setBCChannel] = useState<BroadcastChannel | null>(null)

        useEffect(() => {
            // NOTE: if primary tab, save it in session storage, so it won't be lost on user navigation
            if (isPrimaryTab === true && typeof window !== 'undefined') {
                window.sessionStorage.setItem(EMBEDDING_CONTEXT_PRIMARY_TAB_SESSION_STORAGE_KEY, 'true')
            }
            // NOTE: restore primary tab status if it was lost on navigation
            if (isPrimaryTab === null && typeof window !== 'undefined') {
                setIsPrimaryTab(window.sessionStorage.getItem(EMBEDDING_CONTEXT_PRIMARY_TAB_SESSION_STORAGE_KEY) === 'true')
            }
        }, [isPrimaryTab])

        useEffect(() => {
            setBCChannel(new BroadcastChannel('embeddingContext'))
        }, [])

        // NOTE: Embedding context is shared between tabs by browser technology (cookies)
        // so each new page can obtain it in initial props in SSR and CSR
        // The problem is cookie might not be cleaned up on tab close, so we use 2 tricks:
        // 1. save primary tab status in session storage, so it won't be lost on user navigation
        // 2. use BroadcastChannel to poll if primary tab is still alive, if not, clean up cookie
        useEffect(() => {
            if (isPrimaryTab === null || !bcChannel) return

            if (isPrimaryTab) {
                const primaryListener = (e: MessageEvent) => {
                    const { success, data } = IS_PRIMARY_ALIVE_MESSAGE_SCHEMA.safeParse(e.data)
                    if (!success || !data?.data?.requestId) return

                    const response: IsPrimaryAliveResponse = {
                        type: 'EmbeddingContextPrimaryPollingResult',
                        data: {
                            isPrimary: true,
                            requestId: data.data.requestId,
                        },
                    }

                    bcChannel.postMessage(response)
                }

                bcChannel.addEventListener('message', primaryListener)

                return () => {
                    bcChannel.removeEventListener('message', primaryListener)
                }
            }

            const requestId = generateUUIDv4()
            const timeout = setTimeout(() => {
                deleteCookie(EMBEDDING_CONTEXT_COOKIE_NAME)
                setEmbeddingContext(null)
                setIsPrimaryTab(false)
            }, EMBEDDING_CONTEXT_CLEANUP_POLLING_TIMEOUT_IN_MS)

            const secondaryListener = (e: MessageEvent) => {
                const { success, data } = IS_PRIMARY_ALIVE_RESPONSE_SCHEMA.safeParse(e.data)
                if (!success || data?.data.requestId !== requestId) return

                clearTimeout(timeout)
            }

            bcChannel.addEventListener('message', secondaryListener)

            const pollMessage: IsPrimaryAliveMessage = {
                type: 'EmbeddingContextPrimaryPolling',
                data: {
                    requestId,
                },
            }
            bcChannel.postMessage(pollMessage)

            return () => {
                bcChannel.removeEventListener('message', secondaryListener)
                clearTimeout(timeout)
            }

        }, [bcChannel, isPrimaryTab])

        return (
            <ReactEmbeddingContext.Provider value={embeddingContext}>
                <App {...props} />
            </ReactEmbeddingContext.Provider>
        )
    }

    const appGetInitialProps = App.getInitialProps
    if (appGetInitialProps) {
        WithEmbeddingContext.getInitialProps = async function (context) {
            const appProps = await appGetInitialProps(context)
            const { ctx } = context
            const embeddingContextWithSource = getEmbeddingContext(ctx.req, ctx.res)

            return {
                ...appProps,
                pageProps: {
                    ...appProps.pageProps,
                    [EMBEDDING_CONTEXT_PROP_NAME]: embeddingContextWithSource,
                },
            }
        }
    }

    return WithEmbeddingContext
}