const { GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')

const { groupBy } = require('@condo/domains/common/utils/collections')
const {
    MAXIMUM_PUSH_TOKENS_COUNT_IN_SYNC_REMOTE_CLIENT,
    MAXIMUM_RAW_PUSH_TOKENS_COUNT_IN_SYNC_REMOTE_CLIENT,
} = require('@condo/domains/notification/constants/constants')
const {
    UNUSABLE_TOKEN_PROVIDED,
    INVALID_PUSH_TOKEN,
    TOO_MANY_TOKENS_FOR_TRANSPORT,
    TOO_MANY_TOKENS,
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
    TOO_MANY_RAW_TOKENS: {
        code: BAD_USER_INPUT,
        type: TOO_MANY_TOKENS,
        message: `You shouldn't put more than ${MAXIMUM_RAW_PUSH_TOKENS_COUNT_IN_SYNC_REMOTE_CLIENT} tokens in mutation input at once`,
    },
    TOO_MANY_TOKENS: {
        code: BAD_USER_INPUT,
        type: TOO_MANY_TOKENS,
        message: `You shouldn't put more than ${MAXIMUM_PUSH_TOKENS_COUNT_IN_SYNC_REMOTE_CLIENT} unique tokens at once`,
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
    if (pushTokens.length > MAXIMUM_RAW_PUSH_TOKENS_COUNT_IN_SYNC_REMOTE_CLIENT) {
        return PUSH_TOKENS_VALIDATION_ERRORS.TOO_MANY_RAW_TOKENS
    }

    const tokenWithoutAllowedVoIPAndDefaultPush = pushTokens.find(pushToken => !pushToken.isVoIP && !pushToken.isPush)
    if (tokenWithoutAllowedVoIPAndDefaultPush) {
        return PUSH_TOKENS_VALIDATION_ERRORS.UNUSABLE_TOKEN_PROVIDED
    }

    const pushTokensWithEmptyToken = pushTokens.find(pushToken => !pushToken.token || !pushToken.token.length)
    if (pushTokensWithEmptyToken) {
        return PUSH_TOKENS_VALIDATION_ERRORS.INVALID_PUSH_TOKEN
    }

    const dedupedTokensByTransport = groupBy(pushTokens, ['transport'])
        .map(transportsGroup => groupBy(transportsGroup, ['token'])
            .map(reducePushTokensWithSameTokenToOneObject)
            .filter(Boolean))

    const allCount = dedupedTokensByTransport.map(tokensByTransport => tokensByTransport.length).reduce((acc, cur) => acc + cur)
    if (allCount > MAXIMUM_PUSH_TOKENS_COUNT_IN_SYNC_REMOTE_CLIENT) {
        return PUSH_TOKENS_VALIDATION_ERRORS.TOO_MANY_TOKENS
    }

    for (const allUniquePushTokensForTransport of dedupedTokensByTransport) {
        const voipTokens = allUniquePushTokensForTransport.filter(token => token.isVoIP)
        const defaultTokens = allUniquePushTokensForTransport.filter(token => token.isPush)
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