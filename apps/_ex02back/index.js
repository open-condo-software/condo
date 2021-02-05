const { Keystone } = require('@keystonejs/keystone')
const { PasswordAuthStrategy } = require('@keystonejs/auth-password')
const { GraphQLApp } = require('@keystonejs/app-graphql')
const { AdminUIApp } = require('@keystonejs/app-admin-ui')
const { StaticApp } = require('@keystonejs/app-static')
const { createItems } = require('@keystonejs/server-side-graphql-client')

const conf = require('@core/config')
const access = require('@core/keystone/access')
const { registerSchemas } = require('@core/keystone/schema')
const { prepareDefaultKeystoneConfig } = require('@core/keystone/setup.utils')

const keystone = new Keystone({
    ...prepareDefaultKeystoneConfig(conf),
    onConnect: async () => {
        // Initialise some data
        if (conf.NODE_ENV !== 'development') return // Just for dev env purposes!
        // This function can be called before tables are created! (we just ignore this)
        try {
            const users = await keystone.lists.User.adapter.findAll()
            if (!users.length) {
                const initialData = require('./initialData')
                for (let { listKey, items } of initialData) {
                    console.log(`🗿 createItems(${listKey}) -> ${items.length}`)
                    await createItems({
                        keystone,
                        listKey,
                        items,
                    })
                }
            }
        } catch (e) {
            console.warn('onConnectError:', e)
        }
    },
})

registerSchemas(keystone, [
    require('./schema/User'),
    require('./schema/Organization'),
])

const authStrategy = keystone.createAuthStrategy({
    type: PasswordAuthStrategy,
    list: 'User',
})

module.exports = {
    keystone,
    apps: [
        new GraphQLApp({
            apollo: { debug: conf.NODE_ENV === 'development' || conf.NODE_ENV === 'test' },
        }),
        new StaticApp({ path: conf.MEDIA_URL, src: conf.MEDIA_ROOT }),
        new AdminUIApp({
            adminPath: '/admin',
            isAccessAllowed: access.userIsAdmin,
            authStrategy,
        }),
    ],
}
