import { getCookie } from 'cookies-next'
import React, { createContext } from 'react'
import { z } from 'zod'

import type { AppType, Optional } from './common/types'
import type { IncomingMessage, ServerResponse } from 'http'
import type { Context as ReactContext } from 'react'

const embeddingContextSchema = z.strictObject({
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

type EmbeddingContext = z.infer<typeof embeddingContextSchema>

type EmbeddingContextWithSource = {
    ctx: EmbeddingContext
    source: 'query' | 'cookie'
}


export class EmbeddingHelper {
    private readonly contextQueryParam = 'embeddingContext'
    private readonly contextCookieName = 'embeddingContext'
    private readonly contextPropName = '__EMBEDDING_CONTEXT__'
    private _context: ReactContext<EmbeddingContextWithSource | null> | null = null

    constructor () {
        this.getEmbeddingContext.bind(this)
        this.getEmbeddingContextProvider.bind(this)
        this.getHOC.bind(this)
    }

    private b64toContext (b64: string): EmbeddingContext | null {
        try {
            const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
            const decodedUTFString = new TextDecoder().decode(bytes)
            const parsedCtx = JSON.parse(decodedUTFString)
            return embeddingContextSchema.parse(parsedCtx)
        } catch {
            return null
        }
    }

    getEmbeddingContext (req?: Optional<IncomingMessage>, res?: Optional<ServerResponse>): EmbeddingContextWithSource | null {
        // NOTE: context can be found in query for primary tab
        const queryParamValue = req
            ? new URL(req.url ?? '/', 'https://_').searchParams.get(this.contextQueryParam)
            : new URLSearchParams(window.location.search).get(this.contextQueryParam)
        if (queryParamValue) {
            const ctx = this.b64toContext(decodeURIComponent(queryParamValue))
            if (ctx) return { ctx, source: 'query' }
        }

        // NOTE: context can be found in cookie for secondary tabs
        const cookieValue = getCookie(this.contextCookieName, { req, res })
        if (cookieValue) {
            const ctx = this.b64toContext(cookieValue)
            if (ctx) return { ctx, source: 'cookie' }
        }

        return null
    }

    getEmbeddingContextProvider () {
        if (!this._context) {
            this._context = createContext<EmbeddingContextWithSource | null>(null)
        }

        const Context = this._context

        return function EmbeddingContextProvider ({ children }) {
            return <Context.Provider value={null}>{children}</Context.Provider>
        }
    }

    getHOC () {
        const getContext = this.getEmbeddingContext.bind(this)
        const propName = this.contextPropName

        return function withEmbeddingContext<
            PropsType extends Record<string, unknown>,
            ComponentType,
            RouterType,
        > (App: AppType<PropsType, ComponentType, RouterType>): AppType<PropsType, ComponentType, RouterType> {
            const WithEmbeddingContext: AppType<PropsType, ComponentType, RouterType> = (props) => {
                return <App {...props} />
            }

            const appGetInitialProps = App.getInitialProps
            if (appGetInitialProps) {
                WithEmbeddingContext.getInitialProps = async function (context) {
                    const appProps = await appGetInitialProps(context)
                    const { ctx } = context
                    const embeddingContextWithSource = getContext(ctx.req, ctx.res)

                    return {
                        ...appProps,
                        pageProps: {
                            ...appProps.pageProps,
                            [propName]: embeddingContextWithSource,
                        },
                    }
                }
            }

            return WithEmbeddingContext
        }
    }
}