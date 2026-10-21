const express = require('express')
const { z } = require('zod')

const { GQLError, GQLInternalErrorTypes: { SUB_GQL_ERROR }, GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')
const { expressErrorHandler } = require('@open-condo/keystone/utils/errors/expressErrorHandler')

const { getVoIPCallStatus, sendDTMFToB2CApp } = require('@condo/domains/miniapp/utils/serverSchema') 

const GET_VOIP_CALL_STATUS_URL_PATH = '/api/voip/getVoIPCallStatus'
const SEND_DTMF_TO_B2C_APP_URL_PATH = '/api/voip/sendDTMFToB2CApp'
const INVALID_PARAMETERS_ERROR = 'INVALID_PARAMETERS'

const DV_SENDER_SCHEMA = z.strictObject({
    dv: z.number(),
    sender: z.strictObject({ dv: z.number(), fingerprint: z.string() }),
})

const DEFAULT_INPUT = { dv: 1, sender: { dv: 1, fingerprint: 'voip-rest' } }

const HANDLERS_CONFIG = [
    {
        path: GET_VOIP_CALL_STATUS_URL_PATH,
        method: 'get',
        queryToData: (req) => z.strictObject({ 'data.token': z.string() }).transform(({ 'data.token': token }) => ({
            token,
        })).parse(req.query),
        dataSchema: z.strictObject({
            token: z.string(),
            ...DV_SENDER_SCHEMA.shape,
        }),
        callServiceFn: getVoIPCallStatus,
    },
    {
        path: SEND_DTMF_TO_B2C_APP_URL_PATH,
        method: 'post',
        queryToData: (req) => z.strictObject({ 'data.token': z.string(), 'data.data.dtmfCode': z.string() }).transform(({ 'data.token': token, 'data.data.dtmfCode': dtmfCode }) => ({
            token, data: { dtmfCode },
        })).parse(req.query),
        dataSchema: z.strictObject({
            token: z.string(),
            data: z.strictObject({ dtmfCode: z.string() }),
            ...DV_SENDER_SCHEMA.shape,
        }),
        callServiceFn: sendDTMFToB2CApp,
    },
]

const ERRORS = {
    INVALID_PARAMETERS: {
        code: BAD_USER_INPUT,
        type: INVALID_PARAMETERS_ERROR,
        message: '{jsonError}',
    },
}

/**
 * @param {import('zod').ZodError} error 
 */
function formatZodSafeParseError (error) {
    return error.issues.map((issue) => ({
        field: issue.path.join('.'), // Converts ['profile', 'bio'] to 'profile.bio'
        message: issue.message,
        rule: issue.code,
    }))
}

function getDv (req, data) {
    if (Object.hasOwn(data, 'dv')) return data.dv
    const header = req.get('X-Dv')
    return header === undefined ? DEFAULT_INPUT.dv : JSON.parse(header)
}

function getSender (req, data) {
    if (Object.hasOwn(data, 'sender')) return data.sender
    const header = req.get('X-Sender')
    return header === undefined ? DEFAULT_INPUT.sender : JSON.parse(header)
}

/**
 * @param {import('zod').ZodType} dataSchema 
 * @param {(req: import('express').Request) => object | undefined} [queryToData]
 * @returns 
 */
function withParsedData (dataSchema, queryToData) {
    return function (req, res, next) {
        let data
        const bodyIsEmpty = !req.body || typeof req.body !== 'object' || !Object.keys(req.body).length
        try {
            if (req.method === 'GET' || bodyIsEmpty) {
                data = Object.hasOwn(req.query, 'data')
                    ? JSON.parse(z.strictObject({ data: z.string() }).parse(req.query).data)
                    : queryToData?.(req)
            } else {
                data = req.body?.data
            }
            data = {
                ...z.record(z.string(), z.unknown()).parse(data),
                dv: getDv(req, data),
                sender: getSender(req, data),
            }
        } catch (err) {
            throw new GQLError({
                ...ERRORS.INVALID_PARAMETERS,
                messageInterpolation: { jsonError: JSON.stringify({ errors: err instanceof z.ZodError ? formatZodSafeParseError(err) : [err.message] }) },
            }, req.keystoneContext)
        }

        const { success, data: parsedData, error } = dataSchema.safeParse(data)
        if (!success) {
            throw new GQLError({
                ...ERRORS.INVALID_PARAMETERS,
                messageInterpolation: { jsonError: JSON.stringify({ errors: formatZodSafeParseError(error) }) },
            }, req.keystoneContext)
        }

        req.parsedData = parsedData
        next()
    }
}

function callService (callServiceFn) {
    return async function callServiceInternal (req, res, next) {
        try {
            const result = await callServiceFn(req.keystoneContext, req.parsedData)
            return res.json(result)
        } catch (err) {
            if (err instanceof GQLError && err.extensions?.type === SUB_GQL_ERROR && err.errors.length) {
                const innerError = err.errors[0]
                if (innerError instanceof GQLError) return next(innerError)
                if (
                    innerError.extensions?.code &&
                    innerError.extensions?.type &&
                    innerError.extensions?.message
                )
                    return next(new GQLError(innerError.extensions, req.keystoneContext))
            }
            return next(err)
        }
    }
}

class VoIPMiddleware {
    /** @type {import('@open-keystone/keystone').Keystone */
    keystone

    constructor () {
        this.withKeystoneContext = this.withKeystoneContext.bind(this)
    }

    async prepareMiddleware ({ keystone }) {
        this.keystone = keystone
        // this route can not be used for csrf attack (because no cookies and tokens are used in a public route)
        // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()

        for (const handler of HANDLERS_CONFIG) {
            app[handler.method](
                handler.path,
                this.withKeystoneContext,
                withParsedData(handler.dataSchema, handler.queryToData),
                callService(handler.callServiceFn),
            )
        }

        app.use(expressErrorHandler)

        return app
    }

    withKeystoneContext (req, res, next) {
        req.keystoneContext = { 
            ...this.keystone.createContext({
                authentication: { item: req.user, listKey: req.authedListKey },
                skipAccessControl: false,
            }),
            req,
        }
        return next()
    }
}

module.exports = {
    VoIPMiddleware,

    GET_VOIP_CALL_STATUS_URL_PATH,
    SEND_DTMF_TO_B2C_APP_URL_PATH,
}
