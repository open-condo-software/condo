const Sentry = require('@sentry/node')
const conf = require('@core/config')

const { Keystone } = require('@keystonejs/keystone')
const { PasswordAuthStrategy } = require('@keystonejs/auth-password')
const { GraphQLApp } = require('@keystonejs/app-graphql')
const { AdminUIApp } = require('@keystonejs/app-admin-ui')
const { StaticApp } = require('@keystonejs/app-static')
const { NextApp } = require('@keystonejs/app-next')
const { createItems } = require('@keystonejs/server-side-graphql-client')
const access = require('@core/keystone/access')
const { ApolloError } = require('@apollo/client')
const { EmptyApp } = require('@core/keystone/test.utils')
const { prepareDefaultKeystoneConfig } = require('@core/keystone/setup.utils')
const { registerSchemas } = require('@core/keystone/schema')

require('dd-trace').init({
    logInjection: true,
})

const keystone = new Keystone({
    ...prepareDefaultKeystoneConfig(conf),
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
})

registerSchemas(keystone, [
    require('./schema/User'),
    require('@condo/domains/user/schema'),
    require('@condo/domains/organization/schema'),
    require('@condo/domains/property/schema'),
    require('@condo/domains/billing/schema'),
    require('@condo/domains/ticket/schema'),
])

function verifySchema (keystone) {
    let errorCounter = 0
    const report = (msg) => console.warn(`WRONG-SCHEMA-DEFINITION[${errorCounter}]: ${msg}`)
    Object.entries(keystone.lists).forEach(([key, list]) => {
        list.fields.forEach((field) => {
            if (field.isRelationship && !field.many) {
                const { kmigratorOptions, knexOptions } = field.config
                if (!kmigratorOptions || typeof kmigratorOptions !== 'object') {
                    report(`${list.key}->${field.path} relation without kmigratorOptions`)
                } else {
                    if (!kmigratorOptions.on_delete) {
                        report(`${list.key}->${field.path} relation without on_delete! Example: "kmigratorOptions: { null: false, on_delete: 'models.CASCADE' }". Chose one: CASCADE, PROTECT, SET_NULL, DO_NOTHING`)
                    }
                    if (kmigratorOptions.null === false) {
                        if (!knexOptions || typeof knexOptions !== 'object' || knexOptions.isNotNullable !== true) {
                            report(`${list.key}->${field.path} non nullable relation should have knexOptions like: "knexOptions: { isNotNullable: true }"`)
                        }
                        if (knexOptions.on_delete) {
                            report(`${list.key}->${field.path} knexOptions should not contain on_delete key!`)
                        }
                    }
                }
            }
        })
    })
    if (errorCounter > 0) throw new Error(`Your have ${errorCounter} WRONG-SCHEMA-DEFINITION! Fix it first!`)
}

verifySchema(keystone)

const authStrategy = keystone.createAuthStrategy({
    type: PasswordAuthStrategy,
    list: 'User',
    config: { protectIdentities: false },
})

//refs. to https://codesandbox.io/s/graphql-errors-sentry-apollo-5s8yu?file=/index.ts
const SentryApolloPlugin = {
    requestDidStart (_) {
        return {
            didEncounterErrors (ctx) {
                if (!ctx.operation) {
                    return
                }

                for (const err of ctx.errors) {
                    if (err instanceof ApolloError) {
                        continue
                    }

                    Sentry.withScope(scope => {
                        scope.setTag('kind', ctx.operation.operation)
                        scope.setExtra('query', ctx.request.query)
                        scope.setExtra('variables', ctx.request.variables)

                        if (err.path) {
                            scope.addBreadcrumb({
                                category: 'query-path',
                                message: err.path.join(' > '),
                                level: Sentry.Severity.Debug,
                            })
                        }

                        const transactionId = ctx.request.http.headers.get(
                            'x-transaction-id'
                        )
                        if (transactionId) {
                            scope.setTransaction(transactionId)
                        }

                        Sentry.captureException(err)
                    })
                }
            },
        }
    },
}

module.exports = {
    keystone,
    apps: [
        new GraphQLApp(
            {
                apollo: {
                    debug: conf.NODE_ENV === 'development' || conf.NODE_ENV === 'test',
                    plugins: [
                        conf.SENTRY_DSN && conf.NODE_ENV === 'production' && SentryApolloPlugin,
                    ].filter(Boolean),
                },
            }
        ),
        new StaticApp({ path: conf.MEDIA_URL, src: conf.MEDIA_ROOT }),
        new AdminUIApp({
            adminPath: '/admin',
            isAccessAllowed: access.userIsAdmin,
            authStrategy,
        }),
        conf.NODE_ENV === 'test' ? new EmptyApp() : new NextApp({ dir: '.' }),
    ],
}

if (conf.SENTRY_DSN) {
    Sentry.init({
        dsn: conf.SENTRY_DSN,
        enabled: conf.NODE_ENV === 'production',
    })
}
