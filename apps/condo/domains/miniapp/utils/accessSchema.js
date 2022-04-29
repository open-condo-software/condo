const { getByCondition } = require('@core/keystone/schema')
const get = require('lodash/get')

async function checkB2BAppAccessRight (userId, appId) {
    if (!userId || !appId) return false
    const accessRight = await getByCondition('B2BAppAccessRight', {
        app: { id: appId },
        user: { id: userId },
        deletedAt: null,
    })
    return !!get(accessRight, 'id')
}

module.exports = {
    checkB2BAppAccessRight,
}