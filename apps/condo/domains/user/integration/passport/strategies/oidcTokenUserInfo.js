// @ts-check
const https = require('https')

const set = require('lodash/set')
const { Strategy: CustomStrategy } = require('passport-custom')

const  { GQLError } = require('@open-condo/keystone/errors')
const { fetch } = require('@open-condo/keystone/fetch')
const  { getByCondition, getSchemaCtx } = require('@open-condo/keystone/schema')

const { ERRORS } = require('@condo/domains/user/integration/passport/errors')
const {
    DEFAULT_USER_FIELDS_MAPPING,
    extractUserDataFromProvider,
    getExistingUserIdentity,
    syncUser,
} = require('@condo/domains/user/integration/passport/utils/user')
const { ConfirmEmailAction, ConfirmPhoneAction } = require('@condo/domains/user/utils/serverSchema')

const { AuthStrategy } = require('./types')

/** @implements AuthStrategy */
class OidcTokenUserInfoAuthStrategy {
    #strategyTrustInfo = { trustEmail: false, trustPhone: false }
    #authURL
    #callbackURL
    #clients = {}

    constructor (strategyConfig, routes) {
        const { options, trustEmail, trustPhone } = strategyConfig
        const { clients } = options
        const { authURL, callbackURL } = routes

        this.#authURL = authURL
        this.#callbackURL = callbackURL

        this.#clients = clients
        this.#strategyTrustInfo = { trustEmail, trustPhone }
    }

    static #capitalize (input) {
        return `${input.charAt(0).toUpperCase()}${input.slice(1)}`
    }

    static async parseConfirmToken (req, tokenType, profileIdentity) {
        const errorContext = { req }
        let success = false
        let identity = null
        let error = null
        let actionId = null

        if (!['phone', 'email'].includes(tokenType)) {
            // Will be wrapped into generic
            error = new GQLError(ERRORS.UNKNOWN_CONFIRM_TOKEN_TYPE, errorContext)
            return { success, identity, actionId, error }
        }

        const capitalizedTokenType = OidcTokenUserInfoAuthStrategy.#capitalize(tokenType)
        const queryParamName = `confirm_${tokenType}_action_token`
        const modelName = `Confirm${capitalizedTokenType}Action`
        const token = req.query[queryParamName]

        if (!token) {
            error = new GQLError({
                ...ERRORS[`${tokenType.toUpperCase()}_CONFIRMATION_REQUIRED`],
                messageInterpolation: {
                    [tokenType]: profileIdentity,
                    parameter: queryParamName,
                },
            }, errorContext)
            return { success, identity, actionId, error }
        }

        if (typeof token !== 'string') {
            error = new GQLError({
                ...ERRORS.INVALID_PARAMETER,
                messageInterpolation: { parameter: queryParamName },
            }, errorContext)
            return { success, identity, actionId, error }
        }

        const action = await getByCondition(modelName, {
            token,
            expiresAt_gte: new Date().toISOString(),
            completedAt: null,
            deletedAt: null,
            [`is${capitalizedTokenType}Verified`]: true,
        })
        if (!action) {
            error = new GQLError({
                ...ERRORS.INVALID_PARAMETER,
                messageInterpolation: { parameter: queryParamName },
            }, errorContext)
            return { success, identity, actionId, error }
        }

        identity = action[tokenType]
        success = true
        actionId = action.id

        return { success, identity, actionId, error }
    }


    build () {
        const callbackPath = new URL(this.#callbackURL).pathname
        const clients = this.#clients
        const strategyTrustInfo = this.#strategyTrustInfo

        return new CustomStrategy(async function verify (req, done) {
            // On auth endpoint redirect to callbackURL to be consistent with other strategies
            if (req.path !== callbackPath) {
                const searchParams = req.originalUrl.split('?')[1]
                return req.res.redirect([callbackPath, searchParams].filter(Boolean).join('?'))
            }

            // Step 0. Required parameters verification
            const { access_token, client_id } = req.query
            const errorContext = { req }
            if (!access_token) {
                return done(new GQLError({
                    ...ERRORS.MISSING_QUERY_PARAMETER,
                    messageInterpolation: { parameter: 'access_token' },
                }, errorContext))
            }
            if (typeof access_token !== 'string') {
                return done(new GQLError({
                    ...ERRORS.INVALID_PARAMETER,
                    messageInterpolation: { parameter: 'access_token' },
                }, errorContext))
            }
            if (!client_id) {
                return done(new GQLError({
                    ...ERRORS.MISSING_QUERY_PARAMETER,
                    messageInterpolation: { parameter: 'client_id' },
                }, errorContext))
            }
            if (typeof client_id !== 'string' || !Object.hasOwn(clients, client_id)) {
                return done(new GQLError({
                    ...ERRORS.INVALID_PARAMETER,
                    messageInterpolation: { parameter: 'client_id' },
                }, errorContext))
            }

            const {
                trustEmail,
                trustPhone,
                identityType,
                fieldMapping,
                userInfoURL,
                requireConfirmPhoneAction,
                requireConfirmEmailAction,
                rejectUnauthorized,
            } = clients[client_id]

            const providerInfo = {
                name: identityType,
                trustEmail: strategyTrustInfo.trustEmail && trustEmail,
                trustPhone: strategyTrustInfo.trustPhone && trustPhone,
            }

            try {
                const agent = new https.Agent({ rejectUnauthorized })

                // Step 1. Getting user info
                const response = await fetch(userInfoURL, {
                    maxRetries: 1,
                    abortRequestTimeout: 5000,
                    headers: {
                        'Authorization': `Bearer ${access_token}`,
                        'Accept': 'application/json',
                    },
                    agent,
                })
                if (response.status !== 200) {
                    return done(new GQLError(ERRORS.AUTHORIZATION_FAILED, errorContext, [new Error('userInfo request was not successful')]))
                }
                const userProfile = await response.json()

                // Step 2. Check if identity already exists (not the first authorization)
                const identity = await getExistingUserIdentity(req, userProfile, req.session.userType, providerInfo, fieldMapping)
                // Step 3. If so, login this linked user
                if (identity) {
                    return done(null, identity.user)
                }

                // Step 4. Otherwise, it's user first auth, so we need to check required tokens
                // NOTE: might need to fill phone / email fields, so we need this keys to persist
                const fullFieldMapping = { ...DEFAULT_USER_FIELDS_MAPPING, ...fieldMapping }

                let confirmPhoneActionId = null
                let confirmEmailActionId = null

                if (requireConfirmPhoneAction) {
                    let providerPhone
                    try {
                        providerPhone = extractUserDataFromProvider(req, userProfile, fieldMapping).phone
                    } catch {
                        providerPhone = null
                    }
                    const { identity, actionId, success, error  } = await OidcTokenUserInfoAuthStrategy.parseConfirmToken(req, 'phone', providerPhone)
                    if (!success) {
                        return done(error, null)
                    }
                    // NOTE: Override payload to guarantee user linking
                    providerInfo.trustPhone = true
                    // NOTE: We trust condo-verified phones more, than one from userProfile
                    set(userProfile, fullFieldMapping['phone'], identity)
                    set(userProfile, fullFieldMapping['isPhoneVerified'], true)

                    confirmPhoneActionId = actionId
                }

                if (requireConfirmEmailAction) {
                    let providerEmail
                    try {
                        providerEmail = extractUserDataFromProvider(req, userProfile, fieldMapping).email
                    } catch {
                        providerEmail = null
                    }
                    const { identity, actionId, success, error  } = await OidcTokenUserInfoAuthStrategy.parseConfirmToken(req, 'email', providerEmail)
                    if (!success) {
                        return done(error, null)
                    }
                    // NOTE: Override payload to guarantee user linking
                    providerInfo.trustEmail = true
                    // NOTE: We trust condo-verified phones more, than one from userProfile
                    set(userProfile, fullFieldMapping['email'], identity)
                    set(userProfile, fullFieldMapping['isEmailVerified'], true)

                    confirmEmailActionId = actionId
                }

                // Step 5. Call syncUser for final user / identity creation
                const user = await syncUser(req, userProfile, req.session.userType, providerInfo, fieldMapping)

                // Step 5. Mark tokens as used
                const updateActionTasks = []
                const { keystone } = getSchemaCtx('User')
                const context = await keystone.createContext({ skipAccessControl: true })
                if (confirmPhoneActionId) {
                    updateActionTasks.push(ConfirmPhoneAction.update(context, confirmPhoneActionId, {
                        dv: 1,
                        sender: { dv: 1, fingerprint: 'passport-oidc-token-userinfo' },
                        completedAt: (new Date()).toISOString(),
                    }))
                }
                if (confirmEmailActionId) {
                    updateActionTasks.push(ConfirmEmailAction.update(context, confirmEmailActionId, {
                        dv: 1,
                        sender: { dv: 1, fingerprint: 'passport-oidc-token-userinfo' },
                        completedAt: (new Date()).toISOString(),
                    }))
                }

                await Promise.all(updateActionTasks)

                return done(null, user, { accessToken: access_token, clientID: client_id, provider: providerInfo.name })
            } catch (err) {
                done(err)
            }

        })
    }

    getProviders () {
        return Object.values(this.#clients).map(clientInfo => clientInfo.identityType)
    }
}

module.exports = {
    OidcTokenUserInfoAuthStrategy,
}