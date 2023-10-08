const { getById } = require('@open-condo/keystone/schema')

const { OIDC_SENDER_FIELD_VALUE } = require('@miniapp/domains/common/constants/oidc')

const { User } = require('./index')

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
    return user.name !== userInfo.name ||
        user.v !== userInfo.v ||
        user.dv !== userInfo.dv ||
        user.type !== userInfo.type ||
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
            v: userInfo.v,
            dv: userInfo.dv,
            type: userInfo.type,
            isSupport: userInfo.isSupport,
            isAdmin: userInfo.isAdmin,
            email: userInfo.email || null,
            isLocal: false,
            password: null,
        })
    } else {
        const createdUser = await User.create(context, {
            sender: OIDC_SENDER_FIELD_VALUE,
            name: userInfo.name,
            v: userInfo.v,
            dv: userInfo.dv,
            type: userInfo.type,
            isSupport: userInfo.isSupport,
            isAdmin: userInfo.isAdmin,
            email: userInfo.email || null,
            isLocal: false,
            password: null,
        })
        // UserCreateInput does not have `id` field, so, update it manually
        return await keystone.lists.User.adapter.update(createdUser.id, { id: userInfo.sub })
    }
}

module.exports = {
    createOrUpdateUser,
}
