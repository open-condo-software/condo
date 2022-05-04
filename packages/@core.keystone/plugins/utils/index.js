const { getType } = require('@keystonejs/utils')
const { get } = require('lodash')

/**
 * Takes combine 2 hooks together
 * @param originalHook original hook which will be applied first
 * @param newHook hook which will be applied second
 * @param isResolvers determines if hook is resolver. If true, used return of originalHook as "resolvedData" for newHook. Otherwise, both take original resolvedData
 * @returns {function(*): Promise<*>}
 */
const composeHook = (originalHook, newHook, isResolvers = true) => async params => {
    let { resolvedData } = params
    if (originalHook) {
        resolvedData = await originalHook(params)
    }

    return isResolvers ? newHook({ ...params, resolvedData }) : newHook(params)
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
