const { Keystone } = require('@keystonejs/keystone')
const { PasswordAuthStrategy } = require('@keystonejs/auth-password')
const { GraphQLApp } = require('@keystonejs/app-graphql')
const { AdminUIApp } = require('@keystonejs/app-admin-ui')
const { createItems } = require('@keystonejs/server-side-graphql-client')
const conf = require('@open-condo/config')
const access = require('@open-condo/keystone/access')
const { prepareDefaultKeystoneConfig } = require('@open-condo/keystone/setup.utils')
const { registerSchemas } = require('@open-condo/keystone/KSv5v6/v5/registerSchema')
const { SuggestionKeystoneApp } = require('@address-service/domains/common/utils/services/suggest/SuggestionKeystoneApp')
const { SearchKeystoneApp } = require('@address-service/domains/common/utils/services/search/SearchKeystoneApp')
const { OIDCKeystoneApp } = require('@address-service/domains/common/oidc')
const { formatError } = require('@condo/keystone/apolloErrorFormatter')
const identity = require('lodash/identity')

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
    require('@address-service/domains/user/schema'),
    require('@address-service/domains/address/schema'),
])

const authStrategy = keystone.createAuthStrategy({
    type: PasswordAuthStrategy,
    list: 'User',
})

module.exports = {
    keystone,
    apps: [
        conf.NODE_ENV === 'test' ? undefined : new OIDCKeystoneApp(),
        new GraphQLApp({ apollo: { formatError, debug: conf.NODE_ENV === 'development' || conf.NODE_ENV === 'test' } }),
        new AdminUIApp({
            adminPath: '/admin',
            isAccessAllowed: access.userIsAdmin,
            authStrategy,
            hooks: require.resolve('@app/address-service/admin-ui'),
        }),
        new SuggestionKeystoneApp(),
        new SearchKeystoneApp(),
    ].filter(identity),
}
