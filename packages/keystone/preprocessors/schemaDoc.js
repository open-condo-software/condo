/**
 * Takes each custom schema and embeds documentation, that will be displayed in GraphiQL.
 * Documentation should be specified in a `doc` property of custom query or mutation configuration.
 */
const values = require('lodash/values')

const { GQL_CUSTOM_SCHEMA_TYPE } = require('../schema')

/**
 * Documentation object for custom GraphQL mutation or query
 *
 * @typedef GQLSchemaDoc
 * @property {String} summary – short textual description about what it does. Be short and explicit, please!
 * @property {String} description - additional details about business logic
 * @property {Array.<GQLError>} errors - set of errors, that can be thrown by this custom mutation or query
 */

/**
 * Keystone custom type config object
 *
 * @typedef KeystoneCustomTypeConfig
 * @property {String} type - declaration of a type according to GraphQL standard
 * @property {Function} access - checks ability to access an instance of this type
 * @see https://v5.keystonejs.com/keystonejs/keystone/#extendgraphqlschemaconfig
 */

/**
 * Keystone config object for custom mutation or query
 *
 * @typedef KeystoneCustomQueryOrMutationConfig
 * @property {String} schema - declaration of a query or mutation according to GraphQL standard
 * @property {Function} access - checks ability to execute this custom query or mutation
 * @property {Function} resolver - implementation of this custom query or mutation
 * @see https://v5.keystonejs.com/keystonejs/keystone/#extendgraphqlschemaconfig
 */

/**
 * Our addon to Keystone config object for custom query or mutation
 *
 * @typedef GQLQueryOrMutationConfig
 * @extends KeystoneCustomQueryOrMutationConfig
 * @property {GQLSchemaDoc} doc
 * @see https://v5.keystonejs.com/keystonejs/keystone/#extendgraphqlschemaconfig
 */

/**
 * Custom Keystone-like schema config, that at first nesting level has the same set of properties as in Keystone,
 * but on a second level it has extra properties
 *
 * @typedef GQLSchemaConfig
 * @property {Array.<KeystoneCustomTypeConfig>} types - A list of objects of the form { type, access } where the type string defines a GraphQL type
 * @property {Array.<GQLQueryOrMutationConfig>} queries - A list of configurations for custom queries
 * @property {Array.<GQLQueryOrMutationConfig>} mutations - A list of configurations for custom mutations
 * @see https://v5.keystonejs.com/keystonejs/keystone/#extendgraphqlschemaconfig
 */

/**
 * Formats error for documentation of GraphQL API in human readable way
 * @param {GQLError} errorConfig
 * @return {string}
 * TODO: localize error message
 */
const formatError = (errorConfig) => (
    '`' + JSON.stringify(errorConfig, null, 2) + '`'
)

/**
 * Formats documentation in human readable way
 * @param {GQLSchemaDoc} doc
 * @return {string}
 */
const formatDoc = ({ summary, description, errors }) => {
    const sections = []
    // GraphiQL wraps first line into `<pre>`, that looks ugly. Put nothing to avoid it
    sections.push('')
    sections.push(summary)
    sections.push(description)
    if (errors) {
        sections.push('**Errors**')
        sections.push('Following objects will be presented in `extensions` property of thrown error')
        sections.push(values(errors).map(formatError).join('\n\n'))
    }
    return sections.join('\n\n')
}

/**
 * Prepends a standard GraphQL comment `"""` before a provided declaration
 * Renders list of errors
 * @param {GQLQueryOrMutationConfig} queryOrMutationConfig declaration of a custom query or mutation
 * @returns {String}
 */
const formatSchemaDeclarationWithDocumentationFor = ({ doc, schema }) => (`
    """
    ${formatDoc(doc)}
    """
    ${schema}
`)

/**
 * If `doc` property is present, render it
 * @param {GQLQueryOrMutationConfig} queryOrMutationConfig - declaration of custom query or mutation
 */
const injectDocumentation = (queryOrMutationConfig) => (
    queryOrMutationConfig.hasOwnProperty('doc')
        ? {
            ...queryOrMutationConfig,
            schema: formatSchemaDeclarationWithDocumentationFor(queryOrMutationConfig),
        }
        : queryOrMutationConfig
)

/**
 * Renders documentation for each custom query and mutation in GraphiQL
 * Should be passed into array of preprocessors for `registerSchemas` util from `packages/keystone/schema.js`
 *
 * @example
 * ```js
 * registerSchemas(keystone, [
 *     // ...
 * ], [schemaDocPreprocessor])
 * ```
 *
 * @param schemaType
 * @param {String} name - custom schema name, that should be unique across entire GraphQL schema
 * @param {GQLSchemaConfig} schema
 * @return {*|{mutations, queries}}
 */
const schemaDocPreprocessor = (schemaType, name, schema) => {
    if (schemaType !== GQL_CUSTOM_SCHEMA_TYPE)
        return schema
    const result = schema
    if (schema.hasOwnProperty('mutations')) {
        schema.mutations = schema.mutations.map(injectDocumentation)
    }
    if (schema.hasOwnProperty('queries')){
        schema.queries = schema.queries.map(injectDocumentation)
    }
    return result
}

module.exports = {
    schemaDocPreprocessor,
}
