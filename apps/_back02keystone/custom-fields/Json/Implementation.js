const { Implementation } = require('@keystonejs/fields')
const { MongooseFieldAdapter } = require('@keystonejs/adapter-mongoose')
const { KnexFieldAdapter } = require('@keystonejs/adapter-knex')

class JsonImplementation extends Implementation {
    constructor (path, { isMultiline }) {
        super(...arguments)
        this.isMultiline = isMultiline
        this.isOrderable = false
        this.gqlBaseType = 'JSON'
    }

    // Output

    gqlOutputFields () {
        return [`${this.path}: ${this.gqlBaseType}`]
    }

    gqlOutputFieldResolvers () {
        return {
            [`${this.path}`]: item => item[this.path],
        }
    }

    // Input

    gqlQueryInputFields () {
        return [
            ...this.equalityInputFields(this.gqlBaseType),
            ...this.inInputFields(this.gqlBaseType),
        ]
    }

    gqlUpdateInputFields () {
        return [`${this.path}: ${this.gqlBaseType}`]
    }

    gqlCreateInputFields () {
        return [`${this.path}: ${this.gqlBaseType}`]
    }

    extendAdminMeta (meta) {
        const { isMultiline } = this
        return { isMultiline, ...meta }
    }
}

const CommonFieldAdapterInterface = superclass =>
    class extends superclass {
        getQueryConditions (dbPath) {
            // https://github.com/Vincit/objection.js/blob/0.9.4/lib/queryBuilder/operations/jsonApi/postgresJsonApi.js
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

    addToTableSchema (table) {
        const column = table.jsonb(this.path)
        if (this.isNotNullable) column.notNullable()
        if (this.defaultTo) column.defaultTo(this.defaultTo)
    }
}

module.exports = {
    JsonImplementation,
    JsonKnexFieldAdapter,
    JsonMongooseFieldAdapter,
}
