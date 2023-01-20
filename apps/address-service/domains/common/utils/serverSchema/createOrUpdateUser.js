const isEqual = require('lodash/isEqual')

const { getById } = require('@open-condo/keystone/schema')

const { User } = require('@address-service/domains/user/utils/serverSchema')

const OIDC_SENDER_FIELD_VALUE = {
    dv: 1,
    fingerprint: 'oauth-oidc', // minimum 5 symbols length
}

/**
 * @typedef OIDCCondoUserInfo
 * @property {string} sub
 * @property {Number} dv
 * @property {string} name
 * @property {Boolean} isSupport
 * @property {Boolean} isAdmin
 */

const hasChanges = (user, userInfo) => {
    return user.name !== userInfo.name ||
        !isEqual(user.dv, userInfo.dv) ||
        user.isSupport !== userInfo.isSupport ||
        user.isAdmin !== userInfo.isAdmin
}

/**
 *
 * @param keystone - instance of Keystone app
 * @param {OIDCCondoUserInfo} userInfo
 * @return {Promise<void>}
 */
const createOrUpdateUser = async (keystone, userInfo) => {
    const context = await keystone.createContext({ skipAccessControl: true })
    const existingUser = await getById('User', userInfo.sub)
    if (existingUser) {
        if (!hasChanges(existingUser, userInfo)) {
            return existingUser
        }
        return await User.update(context, existingUser.id, {
            sender: OIDC_SENDER_FIELD_VALUE,
            name: userInfo.name,
            dv: userInfo.dv,
            isSupport: userInfo.isSupport,
            isAdmin: userInfo.isAdmin,
        })
    } else {
        const createdUser = await User.create(context, {
            sender: OIDC_SENDER_FIELD_VALUE,
            name: userInfo.name,
            dv: userInfo.dv,
            isSupport: userInfo.isSupport,
            isAdmin: userInfo.isAdmin,
        })
        // UserCreateInput does not have `id` field, so, update it manually
        return await keystone.lists.User.adapter.update(createdUser.id, { id: userInfo.sub })
    }
}

module.exports = {
    createOrUpdateUser,
}
