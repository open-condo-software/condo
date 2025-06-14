const { GQL_LIST_SCHEMA_TYPE } = require('../schema')

/**
 * Used to escape "" search value causing admin-ui to show no results
 * by specifying non-existent search field to skip no result return when paired with knex
 * Reference: condo/node_modules/@open-keystone/adapter-knex/lib/adapter-knex.js, lines 632-640
 * @type {{searchField: string}}
 */
const ESCAPE_SEARCH_ADAPTER_CONFIG = {
    searchField: 'NonExistentField',
}

const escapeSearchPreprocessor = (schemaType, name, schema) => {
    if (schemaType !== GQL_LIST_SCHEMA_TYPE) {
        return schema
    } else {
        if (schema.hasOwnProperty('escapeSearch') && schema.escapeSearch === true) {
            return {
                ...schema,
                adapterConfig: ESCAPE_SEARCH_ADAPTER_CONFIG,
            }
        }

        return schema
    }
}

module.exports = {
    escapeSearchPreprocessor,
}