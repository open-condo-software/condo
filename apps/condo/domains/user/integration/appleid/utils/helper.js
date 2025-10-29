const { isNil } = require('lodash')

const conf = require('@open-condo/config')
const { getKVClient } = require('@open-condo/keystone/kv')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { generateUUIDv4 } = require('@open-condo/miniapp-utils')

const { RESIDENT } = require('@condo/domains/user/constants/common')
const { AppleIdIdentityIntegration } = require('@condo/domains/user/integration/appleid/AppleIdIdentityIntegration')
const {
    getRedirectUrl,
    getCode,
    getUser,
    getAuthFlowId,
    getLinkingCode,
} = require('@condo/domains/user/integration/appleid/utils/params')
const {
    validateState,
    validateNonce,
} = require('@condo/domains/user/integration/appleid/utils/validations')
const {
    User,
} = require('@condo/domains/user/utils/serverSchema')


const redisClient = getKVClient()
const REDIS_APPLE_ID_AUTH_FLOW_PREFIX_KEY = 'APPLE_ID_AUTH_FLOW'
const REDIS_APPLE_ID_AUTH_FLOW_EXPIRY_SEC = 60 * 60 // 1 hour
const APPLE_ID_CONFIG = conf.APPLE_ID_CONFIG ? JSON.parse(conf.APPLE_ID_CONFIG) : {}

// init constants
const integration = new AppleIdIdentityIntegration()
const logger = getLogger()


async function getIdTokenByCode (req) {
    const code = getCode(req)

    // complete auth with code + state
    try {
        // validate state parameter
        validateState(req)

        const tokenSet = await integration.issueExternalIdentityToken(code)

        // validate nonce
        validateNonce(req, tokenSet)

        return tokenSet.idToken
    } catch (err) {
        logger.error({ msg: 'AppleId completeAuth error', err })
        throw err
    }
}

async function getIdTokenByLinkingCode (req) {
    const linkingCode = getLinkingCode(req)
    const authFlowId = getAuthFlowId(req)
    const authFlowStateStr = await redisClient.get(`${REDIS_APPLE_ID_AUTH_FLOW_PREFIX_KEY}:${linkingCode}`)

    if (!authFlowStateStr) {
        throw new Error('Linking code is not found')
    }

    // check that auth started and end at the same device
    const authFlowState = JSON.parse(authFlowStateStr)
    if (!isNil(authFlowState.authFlowId) && authFlowState.authFlowId !== authFlowId) {
        throw new Error('Authorization should be started and end at the same device')
    }

    return authFlowState.idToken
}

async function interruptForRegistration (req, res, idToken) {
    const user = getUser(req)
    const authFlowId = getAuthFlowId(req)
    const linkingCode = generateUUIDv4()

    // let's save linkingCode into the redis as a key
    // with authFlowId and idToken data
    redisClient.set(
        `${REDIS_APPLE_ID_AUTH_FLOW_PREFIX_KEY}:${linkingCode}`,
        JSON.stringify({ authFlowId, idToken }),
        'EX', REDIS_APPLE_ID_AUTH_FLOW_EXPIRY_SEC
    )

    const link = new URL(getRedirectUrl(req))
    link.searchParams.set('requiredRegistration', true)
    link.searchParams.set('linkingCode', linkingCode)
    link.searchParams.set('user', user)

    return res.redirect(link)
}

async function authorizeUser (req, res, context, userId) {
    // get redirectUrl params
    const redirectUrl = getRedirectUrl(req)

    // auth session
    const user = await User.getOne(context, { id: userId }, 'id type')
    const { keystone } = getSchemaCtx('User')
    const token = await keystone._sessionManager.startAuthedSession(req, {
        item: { id: user.id },
        list: keystone.lists['User'],
        meta: {
            source: 'auth-integration',
            provider: 'apple-id',
        },
    })

    // remove tmp data
    delete req.session[APPLE_ID_CONFIG]
    await req.session.save()

    // redirect
    if (isNil(redirectUrl) && RESIDENT === user.type) {
        // resident entry page
        return res.redirect(APPLE_ID_CONFIG.residentRedirectUri || '/')
    } else if (isNil(redirectUrl)) {
        // staff entry page
        return res.redirect('/tour')
    } else {
        // specified redirect page (mobile app case)
        const link = new URL(redirectUrl)
        link.searchParams.set('token', token)

        return res.redirect(link)
    }
}

module.exports = {
    getIdTokenByCode,
    getIdTokenByLinkingCode,
    interruptForRegistration,
    authorizeUser,
}
