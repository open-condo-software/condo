const { KnexAdapter } = require('@keystonejs/adapter-knex')
const { BaseKeystoneAdapter } = require('@keystonejs/keystone')
const { find } = require('lodash/collection')
const { mapValues } = require('lodash/object')

const { FakeDatabaseAdapter } = require('./FakeDatabaseAdapter')
const { parseDatabaseUrl, parseDatabaseMapping, matchDatabase } = require('./utils')

function initDatabaseAdapters (databases) {
    return mapValues(databases, initDatabaseAdapter)
}

function initDatabaseAdapter (databaseUrl) {
    if (databaseUrl.startsWith('postgresql:')) {
        return new KnexAdapter({ knexOptions: { connection: databaseUrl } })
    } else if (databaseUrl.startsWith('fake:')) {
        // NOTE: case for testing!
        return new FakeDatabaseAdapter()
    } else {
        throw new Error(`initDatabaseAdapter() call with unknown database schema: ${databaseUrl}`)
    }
}

function initListAdapter (rootAdapter, parentAdapter, key, adapterConfig) {
    // NOTE(pahaz): We can not use `parentAdapter.newListAdapter(key, adapterConfig)`
    // because we need to override `listAdapter.getListAdapterByKey` and `listAdapter.parentAdapter`
    // NOTE(pahaz): And we can not use `new parentAdapter.listAdapterClass(key, this, adapterConfig)`
    // because lots of internal calls like so `listAdapter.parentAdapter.getQueryBuilder()`
    const listAdapter = parentAdapter.newListAdapter(key, adapterConfig)
    const getListAdapterByKey = rootAdapter.getListAdapterByKey.bind(rootAdapter)
    listAdapter.parentAdapter.getListAdapterByKey = getListAdapterByKey
    listAdapter.getListAdapterByKey = getListAdapterByKey
    return listAdapter
}

class ScalableDatabaseAdapter extends BaseKeystoneAdapter {
    static PUBLIC_API = [
        'name', 'config',  // base keystone adapter props
        'newListAdapter', 'getListAdapterByKey', 'connect', '_connect', 'checkDatabaseVersion', 'postConnect', 'disconnect',  // keystone interface props
        '__databaseAdapters', '__listMappingRule', '__listMappingAdapters', '__listToDatabase',  // own private props
        '__kmigratorKnexAdapters',  // kmigrator hacks for backward compatibility
    ]

    constructor (opts = {}) {
        if (!opts.url || !opts.url.startsWith('custom:')) throw new Error('ScalableDatabaseAdapter({ url }) wrong url format!')
        if (!opts.mapping || !opts.mapping.startsWith('[')) throw new Error('ScalableDatabaseAdapter({ mapping }) wrong url format!')

        const databases = parseDatabaseUrl(opts.url)
        if (!databases) throw new Error('ScalableDatabaseAdapter({ url }) wrong url format!')

        const mapping = parseDatabaseMapping(opts.mapping, databases)
        if (!mapping) throw new Error('ScalableDatabaseAdapter({ mapping }) wrong mapping!')

        super(...arguments)

        // NOTE: used inside the Keystone but really it's not a part of public API! We need to support it
        // Used inside the Keystone in case of createList to check Field Adapter Type!
        this.name = 'knex'

        // PRIVATE PART!
        this.__databaseAdapters = initDatabaseAdapters(databases)
        this.__listMappingRule = mapping
        this.__listMappingAdapters = {}
        this.__listToDatabase = {}
    }

    newListAdapter (key, adapterConfig) {
        const db = matchDatabase(this.__listMappingRule, key)
        if (!db) throw new Error(`ScalableDatabaseAdapter.newListAdapter(..): wrong mapping for ${key}`)
        const { query, command } = db

        const commandAdapter = this.__databaseAdapters[command]
        if (!commandAdapter) throw new Error(`ScalableDatabaseAdapter.newListAdapter(..): no parentAdapter ${command}`)
        const queryAdapter = this.__databaseAdapters[query]
        if (!queryAdapter) throw new Error(`ScalableDatabaseAdapter.newListAdapter(..): no parentAdapter ${query}`)

        const listAdapter = initListAdapter(this, commandAdapter, key, adapterConfig)

        if (query !== command) {
            const listQueryAdapter = initListAdapter(this, queryAdapter, key, adapterConfig)
            // TODO(pahaz): need to implement it!
            // overrideMethodsFromAnotherObject(listAdapter, listQueryAdapter, [])
            throw new Error('we do not support it yet! We need to wrap all query methods for that!')
        }

        this.__listMappingAdapters[key] = listAdapter
        this.__listToDatabase[key] = command
        return this.__listMappingAdapters[key]
    }

    getListAdapterByKey (key) {
        return this.__listMappingAdapters[key]
    }

    async connect ({ rels }) {
        // _connect, postConnect, disconnect, checkDatabaseVersion
        return super.connect({ rels })
    }

    async _connect (rels, config) {
        for (let key in this.__databaseAdapters) {
            await this.__databaseAdapters[key]._connect(rels, config)
        }
    }

    async checkDatabaseVersion () {
        for (let key in this.__databaseAdapters) {
            await this.__databaseAdapters[key].checkDatabaseVersion()
        }
    }

    async postConnect (rels) {
        const tasks = []
        for (let key in this.__databaseAdapters) {
            tasks.push(...await this.__databaseAdapters[key].postConnect(rels))
        }
        return tasks
    }

    async disconnect () {
        for (let key in this.__databaseAdapters) {
            await this.__databaseAdapters[key].disconnect()
        }
    }

    __kmigratorKnexAdapters () {
        // NOTE: we need some way to create kmigrator files!
        // In this case we just return all Knex based adapters for kmigrator!
        // it's not a Keystone API! it's kmigrator compatibility
        const isKnex = (key) => Boolean(this.__databaseAdapters[key].knex)
        const isWritable = (key) => Boolean(find(this.__listMappingRule, { command: key }))
        return Object.keys(this.__databaseAdapters)
            .filter((key) => isKnex(key) && isWritable(key))
            .map((key) => this.__databaseAdapters[key])
    }
}

module.exports = {
    ScalableDatabaseAdapter,
}
