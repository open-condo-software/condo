const { GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')

const { groupBy } = require('@condo/domains/common/utils/collections')
const {
    UNUSABLE_TOKEN_PROVIDED,
    INVALID_PUSH_TOKEN,
    TOO_MANY_TOKENS_FOR_TRANSPORT,
} = require('@condo/domains/notification/constants/errors')

const PUSH_TOKENS_VALIDATION_ERRORS = {
    UNUSABLE_TOKEN_PROVIDED: {
        code: BAD_USER_INPUT,
        type: UNUSABLE_TOKEN_PROVIDED,
        message: 'Any push token must set "isVoIP" or "isPush" or both as "true"',
    },
    INVALID_PUSH_TOKEN: {
        code: BAD_USER_INPUT,
        type: INVALID_PUSH_TOKEN,
        message: 'Push token must contain non-empty "token"',
    },
    TOO_MANY_TOKENS_FOR_TRANSPORT: {
        code: BAD_USER_INPUT,
        type: TOO_MANY_TOKENS_FOR_TRANSPORT,
        message: 'Each transport can have maximum 2 different tokens: 1 for default push messages and 1 for voip push messages',
    },
}

/**
 * @param pushTokensWithSameToken {import('@app/condo/schema').PushToken[]}
 * @returns {import('@app/condo/schema').PushToken}
 * */
function reducePushTokensWithSameTokenToOneObject (pushTokensWithSameToken) {
    const firstToken = pushTokensWithSameToken[0]
    if (!firstToken) return null

    const isVoIP = !!pushTokensWithSameToken.find(pushToken => pushToken.isVoIP)
    const isPush = !!pushTokensWithSameToken.find(pushToken => pushToken.isPush)
    return {
        ...firstToken,
        isVoIP,
        isPush,
    }
}

/**
 * @param pushTokens {import('@app/condo/schema').PushToken[]}
 * @returns {{code: GQLErrorCode|String, type: string, message: string}|{code: GQLErrorCode|String, type: string, message: string}|{code: GQLErrorCode|String, type: string, message: string}|null}
 */
function getPushTokensValidationError (pushTokens) {
    const tokenWithoutAllowedVoIPAndDefaultPush = pushTokens.find(pushToken => !pushToken.isVoIP && !pushToken.isPush)
    if (tokenWithoutAllowedVoIPAndDefaultPush) {
        return PUSH_TOKENS_VALIDATION_ERRORS.UNUSABLE_TOKEN_PROVIDED
    }

    const pushTokensWithEmptyToken = pushTokens.find(pushToken => !pushToken.token || !pushToken.token.length)
    if (pushTokensWithEmptyToken) {
        return PUSH_TOKENS_VALIDATION_ERRORS.INVALID_PUSH_TOKEN
    }

    for (const transportsGroup of groupBy(pushTokens, ['transport'])) {
        const allPushTokensForTransport = groupBy(transportsGroup, ['token'])
            .map(reducePushTokensWithSameTokenToOneObject)
            .filter(Boolean)
        const voipTokens = allPushTokensForTransport.filter(token => token.isVoIP)
        const defaultTokens = allPushTokensForTransport.filter(token => token.isPush)
        if (voipTokens.length > 1 || defaultTokens.length > 1) {
            return PUSH_TOKENS_VALIDATION_ERRORS.TOO_MANY_TOKENS_FOR_TRANSPORT
        }
    }
    return null
}

/**
 * @param pushTokens {import('@app/condo/schema').PushToken[]}
 * @returns {import('@app/condo/schema').PushToken[]}
 */
function deduplicatePushTokens (pushTokens) {
    const pushTokensByTransportAndToken = groupBy(pushTokens, ['transport', 'token'])
    return pushTokensByTransportAndToken
        .map(reducePushTokensWithSameTokenToOneObject)
        .filter(Boolean)
}

module.exports = {
    PUSH_TOKENS_VALIDATION_ERRORS,

    getPushTokensValidationError,
    deduplicatePushTokens,
}