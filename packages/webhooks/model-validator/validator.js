const fs = require('fs')

const { GraphQLFileLoader } = require('@graphql-tools/graphql-file-loader')
const { loadSchemaSync } = require('@graphql-tools/load')
const Ajv = require('ajv')
const { introspectionFromSchema } = require('graphql')
const { fromIntrospectionQuery } = require('graphql-2-json-schema')
const get = require('lodash/get')

/**
 * Consumes path of generated schema.ts file and creates schema-generator from it
 * Validates the correctness of the requested fields and filters for registered models
 */
class WebHookModelValidator {
    constructor (schemaPath) {
        if (typeof schemaPath !== 'string' || schemaPath.split('.').pop() !== 'graphql') {
            throw new Error('Schema file type is not supported. For now only .graphql files are supported.')
        }
        const resolvedPath = require.resolve(schemaPath)
        if (!fs.existsSync(resolvedPath)) {
            throw new Error('Schema file does not exist!')
        }
        this.schemaPath = resolvedPath
        this.models = []
        this.fieldsAJV = new Ajv()
        this.filtersAJV = new Ajv()
        this.fieldsValidators = {}
        this.filtersValidators = {}

        const gqlSchema = loadSchemaSync(this.schemaPath, {
            loaders: [new GraphQLFileLoader()],
        })
        const gqlIntrospection = introspectionFromSchema(gqlSchema)
        const jsonSchema = fromIntrospectionQuery(gqlIntrospection, { nullableArrayItems: false, ignoreInternals: true })
        const { models, filters } = this._extractDefinitionNames(jsonSchema)

        const fieldsSchema = this._processSchema(jsonSchema, models, 'fields')
        this.fieldsAJV.validateSchema(fieldsSchema)
        if (this.fieldsAJV.errors) {
            throw new Error('Schema for fields validation is not valid!')
        }
        this.fieldsAJV.addSchema(fieldsSchema)

        const filtersSchema = this._processSchema(jsonSchema, filters, 'filters')
        this.filtersAJV.validateSchema(filtersSchema)
        if (this.filtersAJV.errors) {
            throw new Error('Schema for filters validation is not valid!')
        }
        this.filtersAJV.addSchema(filtersSchema)
    }

    /**
     * Build schema from specified definitions by using _parseObject recursively
     * @param schema source schema containing redundant types
     * @param definitions list of definitions to build a new schema from
     * @param type "filters" | "fields"
     * @returns {any}
     * @private
     */
    _processSchema (schema, definitions, type = 'filters') {
        const result = {
            definitions: {
                ID: type === 'filters' ? { type: 'string' } : { type: 'boolean' },
            },
        }

        const processed = ['ID']
        const to_process = [...definitions]
        const onRef = (defName) => {
            to_process.push(defName)
        }
        while (to_process.length) {
            const defName = to_process.pop()
            if (!processed.includes(defName) && schema.definitions[defName]) {
                result.definitions[defName] = this._parseObject(schema.definitions[defName], type, onRef)
            }

            processed.push(defName)
        }

        return result
    }

    /**
     * Extracts all filters names by selecting strings with "WhereInput" endings.
     * Then forms model name by dropping that ending: "MyModelWhereInput" -> "MyModel"
     * @param schema
     * @returns {{models: string[], filters: string[]}}
     * @private
     */
    _extractDefinitionNames (schema) {
        const defs = get(schema, 'definitions', {})
        const filters = Object.keys(defs).filter(key => key.endsWith('WhereInput'))
        const models = filters.map(key => key.slice(0, -10))

        return { filters, models }
    }

    /**
     * Parses sub-schema obj and does the following:
     * 1. Drops all redundant properties from sub-schema object to reduce schema size
     * 2. Convert primitive types to boolean for "fields" objType, or pass it "as is" for "filters"
     * 3. Flattens array wrapping for "fields" objType, or pass it "as is" for "filters"
     * 4. Merges all enums options into single enum list
     * 5. Flattens "return" wrapper which is added by 'graphql-2-json-schema' converter
     * 6. Adds non-emptiness and no-additional-properties for objects
     * @param obj sub-schema
     * @param objType "filters" | "fields"
     * @param onRef callback to process nested definitions
     * @returns {any}
     * @private
     */
    _parseObject (obj, objType, onRef) {
        // oneOf, anyOf and ref case
        if (!obj.type) {
            if (obj['$ref']) {
                // Register ref
                onRef(obj['$ref'].substring(14))
                return { '$ref': obj['$ref'] }
            }
            if (obj.anyOf) {
                return {
                    anyOf: obj.anyOf.map(element => this._parseObject(element, objType, onRef)),
                }
            }
            if (obj.allOf) {
                return {
                    allOf: obj.allOf.map(element => this._parseObject(element, objType, onRef)),
                }
            }

            return obj
        }
        // remove description
        if (['number', 'boolean', 'null'].includes(obj.type)) {
            return objType === 'fields' ? { type: 'boolean' } : { type: obj.type }
        }
        // remove description, squash options
        if (obj.type === 'string') {
            if (objType === 'fields') {
                return { type: 'boolean' }
            }
            const result = { type: 'string' }
            if (obj.anyOf) {
                const stringEnum = []
                for (const option of obj.anyOf) {
                    if (option.enum) {
                        stringEnum.push(...option.enum)
                    }
                }
                if (stringEnum.length) {
                    result.enum = stringEnum
                }
            }

            return result
        }

        if (obj.type === 'object') {
            if (obj.properties) {
                // GQL Output Type added by converter
                if (obj.properties.return) {
                    return this._parseObject(obj.properties.return, objType, onRef)
                }

                const required = obj.required || []
                const properties = {}
                for (const key of Object.keys(obj.properties)) {
                    const property = this._parseObject(obj.properties[key], objType, onRef)
                    // Nullable filters
                    if (objType === 'filters' && !required.includes(key) && property['$ref']) {
                        properties[key] = {
                            anyOf: [
                                property,
                                { type:'null' },
                            ],
                        }
                    } else {
                        properties[key] = property
                    }
                }

                // Add conditions for non-emptiness, only existing fields
                return {
                    type: 'object',
                    properties,
                    // Empty filters are acceptable
                    minProperties: objType === 'filters' ? 0 : 1,
                    additionalProperties: false,
                }
            } else {
                return objType === 'fields' ? { type: 'boolean' } :  { type: 'object' }
            }
        }

        if (obj.type === 'array') {
            // Escape arrays on fields: [MyType] -> MyType
            if (objType === 'fields') {
                return this._parseObject(obj.items, objType, onRef)
            }
            // No escape on filters
            return {
                type: 'array',
                items: this._parseObject(obj.items, objType, onRef),
            }
        }

        return obj
    }

    /**
     * Registers GraphQL model from schema in internal base
     * Also generates JSON-schema validators for validating its fields and filters
     * @param {string} modelName
     */
    registerModel (modelName) {
        if (this.models.includes(modelName)) return
        this.fieldsValidators[modelName] = this.fieldsAJV.getSchema(`#/definitions/${modelName}`)
        this.filtersValidators[modelName] = this.filtersAJV.getSchema(`#/definitions/${modelName}WhereInput`)
        if (!this.fieldsValidators[modelName]) {
            throw new Error(`Sub-schema for  #/definitions/${modelName} was not found!`)
        }
        if (!this.filtersValidators[modelName]) {
            throw new Error(`Sub-schema for #/definitions/${modelName}WhereInput was not found!`)
        }

        this.models.push(modelName)
    }

    /**
     * Validates specified model filters
     * @param {string} modelName
     * @param {JSON} filters
     * @returns {{isValid: boolean, errors: *[]}}
     */
    validateFilters (modelName, filters) {
        if (!this.models.includes(modelName)) {
            throw new Error(`Unregistered model name: ${modelName}`)
        }
        const validator = this.filtersValidators[modelName]
        const isValid = validator(filters)
        if (isValid) {
            return { isValid, errors: [] }
        } else {
            return { isValid, errors: validator.errors }
        }
    }

    /**
     * Validates normalized field-string (Subset of model fields in GQL notation)
     * @param modelName
     * @param {string} modelName
     * @param {string} fieldString
     * @returns {{isValid: boolean, errors: string[]}|{isValid, errors}|{isValid, errors: *[]}}
     */
    validateFields (modelName, fieldString) {
        if (!this.models.includes(modelName)) {
            throw new Error(`Unregistered model name: ${modelName}`)
        }
        const validator = this.fieldsValidators[modelName]
        const { data, error } = WebHookModelValidator._buildSampleFromFieldsString(fieldString)
        if (error) {
            return { isValid: false, errors: [error] }
        } else {
            const isValid = validator(data)
            if (isValid) {
                return { isValid, errors: [] }
            } else {
                return { isValid, errors: validator.errors }
            }
        }
    }

    /**
     * Wraps field-string in brackets if needed and also fixes spacing issues to make
     * @param {string} fields
     * @returns {string}
     */
    static normalizeFieldsString (fields) {
        let trimmedString = fields.trim()
        if (!trimmedString) {
            trimmedString = '{}'
        } else if (!trimmedString.startsWith('{')) {
            trimmedString = `{${trimmedString}}`
        }
        const expandedChars = []
        for (let i = 0; i < trimmedString.length; ++i) {

            if (trimmedString[i] === '{' || trimmedString[i] === '}') {
                expandedChars.push(' ', trimmedString[i], ' ')
            } else {
                expandedChars.push(trimmedString[i])
            }
        }

        return expandedChars.join('').trim().split(/\s+/).join(' ')
    }

    /**
     * Tries to build a JSON sample from normalized field-string to pass it into validator
     * created by _maskSchemaTypes
     * @param {string} fieldsString
     * @returns {object}
     * @private
     */
    static _buildSampleFromFieldsString (fieldsString) {
        const parts =  fieldsString.split(' ')
        const mappedParts = parts.map((part, index) => {
            if (part === '{') {
                return part
            } else {
                let result
                if (part === '}' || part === '{') {
                    result = part
                } else if (index < parts.length - 1) {
                    result = parts[index + 1] === '{' ? `"${part}":` : `"${part}": true`
                } else {
                    result = `"${part}": true`
                }

                if (index < parts.length - 1 && parts[index + 1] !== '}' && parts[index + 1] !== '{') {
                    result += ','
                }

                return result
            }
        })

        try {
            const sample = JSON.parse(mappedParts.join(' '))
            return { data: sample, error: null }
        } catch (error) {
            return { data: null, error: `Cannot convert fields string to JSON sample object: ${error.message}` }
        }
    }
}

module.exports = {
    WebHookModelValidator,
}
