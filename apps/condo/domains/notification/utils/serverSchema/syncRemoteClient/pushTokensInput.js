const { GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')

const {
    TOKEN_WHICH_CANT_BE_USED_IS_NOT_ALLOWED,
    PUSH_TOKENS_TOKEN_MUST_NOT_BE_EMPTY,
    TOO_MANY_TOKENS_FOR_TRANSPORT,
    DIFFERENT_PUSH_TYPES_FOR_SAME_TOKENS_NOT_SUPPORTED,
} = require('@condo/domains/notification/constants/errors')

const PUSH_TOKENS_VALIDATION_ERRORS = {
    TOKEN_WHICH_CANT_BE_USED_IS_NOT_ALLOWED: {
        code: BAD_USER_INPUT,
        type: TOKEN_WHICH_CANT_BE_USED_IS_NOT_ALLOWED,
        message: 'Any push token must set "canBeUsedAsVoIP" or "canBeUsedAsSimplePush" or both as "true"',
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
    DIFFERENT_PUSH_TYPES_FOR_SAME_TOKENS_NOT_SUPPORTED: {
        code: BAD_USER_INPUT,
        type: DIFFERENT_PUSH_TYPES_FOR_SAME_TOKENS_NOT_SUPPORTED,
        message: 'Different push tokens with same "token" and "transport" currently can\'t have different "pushType"',
    },
}

function _groupPushTokensByTransportAndToken (pushTokens) {
    const pushTokensByTransportAndToken = {}
    pushTokens.forEach(pushToken => {
        if (!pushTokensByTransportAndToken[pushToken.transport]) pushTokensByTransportAndToken[pushToken.transport] = {}
        if (!pushTokensByTransportAndToken[pushToken.transport][pushToken.token]) pushTokensByTransportAndToken[pushToken.transport][pushToken.token] = []
        pushTokensByTransportAndToken[pushToken.transport][pushToken.token].push(pushToken)
    })
    return pushTokensByTransportAndToken
}

function getPushTokensValidationError (pushTokens) {
    const tokenWithoutAllowedVoIPAndSimplePush = pushTokens.find(pushToken => !pushToken.canBeUsedAsVoIP && !pushToken.canBeUsedAsSimplePush)
    if (tokenWithoutAllowedVoIPAndSimplePush) {
        return PUSH_TOKENS_VALIDATION_ERRORS.TOKEN_WHICH_CANT_BE_USED_IS_NOT_ALLOWED
    }

    const pushTokensWithEmptyToken = pushTokens.find(pushToken => !pushToken.token || !pushToken.token.length)
    if (pushTokensWithEmptyToken) {
        return PUSH_TOKENS_VALIDATION_ERRORS.PUSH_TOKENS_TOKEN_MUST_NOT_BE_EMPTY
    }

    const pushTokensByTransportAndToken = _groupPushTokensByTransportAndToken(pushTokens)

    for (const pushTokensByToken of Object.values(pushTokensByTransportAndToken)) {
        const differentPushTokensForTransportCount = Object.keys(pushTokensByToken).length
        if (differentPushTokensForTransportCount > 2) {
            return PUSH_TOKENS_VALIDATION_ERRORS.TOO_MANY_TOKENS_FOR_TRANSPORT
        }

        for (const pushTokens of Object.values(pushTokensByToken)) {
            const uniquePushTypes = new Set(pushTokens.map(pushToken => pushToken.pushType))
            if (uniquePushTypes.size > 1) {
                return PUSH_TOKENS_VALIDATION_ERRORS.DIFFERENT_PUSH_TYPES_FOR_SAME_TOKENS_NOT_SUPPORTED
            }
        }
    }
    return null
}

function deduplicatePushTokens (pushTokens) {
    const pushTokensByTransportAndToken = _groupPushTokensByTransportAndToken(pushTokens)
    return Object.values(pushTokensByTransportAndToken)
        .flatMap(Object.values)
        .map(pushTokensWithSameToken =>
            pushTokensWithSameToken.reduce((uniquePushToken, currentPushTokenDuplicate) => {
                return {
                    ...uniquePushToken,
                    canBeUsedAsVoIP: uniquePushToken.canBeUsedAsVoIP || currentPushTokenDuplicate.canBeUsedAsVoIP,
                    canBeUsedAsSimplePush: uniquePushToken.canBeUsedAsSimplePush || currentPushTokenDuplicate.canBeUsedAsSimplePush,
                }
            })
        )
}

module.exports = {
    PUSH_TOKENS_VALIDATION_ERRORS,

    getPushTokensValidationError,
    deduplicatePushTokens,
}