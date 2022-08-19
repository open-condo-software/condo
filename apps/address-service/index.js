const { Keystone } = require('@keystonejs/keystone')
const { PasswordAuthStrategy } = require('@keystonejs/auth-password')
const { GraphQLApp } = require('@keystonejs/app-graphql')
const { AdminUIApp } = require('@keystonejs/app-admin-ui')
const { createItems } = require('@keystonejs/server-side-graphql-client')
const conf = require('@condo/config')
const access = require('@condo/keystone/access')
const { prepareDefaultKeystoneConfig } = require('@condo/keystone/setup.utils')
const { registerSchemas } = require('@condo/keystone/KSv5v6/v5/registerSchema')
const { SuggestionKeystoneApp } = require('@address-service/domains/common/utils/services/suggest/SuggestionKeystoneApp')
const { OIDCKeystoneApp } = require('@address-service/domains/common/oidc')

const keystone = new Keystone({
    onConnect: async () => {
        // Initialise some data
        if (conf.NODE_ENV !== 'development') return // Just for dev env purposes!
        // This function can be called before tables are created! (we just ignore this)
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
    },
    ...prepareDefaultKeystoneConfig(conf),
})

registerSchemas(keystone, [
    require('@address-service/domains/User/schema'),
])

const authStrategy = keystone.createAuthStrategy({
    type: PasswordAuthStrategy,
    list: 'User',
})

module.exports = {
    keystone,
    apps: [
        new OIDCKeystoneApp(),
        new GraphQLApp({ apollo: { debug: conf.NODE_ENV === 'development' || conf.NODE_ENV === 'test' } }),
        new AdminUIApp({
            adminPath: '/admin',
            isAccessAllowed: access.userIsAdmin,
            authStrategy,
            hooks: require.resolve('@app/address-service/admin-ui'),
        }),
        new SuggestionKeystoneApp(),
    ],
}
