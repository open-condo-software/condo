const { identity } = require('lodash')
const { Keystone } = require('@keystonejs/keystone')
const { PasswordAuthStrategy } = require('@keystonejs/auth-password')
const { GraphQLApp } = require('@keystonejs/app-graphql')
const { AdminUIApp } = require('@keystonejs/app-admin-ui')
// const { StaticApp } = require('@keystonejs/app-static')
const { NextApp } = require('@keystonejs/app-next')
const { createItems } = require('@keystonejs/server-side-graphql-client')
const { obsRouterHandler } = require('@condo/domains/common/utils/sberCloudFileAdapter')
const conf = require('@core/config')
const IORedis = require('ioredis')
const WORKER_REDIS_URL = conf['WORKER_REDIS_URL']
const access = require('@core/keystone/access')
const { registerTasks } = require('@core/keystone/tasks')
const { prepareDefaultKeystoneConfig } = require('@core/keystone/setup.utils')
const { registerSchemas } = require('@core/keystone/schema')
const express = require('express')
const { utc } = require('moment')

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


class Redis {

    constructor () {
        this.db = new IORedis(WORKER_REDIS_URL)
        this.lockPrefix = 'LOCK_'
        this.counterPrefix = 'COUNTER_BY_DAY_'
    }

    // Counter wich will reset at the start of a day
    // Example usage = only 100 attempts to confirm phone from single IP
    async incrementCounterByDay (variable) {
        // if variable not exists - it will be set to 1
        const afterIncrement = await this.db.incr(`${this.counterPrefix}${variable}`)
        if (afterIncrement === 1) {
            await this.db.expireat(`${this.counterPrefix}${variable}`, Number(utc().endOf('day')) / 1000)
        }
        return afterIncrement
    }

    // Lock
    // 1. Set variable to reddis with TTL
    // 2. Check if lock exists
    // 3. Get lock remain time
    // Example usage after failed attempt to confirm phone - lock phoneNumber for some time
    async lockTimeRemain (variable, action = '') {
        const time = await this.db.ttl(`${this.lockPrefix}${action}${variable}`)
        // -1: no ttl on variable, -2: key not exists
        return Math.max(time, 0)
    }

    async isLocked (variable, action = '') {
        const value = await this.db.exists(`${this.lockPrefix}${action}${variable}`)
        return !!value
    }

    async lock (variable, action = '', ttl = 300) { // ttl - seconds
        await this.db.set(`${this.lockPrefix}${action}${variable}`, '1')
        await this.db.expire(`${this.lockPrefix}${action}${variable}`, ttl)
    }

}

module.exports = {
    keystone,
    redis: new Redis(),
    apps: [
        new GraphQLApp({
            apollo: {
                debug: IS_ENABLE_APOLLO_DEBUG,
                introspection: IS_ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND,
                playground: IS_ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND,
            },
        }),
        new OBSFilesMiddleware(),
        // TODO(zuch) - ask if we can remove it - looks like it's only servs local adapter files
        // new StaticApp({ path: conf.MEDIA_URL, src: conf.MEDIA_ROOT }),
        new AdminUIApp({
            adminPath: '/admin',
            isAccessAllowed: ({ authentication: { item: user } }) => Boolean(user && (user.isAdmin || user.isSupport)),
            authStrategy,
        }),
        conf.NODE_ENV === 'test' ? undefined : new NextApp({ dir: '.' }),
    ].filter(identity),
}
