const { KnexFieldAdapter } = require('@open-keystone/adapter-knex')
const { MongooseFieldAdapter } = require('@open-keystone/adapter-mongoose')
const { PrismaFieldAdapter } = require('@open-keystone/adapter-prisma')
const { Implementation } = require('@open-keystone/fields')
const stringify = JSON.stringify
const isFunction = require('lodash/isFunction')

class JsonImplementation extends Implementation {
    // NOTE: argument names are based no Virtual field
    constructor (path, {
        isMultiline,
        graphQLInputType = 'JSON',
        graphQLReturnType = 'JSON',
        extendGraphQLTypes = [],
        graphQLAdminFragment = '',
    }) {
        super(...arguments)
        this.isMultiline = isMultiline
        this.isOrderable = false
        this.graphQLInputType = graphQLInputType
        this.graphQLReturnType = graphQLReturnType
        this.extendGraphQLTypes = extendGraphQLTypes
        this.graphQLAdminFragment = graphQLAdminFragment
    }

    // GQL Output

    gqlOutputFields () {
        return [`${this.path}: ${this.graphQLReturnType}`]
    }

    gqlOutputFieldResolvers () {
        return {
            [`${this.path}`]: item => item[this.path],
        }
    }

    // GQL Input

    gqlQueryInputFields () {
        return [
            ...this.equalityInputFields(this.graphQLInputType),
            ...this.inInputFields(this.graphQLInputType),
        ]
    }

    gqlUpdateInputFields () {
        return [`${this.path}: ${this.graphQLInputType}`]
    }

    gqlCreateInputFields () {
        return [`${this.path}: ${this.graphQLInputType}`]
    }

    // GQL Auxiliary

    /**
     * Auxiliary Types are top-level types which a type may need or provide.
     * Example: the `File` type, adds a graphql auxiliary type of `FileUpload`, as
     * well as an `uploadFile()` graphql auxiliary type query resolver
     */

    getGqlAuxTypes () {
        // NOTE: based on Virtual field source code
        return this.extendGraphQLTypes
    }

    gqlAuxFieldResolvers (args) {
        const { schemaName } = args
        if (isFunction(this.config.gqlAuxFieldResolver)) {
            return this.config.gqlAuxFieldResolver(args)
        }

        return super.gqlAuxFieldResolvers({ schemaName })
    }

    // Admin

    extendAdminMeta (meta) {
        const { isMultiline } = this
        return {
            isMultiline,
            graphQLAdminFragment: this.graphQLAdminFragment,
            ...meta,
        }
    }

    // Hooks

    async resolveInput ({ resolvedData }) {
        return resolvedData[this.path]
    }
}

const CommonFieldAdapterInterface = superclass =>
    class extends superclass {
        getQueryConditions (dbPath) {
            // https://github.com/Vincit/objection.js/blob/0.9.4/lib/queryBuilder/operations/jsonApi/postgresJsonApi.js
            // TODO(pahaz): gql type `[JSON]` accepts not lists types like true, null.
            // The result is INTERNAL_SERVER_ERROR like "TypeError: Cannot read property 'includes' of null"
            return {
                ...this.equalityConditions(dbPath),
                ...this.inConditions(dbPath),
            }
        }
    }

class JsonMongooseFieldAdapter extends CommonFieldAdapterInterface(MongooseFieldAdapter) {
    /*
     * @param {mongoose.Schema} schema
     */
    addToMongooseSchema (schema) {
        const schemaOptions = {
            type: Object,
        }
        schema.add({ [this.path]: this.mergeSchemaOptions(schemaOptions, this.config) })
        schema.set('strict', false)
    }
}

class JsonKnexFieldAdapter extends CommonFieldAdapterInterface(KnexFieldAdapter) {
    constructor () {
        super(...arguments)

        // Error rather than ignoring invalid config
        // We totally can index these values, it's just not trivial. See issue #1297
        if (this.config.isUnique || this.config.isIndexed) {
            throw 'The Location field type doesn\'t support indexes on Knex. ' +
            `Check the config for ${this.path} on the ${this.field.listKey} list`
        }
    }

    setupHooks ({ addPreSaveHook, addPostReadHook }) {
        addPreSaveHook(item => {
            // Only run the hook if the item actually contains the field
            // NOTE: Can't use hasOwnProperty here
            if (!(this.path in item)) {
                return item
            }

            // ref#PGDB/NULL: convert null to 'null' as pgdb json value!
            // NOTE: there are two types of null in PGDB! null as JSON field value and null as DB default NULL value!
            item[this.path] = stringify(item[this.path])
            return item
        })
    }

    addToTableSchema (table) {
        const column = table.jsonb(this.path)
        if (this.isNotNullable) column.notNullable()
        if (this.defaultTo) column.defaultTo(this.defaultTo)
    }

    inConditions (dbPath, f = stringify) {
        // ref#PGDB/NULL: convert null to 'null' as pgdb json value!
        return {
            [`${this.path}_in`]: value => b =>
                value.includes(null)
                    ? b.whereIn(dbPath, value.map(f)).orWhereNull(dbPath)
                    : b.whereIn(dbPath, value.map(f)),
            [`${this.path}_not_in`]: value => b =>
                value.includes(null)
                    ? b.whereNotIn(dbPath, value.map(f)).whereNotNull(dbPath)
                    : b.whereNotIn(dbPath, value.map(f)).orWhereNull(dbPath),
        }
    }

    equalityConditions (dbPath, f = stringify) {
        // ref#PGDB/NULL: convert null to 'null' as pgdb json value!
        return {
            [this.path]: value => b =>
                value === null ?
                    b.where(dbPath, f(value)).orWhereNull(dbPath) :
                    b.where(dbPath, f(value)),
            [`${this.path}_not`]: value => b =>
                value === null
                    ? b.where(dbPath, '!=', f(value)).whereNotNull(dbPath)
                    : b.where(dbPath, '!=', f(value)),
        }
    }
}

class JsonPrismaFieldAdapter extends CommonFieldAdapterInterface(PrismaFieldAdapter) {
    getPrismaSchema () {
        return [this._schemaField({ type: 'Json' })]
    }
}

module.exports = {
    JsonImplementation,
    JsonKnexFieldAdapter,
    JsonMongooseFieldAdapter,
    JsonPrismaFieldAdapter,
}
