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
        // Controls whether the field is editable in admin UI (used by Field component)
        // When false, Field displays a textarea for editing; when true, displays read-only content
        this.isReadOnly = config.adminConfig?.isReadOnly !== false // Default to true
        
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
        
        // For admin UI, return file metadata as-is (don't deserialize the actual content)
        // The file metadata contains publicUrl, filename, id, etc.
        // The actual file content is loaded separately via GraphQL resolver
        
        // Handle both already-converted objects and legacy values (JSON strings, XML, plain text)
        if (typeof value === 'string') {
            try {
                // Try to parse as JSON (handles legacy JSON string metadata)
                const parsed = JSON.parse(value)
                // If it's an object with file metadata properties, return it
                if (parsed && typeof parsed === 'object') {
                    return parsed
                }
                // Otherwise return the parsed value as-is
                return parsed
            } catch (err) {
                // If parsing fails, it's likely XML or plain text content
                // Return the string as-is (backward compatibility with legacy inline content)
                return value
            }
        }
        
        // Already an object (already converted), return as-is
        if (value && typeof value === 'object') {
            return value
        }
        
        // Fallback for any other type
        return value
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
        // For editable fields, also query the resolved content
        // For read-only fields, only query the raw metadata
        if (!this.isReadOnly) {
            return `${this.path}\n${this.path}Resolved`
        }
        // Return empty fragment to query the database column directly
        // This bypasses the GraphQL field resolver and returns raw file metadata
        return `${this.path}`
    }

    // For simplicity let's disable filtering on this field (PRs welcome)
    getFilterTypes = () => { return [] }
}

export default ExternalContentController
