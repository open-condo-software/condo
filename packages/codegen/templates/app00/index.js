const { Keystone } = require('@keystonejs/keystone')
const { PasswordAuthStrategy } = require('@keystonejs/auth-password')
const { GraphQLApp } = require('@keystonejs/app-graphql')
const { AdminUIApp } = require('@keystonejs/app-admin-ui')
const { StaticApp } = require('@keystonejs/app-static')
const { NextApp } = require('@keystonejs/app-next')

const conf = require('@open-condo/config')
const access = require('@open-condo/keystone/access')
const { EmptyApp } = require('@open-condo/keystone/test.utils')
const { prepareDefaultKeystoneConfig } = require('@open-condo/keystone/setup.utils')
const { registerSchemas } = require('@open-condo/keystone/schema')

const keystone = new Keystone(prepareDefaultKeystoneConfig(conf))

registerSchemas(keystone, [
    require('@{{name}}/domains/User/schema'),
    // require('@{{name}}/domains/Organization/schema'),
])

const authStrategy = keystone.createAuthStrategy({
    type: PasswordAuthStrategy,
    list: 'User',
})

module.exports = {
    keystone,
    apps: [
        new GraphQLApp({ apollo: { debug: conf.NODE_ENV === 'development' || conf.NODE_ENV === 'test' } }),
        new StaticApp({ path: conf.MEDIA_URL, src: conf.MEDIA_ROOT }),
        new AdminUIApp({
            adminPath: '/admin',
            isAccessAllowed: access.userIsAdmin,
            authStrategy,
        }),
        conf.NODE_ENV === 'test' ? new EmptyApp() : new NextApp({ dir: '.' }),
    ],
}
