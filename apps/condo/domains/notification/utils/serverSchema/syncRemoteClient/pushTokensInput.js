const { GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')

const {
    TOKEN_WHICH_CANT_BE_USED_IS_NOT_ALLOWED,
    PUSH_TOKENS_TOKEN_MUST_NOT_BE_EMPTY,
    TOO_MANY_TOKENS_FOR_TRANSPORT,
} = require('@condo/domains/notification/constants/errors')

const PUSH_TOKENS_VALIDATION_ERRORS = {
    TOKEN_WHICH_CANT_BE_USED_IS_NOT_ALLOWED: {
        code: BAD_USER_INPUT,
        type: TOKEN_WHICH_CANT_BE_USED_IS_NOT_ALLOWED,
        message: 'Any push token must set "isVoIP" or "isPush" or both as "true"',
    },
    PUSH_TOKENS_TOKEN_MUST_NOT_BE_EMPTY: {
        code: BAD_USER_INPUT,
        type: PUSH_TOKENS_TOKEN_MUST_NOT_BE_EMPTY,
        message: 'Push token must contain non-empty "token"',
    },
    TOO_MANY_TOKENS_FOR_TRANSPORT: {
        code: BAD_USER_INPUT,
        type: TOO_MANY_TOKENS_FOR_TRANSPORT,
        message: 'Each transport can have maximum 2 different tokens: <=1 for simple pushes and <=1 for voip pushes',
    },
}

/**
 * @returns {{
 * [transport: string]: { [token: string]: PushTokenWithSameTokenAndTransport[] }
 * }}
 * */
function _groupPushTokensByTransportAndToken (pushTokens) {
    const pushTokensByTransportAndToken = Object.create(null)
    pushTokens.forEach(pushToken => {
        if (!pushTokensByTransportAndToken[pushToken.transport]) pushTokensByTransportAndToken[pushToken.transport] = Object.create(null)
        if (!pushTokensByTransportAndToken[pushToken.transport][pushToken.token]) pushTokensByTransportAndToken[pushToken.transport][pushToken.token] = []
        pushTokensByTransportAndToken[pushToken.transport][pushToken.token].push(pushToken)
    })
    return pushTokensByTransportAndToken
}

function reducePushTokensWithSameTokenToOneObject (pushTokensWithSameToken) {
    return pushTokensWithSameToken.reduce((uniquePushToken, currentPushTokenDuplicate) => {
        return {
            ...uniquePushToken,
            isVoIP: uniquePushToken.isVoIP || currentPushTokenDuplicate.isVoIP,
            isPush: uniquePushToken.isPush || currentPushTokenDuplicate.isPush,
        }
    })
}

function getPushTokensValidationError (pushTokens) {
    const tokenWithoutAllowedVoIPAndDefaultPush = pushTokens.find(pushToken => !pushToken.isVoIP && !pushToken.isPush)
    if (tokenWithoutAllowedVoIPAndDefaultPush) {
        return PUSH_TOKENS_VALIDATION_ERRORS.TOKEN_WHICH_CANT_BE_USED_IS_NOT_ALLOWED
    }

    const pushTokensWithEmptyToken = pushTokens.find(pushToken => !pushToken.token || !pushToken.token.length)
    if (pushTokensWithEmptyToken) {
        return PUSH_TOKENS_VALIDATION_ERRORS.PUSH_TOKENS_TOKEN_MUST_NOT_BE_EMPTY
    }

    const pushTokensByTransportAndToken = _groupPushTokensByTransportAndToken(pushTokens)

    for (const pushTokensByToken of Object.values(pushTokensByTransportAndToken)) {
        const allPushTokensForTransport = Object.values(pushTokensByToken)
            .map(pushTokensWithSameToken => reducePushTokensWithSameTokenToOneObject(pushTokensWithSameToken))
        const voipTokens = allPushTokensForTransport.filter(token => token.isVoIP)
        const defaultTokens = allPushTokensForTransport.filter(token => token.isPush)
        if (voipTokens.length > 1 || defaultTokens.length > 1) {
            return PUSH_TOKENS_VALIDATION_ERRORS.TOO_MANY_TOKENS_FOR_TRANSPORT
        }
    }
    return null
}

function deduplicatePushTokens (pushTokens) {
    const pushTokensByTransportAndToken = _groupPushTokensByTransportAndToken(pushTokens)
    const deduplicatedPushTokenByTransportAndToken = Object.fromEntries(
        Object.entries(pushTokensByTransportAndToken)
            .map(([transport, pushTokensByToken]) => {
                return [
                    transport,
                    Object.fromEntries(
                        Object.entries(pushTokensByToken)
                            .map(([token, pushTokensWithSameToken]) => {
                                return [token, reducePushTokensWithSameTokenToOneObject(pushTokensWithSameToken)]
                            })
                    ),
                ]
            })
    )
    // ordering
    const usedTokensPlusTransports = new Set()
    const orderedDeduplicatedPushTokens = []
    pushTokens.forEach(({ transport, token }) => {
        const key = `${token}:${transport}`
        if (usedTokensPlusTransports.has(key)) return
        usedTokensPlusTransports.add(key)
        const deduplicatedPushToken = deduplicatedPushTokenByTransportAndToken[transport][token]
        orderedDeduplicatedPushTokens.push(deduplicatedPushToken)
    })
    return orderedDeduplicatedPushTokens.filter(Boolean)
}

module.exports = {
    PUSH_TOKENS_VALIDATION_ERRORS,

    getPushTokensValidationError,
    deduplicatePushTokens,
}