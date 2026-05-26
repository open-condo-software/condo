const express = require('express')
const { z } = require('zod')

const { GQLError, GQLInternalErrorTypes: { SUB_GQL_ERROR }, GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')
const { expressErrorHandler } = require('@open-condo/keystone/utils/errors/expressErrorHandler')

const { getVoIPCallStatus } = require('@condo/domains/miniapp/utils/serverSchema') 

const GET_VOIP_CALL_STATUS_URL_PATH = '/api/voip/getVoIPCallStatus'
const INVALID_PARAMETERS_ERROR = 'INVALID_PARAMETERS'

const DV_SENDER_SCHEMA = z.strictObject({
    dv: z.number(),
    sender: z.strictObject({ dv: z.number(), fingerprint: z.string() }),
})

const GET_VOIP_CALL_STATUS_QUERY_DATA_SCHEMA = DV_SENDER_SCHEMA.merge(z.strictObject({
    token: z.string(),
}))

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
        if (req.method === 'GET') {
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

        app.get(
            GET_VOIP_CALL_STATUS_URL_PATH, 
            this.withKeystoneContext, 
            withParsedData(GET_VOIP_CALL_STATUS_QUERY_DATA_SCHEMA), 
            callService(getVoIPCallStatus),
        )

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
}
