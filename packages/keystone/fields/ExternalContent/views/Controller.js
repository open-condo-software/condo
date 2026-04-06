import FieldController from '@open-keystone/fields/Controller'

const { DEFAULT_PROCESSORS } = require('@open-condo/keystone/fieldsUtils/ExternalContent/defaultProcessors')

/**
 * @typedef {import('@open-condo/keystone/fieldsUtils/ExternalContent/createExternalDataField').ExternalContentFieldConfig} ExternalContentFieldConfig
 */

class ExternalContentController extends FieldController {
    /**
     * @param {ExternalContentFieldConfig} config - Field configuration
     * @param {...*} args - Additional arguments passed to parent
     */
    constructor (config, ...args) {
        super(config, ...args)
        
        this.format = config.format
        this.processors = config.processors || {}
        
        this.defaultProcessors = DEFAULT_PROCESSORS
    }

    getProcessor = () => {
        const allProcessors = { ...this.defaultProcessors, ...this.processors }
        return allProcessors[this.format]
    }

    deserialize = data => {
        const { path } = this
        if (!data || !data[path]) {
            return null
        }

        const value = data[path]
        const processor = this.getProcessor()
        
        if (!processor) {
            // Fallback if processor not found
            return value
        }

        // Use processor's deserialize function
        try {
            return processor.deserialize(value)
        } catch (err) {
            // If deserialization fails, return the value as-is (backward compatibility)
            return value
        }
    }

    serialize = data => {
        const { path } = this
        if (!data || !data[path]) {
            return null
        }

        const value = data[path]
        const processor = this.getProcessor()
        
        if (!processor) {
            // Fallback if processor not found
            return value
        }

        // Use processor's serialize function
        try {
            return processor.serialize(value)
        } catch (err) {
            return value
        }
    }

    getQueryFragment = () => {
        return `
            ${this.path} ${this.config.graphQLAdminFragment}
        `
    }

    // For simplicity let's disable filtering on this field (PRs welcome)
    getFilterTypes = () => { return [] }
}

export default ExternalContentController
