const get = require('lodash/get')

const { getByCondition } = require('@open-condo/keystone/schema')

async function checkAccessRight (userId, appId, accessRightModel) {
    if (!userId || !appId) return false
    const accessRight = await getByCondition(accessRightModel, {
        app: { id: appId },
        user: { id: userId },
        deletedAt: null,
    })
    return !!get(accessRight, 'id')
}

async function checkB2BAppAccessRight (userId, appId) {
    return await checkAccessRight(userId, appId, 'B2BAppAccessRight')
}

async function checkB2CAppAccessRight (userId, appId) {
    return await checkAccessRight(userId, appId, 'B2CAppAccessRight')
}

module.exports = {
    checkB2BAppAccessRight,
    checkB2CAppAccessRight,
}