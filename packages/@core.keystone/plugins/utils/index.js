const { getType } = require('@keystonejs/utils')
const { get } = require('lodash')

/**
 * Takes combine 2 hooks together
 * @param originalHook original hook which will be applied first
 * @param newHook hook which will be applied second
 * @param chainResolvedData determines if hook newHook shouldAccept original resolvedData or modified result of originalHook.
 * @returns {function(*): Promise<*>}
 */
const composeHook = (originalHook, newHook, chainResolvedData = true) => async params => {
    let { resolvedData } = params
    if (originalHook) {
        resolvedData = await originalHook(params)
    }

    return chainResolvedData ? newHook({ ...params, resolvedData }) : newHook(params)
}

function isValidDate (date) {
    return date && Object.prototype.toString.call(date) === '[object Date]' && !isNaN(date)
}

async function evaluateKeystoneAccessResult (access, operation, args, keystone = null) {
    const type = getType(access)
    if (type === 'Boolean') {
        return access || false
    } else if (type === 'Function') {
        return access(args) || false
    } else if (type === 'AsyncFunction') {
        return await access(args) || false
    } else if (type === 'Object') {
        const innerAccess = access[operation]
        if (innerAccess) return await evaluateKeystoneAccessResult(innerAccess, operation, args, keystone)
        return get(keystone, ['defaultAccess', 'list'], false)
    } else if (type === 'Undefined') {
        return get(keystone, ['defaultAccess', 'list'], false)
    }
    throw new Error(
        `evaluateKeystoneAccessResult(), received ${type}.`,
    )
}

module.exports = {
    composeHook,
    isValidDate,
    evaluateKeystoneAccessResult,
}
