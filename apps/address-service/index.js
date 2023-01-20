const { AdminUIApp } = require('@keystonejs/app-admin-ui')
const { GraphQLApp } = require('@keystonejs/app-graphql')
const { PasswordAuthStrategy } = require('@keystonejs/auth-password')
const { Keystone } = require('@keystonejs/keystone')
const { createItems } = require('@keystonejs/server-side-graphql-client')
const identity = require('lodash/identity')
const nextCookie = require('next-cookies')

const conf = require('@open-condo/config')
const access = require('@open-condo/keystone/access')
const { formatError } = require('@open-condo/keystone/apolloErrorFormatter')
const { registerSchemas } = require('@open-condo/keystone/KSv5v6/v5/registerSchema')
const { GraphQLLoggerPlugin } = require('@open-condo/keystone/logging')
const { prepareDefaultKeystoneConfig } = require('@open-condo/keystone/setup.utils')

const { OIDCKeystoneApp } = require('@address-service/domains/common/oidc')
const {
    SearchBySource,
    SearchByProvider,
    SearchByAddressKey,
    SearchByInjectionId,
    SearchByGooglePlaceId,
    SearchByFiasId,
} = require('@address-service/domains/common/utils/services/search/plugins')
const { SearchKeystoneApp } = require('@address-service/domains/common/utils/services/search/SearchKeystoneApp')
const { SuggestionKeystoneApp } = require('@address-service/domains/common/utils/services/suggest/SuggestionKeystoneApp')
const { makeId } = require('@condo/domains/common/utils/makeid.utils')
const { hasValidJsonStructure } = require('@condo/domains/common/utils/validation.utils')

const IS_ENABLE_APOLLO_DEBUG = conf.NODE_ENV === 'development' || conf.NODE_ENV === 'test'
const IS_ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND = conf.ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND === 'true'

if (conf.NODE_ENV === 'production' && IS_ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND) {
    console.log('☢️ Please disable or remove the ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND env variable')
}

const keystone = new Keystone({
    onConnect: async () => {
        // Initialise some data
        if (conf.NODE_ENV !== 'development' && conf.NODE_ENV !== 'test') return // Just for dev env purposes!
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
        new GraphQLApp({
            apollo: {
                formatError,
                debug: IS_ENABLE_APOLLO_DEBUG,
                introspection: IS_ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND,
                playground: IS_ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND,
                plugins: [new GraphQLLoggerPlugin()],
            },
        }),
        new AdminUIApp({
            adminPath: '/admin',
            isAccessAllowed: access.userIsAdminOrIsSupport,
            authStrategy,
            hooks: require.resolve('@app/address-service/admin-ui'),
        }),
        new SuggestionKeystoneApp(),
        new SearchKeystoneApp([
            new SearchByAddressKey(),
            new SearchByInjectionId(),
            new SearchBySource(),
            new SearchByFiasId(),
            new SearchByGooglePlaceId(),
            new SearchByProvider(),
        ]),
    ].filter(identity),
    configureExpress: (app) => {
        app.set('trust proxy', 1) // trust first proxy

        app.use('/admin/', (req, res, next) => {
            if (req.url === '/api') return next()
            const cookies = nextCookie({ req })
            const isSenderValid = hasValidJsonStructure(
                {
                    resolvedData: { sender: cookies['sender'] },
                    fieldPath: 'sender',
                    addFieldValidationError: () => null,
                },
                true,
                1,
                {
                    fingerprint: {
                        presence: true,
                        format: /^[a-zA-Z0-9!#$%()*+-;=,:[\]/.?@^_`{|}~]{5,42}$/,
                        length: { minimum: 5, maximum: 42 },
                    },
                })
            if (!isSenderValid) {
                res.cookie('sender', JSON.stringify({ fingerprint: cookies['userId'] || makeId(12), dv: 1 }))
                res.cookie('dv', 1)
            }
            next()
        })
    },
}
