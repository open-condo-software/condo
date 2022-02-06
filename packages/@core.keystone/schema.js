/** @type {import('ow').default} */
const ow = require('ow')
const { pickBy, identity, get, isFunction, isArray } = require('lodash')
const Emittery = require('emittery')

let EVENTS = new Emittery()
let SCHEMAS = new Map()
const GQL_LIST_SCHEMA_TYPE = 'GQLListSchema'
const GQL_CUSTOM_SCHEMA_TYPE = 'GQLCustomSchema'
const GQL_SCHEMA_TYPES = [GQL_LIST_SCHEMA_TYPE, GQL_CUSTOM_SCHEMA_TYPE]
const IS_DEV = process.env.NODE_ENV === 'development'

function registerSchemas (keystone, modulesList, globalPreprocessors = []) {
    modulesList.forEach(
        (module) => {
            if (GQL_SCHEMA_TYPES.includes(module._type)) {
                module._register(keystone, globalPreprocessors)
            } else {
                Object.values(module).forEach(
                    (GQLSchema) => {
                        if (GQL_SCHEMA_TYPES.includes(GQLSchema._type)) {
                            GQLSchema._register(keystone, globalPreprocessors)
                        } else {
                            console.warn('Wrong schema module export format! What\'s this? ', GQLSchema)
                        }
                    })
            }
        })
}

async function unregisterAllSchemas () {
    console.warn('unregisterAllSchemas() called! It\'just for debug/tests purposes. Don\'t use it in prod!')
    EVENTS = new Emittery()
    SCHEMAS = new Map()
}

async function getAllRegisteredSchemasNames () {
    return [...SCHEMAS.keys()]
}

class GQLListSchema {
    constructor (name, schema) {
        ow(schema, ow.object.partialShape({
            fields: ow.object.valuesOfType(ow.any(ow.object.hasKeys('type'), ow.null, ow.undefined)),
            access: ow.object.nonEmpty,
        }))
        // remove null fields (may be overridden)
        schema.fields = pickBy(schema.fields, identity)
        this.name = name
        this.schema = schema
        this._type = GQL_LIST_SCHEMA_TYPE
        this._keystone = null
    }

    _register (keystone, globalPreprocessors = []) {
        if (SCHEMAS.has(this.name)) throw new Error(`Schema ${this.name} is already registered`)
        SCHEMAS.set(this.name, this)
        this._keystone = keystone
        this._keystoneSchema = transformByPreprocessors(globalPreprocessors, this._type, this.name, this.schema)
        keystone.createList(this.name, this._keystoneSchema)  // create this._keystone.lists[this.name] as List type
        const keystoneList = get(this._keystone, ['lists', this.name])
        if (keystoneList) {
            // We need to save a shallow copy of createList config argument because
            // we want to use it in a future for kMigrator or some another extensions which need to define extra schema
            // extensions! It allow to use `this._keystone.lists[this.name].createListConfig`
            keystoneList.createListConfig = { ...this.schema }
            keystoneList.processedCreateListConfig = { ...this._keystoneSchema }
        }
    }

    _on (eventName, listener) {
        ow(eventName, ow.string)
        ow(listener, ow.function)
        return EVENTS.on(`${this.name}:${eventName}`, listener)
    }

    async _emit (eventName, eventData) {
        ow(eventName, ow.string)
        ow(eventData, ow.object)
        return await EVENTS.emit(`${this.name}:${eventName}`, eventData)
    }
}

class GQLCustomSchema {
    constructor (name, schema) {
        if (schema.hasOwnProperty('mutations')) {
            ow(schema, ow.object.partialShape({
                mutations: ow.array.valueOf(
                    ow.object.valuesOfType(ow.object.hasKeys(['access', 'schema', 'resolver']))),
            }))
        }

        if (schema.hasOwnProperty('queries')) {
            ow(schema, ow.object.partialShape({
                queries: ow.array.valueOf(
                    ow.object.valuesOfType(ow.object.hasKeys(['access', 'schema', 'resolver']))),
            }))
        }
        if (!name.endsWith('Service')) console.warn(`GQLCustomSchema name=${name} is not ends with 'Service'`)

        this.name = name
        this.schema = schema
        this._type = GQL_CUSTOM_SCHEMA_TYPE
        this._keystone = null
    }

    _register (keystone, globalPreprocessors = []) {
        if (SCHEMAS.has(this.name)) throw new Error(`Schema ${this.name} is already registered`)
        SCHEMAS.set(this.name, this)
        this._keystone = keystone
        this._keystoneSchema = transformByPreprocessors(globalPreprocessors, this._type, this.name, this.schema)
        keystone.extendGraphQLSchema(this._keystoneSchema)
    }

    _on (eventName, listener) {
        ow(eventName, ow.string)
        ow(listener, ow.function)
        return EVENTS.on(`${this.name}:${eventName}`, listener)
    }

    async _emit (eventName, eventData) {
        ow(eventName, ow.string)
        ow(eventData, ow.object)
        return await EVENTS.emit(`${this.name}:${eventName}`, eventData)
    }
}

function transformByPreprocessors (preprocessors, schemaType, name, schema) {
    if (!isArray(preprocessors)) throw new Error('wrong preprocessors type')
    if (preprocessors.length > 0 && IS_DEV) console.info('✔ Transform schema by global preprocessors')
    return preprocessors.reduce((schema, fn) => {
        if (!isFunction(fn)) throw new Error('preprocessor is not a function! Check your global preprocessors')
        const newSchema = fn(schemaType, name, schema)
        if (!newSchema) throw new Error('preprocessor should return a new schema object! Check your global preprocessors')
        return newSchema
    }, schema)
}

async function find (schemaName, condition) {
    if (!SCHEMAS.has(schemaName)) throw new Error(`Schema ${schemaName} is not registered yet`)
    if (SCHEMAS.get(schemaName)._type !== GQL_LIST_SCHEMA_TYPE) throw new Error(`Schema ${schemaName} type != ${GQL_LIST_SCHEMA_TYPE}`)
    const schemaList = SCHEMAS.get(schemaName)
    return await schemaList._keystone.lists[schemaName].adapter.find(condition)
}

async function getByCondition (schemaName, condition) {
    const res = await find(schemaName, condition)
    if (res.length > 1) throw new Error('getByCondition() returns multiple objects')
    else if (res.length === 1) return res[0]
    else return null
}

async function getById (schemaName, id) {
    return await getByCondition(schemaName, { id })
}

async function getSchemaCtx (schemaObjOrName) {
    let name
    if (typeof schemaObjOrName === 'object' && GQL_SCHEMA_TYPES.includes(schemaObjOrName._type) && schemaObjOrName.name) {
        name = schemaObjOrName.name
    } else if (typeof schemaObjOrName === 'string') {
        name = schemaObjOrName
    } else {
        throw new Error('unexpected type')
    }

    if (!SCHEMAS.has(name)) throw new Error(`Schema ${name} is not registered yet`)
    const schema = SCHEMAS.get(name)
    return {
        name: schema.name,
        keystone: schema._keystone,
    }
}

module.exports = {
    GQLListSchema,
    GQLCustomSchema,
    registerSchemas,
    unregisterAllSchemas,
    getAllRegisteredSchemasNames,
    getSchemaCtx,
    find,
    getById,
    getByCondition,
    GQL_CUSTOM_SCHEMA_TYPE,
    GQL_LIST_SCHEMA_TYPE,
}
