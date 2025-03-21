const isEqual = require('lodash/isEqual')

const { getByCondition } = require('@open-condo/keystone/schema')

const { User } = require('./index')


const OIDC_SENDER_FIELD_VALUE = {
    dv: 1,
    fingerprint: 'oauth-oidc',
}

/**
 * @typedef OIDCCondoUserInfo
 * @property {String} sub
 * @property {Number} v
 * @property {Number} dv
 * @property {String} type
 * @property {String} name
 * @property {Boolean} isSupport
 * @property {Boolean} isAdmin
 */

const hasChanges = (user, userInfo) => {
    return user.name !== userInfo.name
        || user.v !== userInfo.v
        || !isEqual(user.dv, userInfo.dv)
        || user.type !== userInfo.type
        || user.isSupport !== userInfo.isSupport
        || user.isAdmin !== userInfo.isAdmin
}

/**
 *
 * @param keystone - instance of Keystone app
 * @param {OIDCCondoUserInfo} userInfo
 * @return {Promise<{ id: string }>}
 */
const createOrUpdateUser = async (keystone, userInfo) => {
    const context = await keystone.createContext()
    const existingUser = await getByCondition('User', { id: userInfo.sub, deletedAt: null })
    if (existingUser) {
        if (!hasChanges(existingUser, userInfo)) {
            return existingUser
        }
        return await User.update(context, existingUser.id, {
            sender: OIDC_SENDER_FIELD_VALUE,
            name: userInfo.name,
            dv: userInfo.dv,
            type: userInfo.type,
            isSupport: userInfo.isSupport,
            isAdmin: userInfo.isAdmin,
        })
    } else {
        const createdUser = await User.create(context, {
            sender: OIDC_SENDER_FIELD_VALUE,
            name: userInfo.name,
            dv: userInfo.dv,
            type: userInfo.type,
            isSupport: userInfo.isSupport,
            isAdmin: userInfo.isAdmin,
        })
        // UserCreateInput does not have `id` field, so, update it manually
        const user = await keystone.lists.User.adapter.update(createdUser.id, { id: userInfo.sub })
        return { id: user.id }
    }
}

module.exports = {
    createOrUpdateUser,
}
