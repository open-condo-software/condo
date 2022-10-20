const fs = require('fs')
const tjs = require('typescript-json-schema')
const Ajv = require('ajv')
const get = require('lodash/get')

/**
 * Consumes path of generated schema.ts file and creates schema-generator from it
 * Validates the correctness of the requested fields and filters for registered models
 */
class WebHookModelValidator {
    constructor (schemaPath) {
        if (typeof schemaPath !== 'string' || schemaPath.split('.').pop() !== 'ts') {
            throw new Error('Schema file type is not supported. For now only .ts files are supported.')
        } else if (!fs.existsSync(schemaPath)) {
            throw new Error('Schema file does not exist!')
        }
        const program = tjs.getProgramFromFiles([schemaPath])
        this.generator = tjs.buildGenerator(program, { noExtraProps: true })
        this.models = []
        this.filterValidators = {}
        this.fieldsValidators = {}
    }

    /**
     * Registers GraphQL model from schema in internal base
     * Also generates JSON-schema validators for validating its fields and filters
     * @param {string} modelName
     */
    registerModel (modelName) {
        if (this.models.includes(modelName)) return

        this.models.push(modelName)

        const modelFilterSchema = this.generator.getSchemaForSymbol(`${modelName}WhereInput`)
        const ajv = new Ajv({ strict: true, allErrors: true })
        ajv.validateSchema(modelFilterSchema)
        if (ajv.errors) {
            throw new Error(`Schema for class ${modelName}WhereInput is not valid!`)
        }
        this.filterValidators[modelName] = ajv.compile(modelFilterSchema)

        const modelSchema = this.generator.getSchemaForSymbol(modelName)
        ajv.validateSchema(modelSchema)
        if (ajv.errors) {
            throw new Error(`Schema for class ${modelName} is not valid!`)
        }
        const maskedSchema = WebHookModelValidator._maskSchemaTypes(modelSchema)
        ajv.validateSchema(maskedSchema)
        if (ajv.errors) {
            throw new Error(`Masked schema for class ${modelName} is not valid!`)
        }
        this.fieldsValidators[modelName] = ajv.compile(maskedSchema)
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
        const validator = this.filterValidators[modelName]
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
     * Accepts generated JSON-schema and moves every property types to boolean
     * Also flattens arrays types and adds minimal amount of specified properties to schema
     * @param {any} schema
     * @returns {any}
     * @private
     */
    static _maskSchemaTypes (schema) {
        if (typeof schema !== 'object') {
            return schema
        }

        // NOTE: Deep cloning JSON object
        const newSchema = JSON.parse(JSON.stringify(schema))

        const type = get(newSchema, 'type')
        if (type) {
            if (type === 'object') {
                for (const key of Object.keys(newSchema.properties)) {
                    newSchema.properties[key] = WebHookModelValidator._maskSchemaTypes(newSchema.properties[key])
                    newSchema.minProperties = 1
                }

                return newSchema
            } else if (type === 'array') {
                return WebHookModelValidator._maskSchemaTypes(newSchema.items)
            } else {
                return {
                    type: 'boolean',
                }
            }
        } else {
            for (const key of Object.keys(newSchema)) {
                newSchema[key] = WebHookModelValidator._maskSchemaTypes(newSchema[key])
            }

            return newSchema
        }
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
