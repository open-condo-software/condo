const { identity } = require('lodash')
const { Keystone } = require('@keystonejs/keystone')
const { PasswordAuthStrategy } = require('@keystonejs/auth-password')
const { GraphQLApp } = require('@keystonejs/app-graphql')
const { AdminUIApp } = require('@keystonejs/app-admin-ui')
const { NextApp } = require('@keystonejs/app-next')
const { createItems } = require('@keystonejs/server-side-graphql-client')
const { obsRouterHandler } = require('@condo/domains/common/utils/sberCloudFileAdapter')
const conf = require('@core/config')
// const access = require('@core/keystone/access')
const { registerTasks } = require('@core/keystone/tasks')
const { prepareDefaultKeystoneConfig } = require('@core/keystone/setup.utils')
const { registerSchemas } = require('@core/keystone/schema')
const express = require('express')

const IS_ENABLE_DD_TRACE = conf.NODE_ENV === 'production'
const IS_ENABLE_APOLLO_DEBUG = conf.NODE_ENV === 'development' || conf.NODE_ENV === 'test'
// NOTE: should be disabled in production: https://www.apollographql.com/docs/apollo-server/testing/graphql-playground/
// WARN: https://github.com/graphql/graphql-playground/tree/main/packages/graphql-playground-html/examples/xss-attack
const IS_ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND = conf.ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND === 'true'


if (IS_ENABLE_DD_TRACE) {
    require('dd-trace').init({
        logInjection: true,
    })
}

const keystone = new Keystone({
    ...prepareDefaultKeystoneConfig(conf),
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
})

registerSchemas(keystone, [
    require('@condo/domains/user/schema'),
    require('@condo/domains/organization/schema'),
    require('@condo/domains/property/schema'),
    require('@condo/domains/billing/schema'),
    require('@condo/domains/ticket/schema'),
    require('@condo/domains/notification/schema'),
])

registerTasks([
    require('@condo/domains/notification/tasks'),
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
    config: {
        protectIdentities: false,
    },
})

class OBSFilesMiddleware {
    prepareMiddleware ({ keystone, dev, distDir }) {
        const app = express()
        app.use('/api/files/:file(*)', obsRouterHandler({ keystone }))
        return app
    }
}



module.exports = {
    keystone,
    apps: [
        new GraphQLApp({
            apollo: {
                debug: IS_ENABLE_APOLLO_DEBUG,
                introspection: IS_ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND,
                playground: IS_ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND,
            },
        }),
        new OBSFilesMiddleware(),
        new AdminUIApp({
            adminPath: '/admin',
            isAccessAllowed: ({ authentication: { item: user } }) => Boolean(user && (user.isAdmin || user.isSupport)),
            authStrategy,
        }),
        conf.NODE_ENV === 'test' ? undefined : new NextApp({ dir: '.' }),
    ].filter(identity),
}
