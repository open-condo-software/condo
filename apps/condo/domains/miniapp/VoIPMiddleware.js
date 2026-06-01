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

const HANDLERS_CONFIG = [
    {
        path: GET_VOIP_CALL_STATUS_URL_PATH,
        method: 'get',
        dataSchema: z.strictObject({
            token: z.string(),
            ...DV_SENDER_SCHEMA.shape,
        }),
        callServiceFn: getVoIPCallStatus,
    },
    {
        path: SEND_DTMF_TO_B2C_APP_URL_PATH,
        method: 'post',
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

/**
 * @param {import('zod').ZodType} dataSchema 
 * @returns 
 */
function withParsedData (dataSchema) {
    return function (req, res, next) {
        let data
        const bodyIsEmpty = !req.body || typeof req.body !== 'object' || !Object.keys(req.body).length
        if (req.method === 'GET' || bodyIsEmpty) {
            try {
                data = JSON.parse(req.query.data)
            } catch (err) {
                throw new GQLError({
                    ...ERRORS.INVALID_PARAMETERS,
                    messageInterpolation: { jsonError: JSON.stringify({ errors: [err.message] }) },
                }, req.keystoneContext)
            }
        } else {
            data = req.body?.data
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
                withParsedData(handler.dataSchema),
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
