import { generators, Issuer } from 'openid-client'
import { z } from 'zod'

import { isSafeUrl } from './urls'
import { generateUUIDv4 } from './uuid'

import type { IncomingMessage, ServerResponse } from 'http'
import type { Client, UserinfoResponse } from 'openid-client'

type Session = Record<string, unknown> & {
    save: () => Promise<void>
    destroy: () => Promise<void>
}

type SessionGetter = (req: IncomingMessage, res: ServerResponse) => Promise<Session>
type OIDCClientConfig = {
    serverUrl: string
    clientId: string
    clientSecret: string
    scope?: string
    clientOptions?: Record<string, unknown>
    issuerOptions?: Record<string, unknown>
}

type LoggerType = {
    info: (data: unknown) => void
    error: (data: unknown) => void
}

type OIDCCallbackData<UserInfo extends Record<string, unknown> = Record<string, never>> = {
    accessToken?: string
    refreshToken?: string
    idToken?: string
    userInfo?: UserinfoResponse<UserInfo>
}

type ErrorHandler = (err: unknown, req: IncomingMessage, res: ServerResponse, next: NextFunction) => void

interface AbstractApp {
    get(endpoint: string, ...handlers: Array<RequestHandler | ErrorHandler>): void
}

type MiddlewareOptions = {
    app: AbstractApp
    apiPrefix?: string
}

type OnAuthSuccessHandler<UserInfo extends Record<string, unknown> = Record<string, never>> = (
    req: IncomingMessage,
    res: ServerResponse,
    data: OIDCCallbackData<UserInfo>
) => void | Promise<void>

type OIDCMiddlewareOptions<UserInfo extends Record<string, unknown> = Record<string, never>> = {
    getSession: SessionGetter
    oidcConfig: OIDCClientConfig
    redirectUri: string
    onAuthSuccess?: OnAuthSuccessHandler<UserInfo>
    middlewareOptions?: MiddlewareOptions
    onError?: ErrorHandler
    logger?: LoggerType
}

type NextFunction = (err?: unknown) => void

type RequestHandler = (req: IncomingMessage, res: ServerResponse, next?: NextFunction) => void | Promise<void>

export class OIDCMiddleware<UserInfo extends Record<string, unknown> = Record<string, never>> {
    private static OIDC_ID_TOKEN_KEY = 'oidcIdToken' as const
    private static OIDC_ACCESS_TOKEN_KEY = 'oidcAccessToken' as const
    private static OIDC_REFRESH_TOKEN_KEY = 'oidcRefreshToken' as const
    private static OIDC_NEXT_URL_KEY = 'oidcNextUrl' as const
    private static OIDC_CHECKS_KEY = 'oidcChecks' as const
    private static CHECK_SCHEMA = z.object({ nonce: z.string(), state: z.string() })

    private readonly getSession: SessionGetter
    private readonly client: Client
    private readonly logger: LoggerType
    private readonly redirectUri: string
    private readonly onAuthSuccess?: OnAuthSuccessHandler<UserInfo>
    private readonly onError?: ErrorHandler
    private readonly middlewareOptions: MiddlewareOptions | undefined
    private readonly scope?: string

    static getQueryParams (req: IncomingMessage): URLSearchParams {
        return new URL(req.url || '/', 'https://_').searchParams
    }

    constructor ({
        getSession,
        oidcConfig,
        redirectUri,
        logger,
        onAuthSuccess,
        onError,
        middlewareOptions,
    }: OIDCMiddlewareOptions<UserInfo>) {
        this.getSession = getSession
        const { serverUrl, clientId, clientSecret, clientOptions, issuerOptions, scope } = oidcConfig

        const issuer = new Issuer({
            authorization_endpoint: `${serverUrl}/oidc/auth`,
            token_endpoint: `${serverUrl}/oidc/token`,
            end_session_endpoint: `${serverUrl}/oidc/session/end`,
            jwks_uri: `${serverUrl}/oidc/jwks`,
            revocation_endpoint: `${serverUrl}/oidc/token/revocation`,
            userinfo_endpoint: `${serverUrl}/oidc/me`,
            issuer: serverUrl,
            ...(issuerOptions || {}),
        })

        this.redirectUri = redirectUri
        this.middlewareOptions = middlewareOptions
        this.onAuthSuccess = onAuthSuccess
        this.onError = onError
        this.scope = scope || 'openid'

        this.client = new issuer.Client({
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uris: [redirectUri],
            response_types: ['code'],
            token_endpoint_auth_method: 'client_secret_basic',
            ...(clientOptions || {}),
        })

        this.logger = logger || console

        this.sendError = this.sendError.bind(this)
        this.getAuthHandler = this.getAuthHandler.bind(this)
        this.getCallbackHandler = this.getCallbackHandler.bind(this)
        this.prepareMiddleware = this.prepareMiddleware.bind(this)
    }

    private sendError (err: unknown, req: IncomingMessage, res: ServerResponse, next?: NextFunction): void {
        if (next && this.onError) {
            this.onError(err, req, res, next)
            return
        }

        if (next) {
            next(err)
            return
        }

        const errId = generateUUIDv4()
        this.logger.error({ msg: 'oidc auth error', errId, err })

        res.writeHead(500, { 'Content-Type': 'text/plain' })
        res.end(`OIDC auth error: ${errId}`)
    }

    getAuthHandler (): RequestHandler {
        const sessionGetter = this.getSession
        const client = this.client
        const sendError = this.sendError
        const scope = this.scope

        return async function authHandler (req, res, next) {
            const session = await sessionGetter(req, res)

            try {
                const query = OIDCMiddleware.getQueryParams(req)
                const next = query.get('next')

                if (next && isSafeUrl(next)) {
                    session[OIDCMiddleware.OIDC_NEXT_URL_KEY] = next
                } else {
                    delete session[OIDCMiddleware.OIDC_NEXT_URL_KEY]
                }

                const checks = { nonce: generators.nonce(), state: generators.state() }
                session[OIDCMiddleware.OIDC_CHECKS_KEY] = { ...checks }
                await session.save()

                const authUrl = client.authorizationUrl({
                    scope,
                    ...checks,
                })

                res.writeHead(302, { Location: authUrl })
                res.end()
            } catch (err) {
                delete session[OIDCMiddleware.OIDC_CHECKS_KEY]
                delete session[OIDCMiddleware.OIDC_NEXT_URL_KEY]
                await session.save()

                return sendError(err, req, res, next)
            }
        }
    }

    getCallbackHandler (): RequestHandler {
        const sessionGetter = this.getSession
        const sendError = this.sendError
        const client = this.client
        const redirectUri = this.redirectUri
        const onAuthSuccess = this.onAuthSuccess

        return async function callbackHandler (req, res, next) {
            let session = await sessionGetter(req, res)

            try {
                const { success, data: checks } = OIDCMiddleware.CHECK_SCHEMA.safeParse(session[OIDCMiddleware.OIDC_CHECKS_KEY])
                const nextUrl = session[OIDCMiddleware.OIDC_NEXT_URL_KEY]

                if (!success) {
                    return sendError(new Error('Invalid nonce or state'), req, res, next)
                }

                const params = client.callbackParams(req)
                const { access_token: accessToken, refresh_token: refreshToken, id_token: idToken } = await client.callback(redirectUri, params, checks)

                let userInfo: UserinfoResponse<UserInfo> | undefined
                if (accessToken) {
                    userInfo = await client.userinfo<UserInfo>(accessToken)
                }

                // Step 1. Remove temporary session data and save session
                delete session[OIDCMiddleware.OIDC_CHECKS_KEY]
                delete session[OIDCMiddleware.OIDC_NEXT_URL_KEY]
                await session.save()

                // Step 2. Call onAuthSuccess to sync user, start new session and so on
                if (onAuthSuccess) {
                    await onAuthSuccess(req, res, { accessToken, refreshToken, idToken, userInfo })
                    // NOTE: session might be regenerated in onAuthSuccess
                    session = await sessionGetter(req, res)
                }

                // Step 3. Save tokens for later use
                session[OIDCMiddleware.OIDC_ID_TOKEN_KEY] = idToken
                session[OIDCMiddleware.OIDC_ACCESS_TOKEN_KEY] = accessToken
                session[OIDCMiddleware.OIDC_REFRESH_TOKEN_KEY] = refreshToken

                await session.save()

                const location = typeof nextUrl === 'string' && isSafeUrl(nextUrl) ? nextUrl : '/'
                res.writeHead(302, { Location: location })
                res.end()
            } catch (err) {
                delete session[OIDCMiddleware.OIDC_CHECKS_KEY]
                delete session[OIDCMiddleware.OIDC_NEXT_URL_KEY]
                await session.save()

                return sendError(err, req, res, next)
            }
        }
    }

    prepareMiddleware (): AbstractApp | null {
        if (!this.middlewareOptions) {
            return null
        }

        const { app, apiPrefix = '/api/oidc' } = this.middlewareOptions

        app.get(`${apiPrefix}/auth`, this.getAuthHandler())
        app.get(`${apiPrefix}/callback`, this.getCallbackHandler())

        return app
    }
}