
const { get } = require('lodash')

/**
 * @type {import('apollo-server-plugin-base').ApolloServerPlugin}
 */

class ApolloCheckDeletedUserPlugin {
    async requestDidStart (requestContext) {
        const req = get(requestContext, 'context.req')
        const userPhone = get(req, 'user.phone')
        const userEmail =  get(req, 'user.email')

        if (userPhone === null && userEmail === null) {
            await req.session.destroy()
        }
    }
}

module.exports = {
    ApolloCheckDeletedUserPlugin,
}