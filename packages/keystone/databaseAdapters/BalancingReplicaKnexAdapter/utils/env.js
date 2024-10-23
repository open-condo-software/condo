const Ajv = require('ajv')

const { SUPPORTED_PG_OPERATIONS } = require('./sql')

const ajv = new Ajv({ useDefaults: true })

const DB_URL_PROTOCOL_PREFIX = 'custom:'
const DB_URL_PATTERN = new RegExp(`${DB_URL_PROTOCOL_PREFIX}{.+}`)
const ANY_CHAR_PATTERN = '^.+$'
const IMMUTABLE_OPERATIONS = new Set(['select', 'show'])
// NOTE: detects names of pg tables / queries / mutations
const SIMPLE_NAME_PATTERN = /^[a-z\d_+]+$/i

const DB_URL_SCHEMA = {
    type: 'object',
    minProperties: 1,
    additionalProperties: false,
    patternProperties: {
        [ANY_CHAR_PATTERN]: {
            type: 'string',
            pattern: '^postgresql://.+',
        },
    },
}

const BALANCER_OPTIONS_SCHEMAS = {
    'RoundRobin': null,
}

const validateDBConfig = ajv.compile(DB_URL_SCHEMA)

/**
 * Converts custom database url string to dictionary of form Record<db_name, connection_string>
 *
 * NOTE: DB_NAME is important here, since it all dbs will be grouped together by names later.
 * Flat connection string is good, but it can contain query parameters for configuration,
 * and required to be the same across all others env values, so assigning a name to it is easier to maintain
 *
 * @param {string | undefined} databaseUrl - custom db url. Example: 'custom:{"main": "postgresql://****:****@127.0.0.1:5433/local-condo", "async_replica": "postgresql://****:****@127.0.0.1:5432/local-condo"}'
 * @returns {Record<string, string>} - parsed dictionary of form Record<db_name, connection_string>.
 */
function getNamedDBs (databaseUrl) {
    if (!databaseUrl || typeof databaseUrl !== 'string' || !DB_URL_PATTERN.test(databaseUrl)) {
        throw new TypeError('Invalid DB url. Expected prefix "custom:" followed by stringified connection-string dictionary')
    }

    const parsedDBs = JSON.parse(databaseUrl.substring(DB_URL_PROTOCOL_PREFIX.length))
    const isValidConfig = validateDBConfig(parsedDBs)
    if (isValidConfig) {
        return parsedDBs
    }

    throw new TypeError(`Invalid DB config inside databaseUrl. ${ajv.errorsText(validateDBConfig.errors)}`)
}

/**
 * Generates ajv validation schema for replica pools based on available databases (obtained from getNamedDBs)
 * NOTE: for internal use only
 * @param {Array<string>} availableDatabases - name of databases, which are available for use in adapter
 * @returns {Object}
 * @private
 */
function _createReplicaPoolsSchema (availableDatabases) {
    return {
        type: 'object',
        minProperties: 1,
        additionalProperties: false,
        patternProperties: {
            [ANY_CHAR_PATTERN]: {
                type: 'object',
                properties: {
                    databases: {
                        type: 'array',
                        items: {
                            type: 'string',
                            enum: availableDatabases,
                        },
                        minItems: 1,
                    },
                    writable: { type: 'boolean' },
                    balancer: {
                        type: 'string',
                        enum: Object.keys(BALANCER_OPTIONS_SCHEMAS),
                        default: 'RoundRobin', // default balancer
                    },
                    balancerOptions: { type: 'object' }, // will be redefined based on balancer value
                },
                required: ['databases', 'writable', 'balancer'],
                additionalProperties: false,
                oneOf: [
                    ...Object.entries(BALANCER_OPTIONS_SCHEMAS)
                        .map(([balancerName, optionsSchema]) => optionsSchema
                            ? {
                                properties: {
                                    balancer: { const: balancerName },
                                    balancerOptions: optionsSchema,
                                },
                                required: ['databases', 'writable', 'balancer', 'balancerOptions'],
                            }
                            : {
                                properties: {
                                    balancer: { const: balancerName },
                                    balancerOptions: { not: {} },
                                },
                                required: ['databases', 'writable'],
                            }
                        ),

                ],
            },
        },
    }
}

/**
 * Parses replica pool config from env string or from object itself.
 * Validates it correctness and fills default values when necessary
 * @param {Object | string} config - pools configuration, for examples refer to env.spec.js
 * @param {Array<string>} availableDatabases - name of databases, which are available for use in adapter
 * @returns {Object}
 */
function getReplicaPoolsConfig (config, availableDatabases) {
    if (!config || (typeof config !== 'string' && typeof config !== 'object')) {
        throw new TypeError(`Invalid DB pools config passed. Object or its stringified representation was expected, but got ${typeof config}`)
    }

    const parsedConfig = typeof config === 'string' ? JSON.parse(config) : config
    const validationSchema = _createReplicaPoolsSchema(availableDatabases)
    const validateConfig = ajv.compile(validationSchema)

    const isValidConfig = validateConfig(parsedConfig)

    if (!isValidConfig) {
        throw new TypeError(`Invalid DB pools config. ${ajv.errorsText(validateConfig.errors)}`)
    }

    if (!Object.values(parsedConfig).some(poolConfig => poolConfig.writable)) {
        throw new TypeError('Invalid DB pools config. Expected at least 1 pool to be writable')
    }

    return parsedConfig
}

/**
 * Generates ajv validation schema for routing rules based on available pools (obtained from getReplicaPoolsConfig)
 * NOTE: for internal use only
 * @param {Array<string>} availablePools - name of pools, which are available for use in adapter
 * @returns {Object}
 * @private
 */
function _createRoutingRulesSchema (availablePools) {
    return {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                gqlOperationType: { type: 'string', enum: ['query', 'mutation'] },          // which INITIAL GQL operation type triggered SQL query
                gqlOperationName: { type: 'string' },                                       // which INITIAL GQL operation triggered SQL query, can be string or regexp
                sqlOperationName: { type: 'string', enum: [...SUPPORTED_PG_OPERATIONS] },   // which SQL method is triggered (select, update etc.)
                tableName: { type: 'string' },                                              // which table is being interacted with, can be string or regexp
                target: { type: 'string', enum: availablePools },                           // to which pool the request must go
            },
            required: ['target'],
            additionalProperties: false,
        },
        minItems: 1,
    }
}

/**
 * Helper util to determine default rule.
 * Default rule - rule without any conditions, so only target is presented
 * @param {Object} rule
 * @returns {boolean}
 */
function isDefaultRule (rule) {
    const keys = Object.keys(rule)
    return keys.length === 1 && keys[0] === 'target'
}

/**
 * Helper util that determines if the passed string is a RegExp
 * @param {string} name
 * @returns {boolean}
 * @private
 */
function _isRegExpPattern (name) {
    return !SIMPLE_NAME_PATTERN.test(name)
}

/**
 * Parses routing rules config, validates its correctness, converts types from JSON and returns parsed result
 *
 * Config is correct if:
 * 1. It ends with default rule
 * 2. Default rule points to writable target
 * 3. All pools from rule's target exists
 * 4. No sql operations except of select and show goes to read-only pool
 * 5. All mutations are going to writeable pools

 * @param {Object | string} routingConfig - routing configuration, for examples refer to env.spec.js
 * @param {Object} poolsConfig - pools config obtained from getReplicaPoolsConfig
 * @returns {Object}
 */
function getQueryRoutingRules (routingConfig, poolsConfig) {
    if (!routingConfig || (typeof routingConfig !== 'string' && !Array.isArray(routingConfig))) {
        throw new TypeError(`Invalid routing rules provided. Expect array of rules or its string representation, but got ${typeof routingConfig}`)
    }

    const availablePools = Object.keys(poolsConfig)

    const parsedRules = typeof routingConfig === 'string' ? JSON.parse(routingConfig) : routingConfig
    const validationSchema = _createRoutingRulesSchema(availablePools)
    const validateConfig = ajv.compile(validationSchema)

    const isValidConfig = validateConfig(parsedRules)

    if (!isValidConfig) {
        throw new TypeError(`Invalid routing rules config. ${ajv.errorsText(validateConfig.errors)}`)
    }

    // Rules type conversions
    const modifiedRules = parsedRules.map(rule => {
        const copiedRule = { ...rule }
        if (copiedRule.gqlOperationName && _isRegExpPattern(copiedRule.gqlOperationName)) {
            // NOTE: Input is taken from .env and checked via code-review, so it's not applicable
            // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
            copiedRule.gqlOperationName = new RegExp(copiedRule.gqlOperationName)
        }
        if (copiedRule.tableName && _isRegExpPattern(copiedRule.tableName)) {
            // NOTE: Input is taken from .env and checked via code-review, so it's not applicable
            // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
            copiedRule.tableName = new RegExp(copiedRule.tableName)
        }

        return copiedRule
    })


    // Rules validation
    modifiedRules.forEach((rule, idx) => {
        const { gqlOperationType, target, sqlOperationName, tableName } = rule

        const commonErrorPrefix = `[${idx + 1}/${parsedRules.length}] Routing rule configuration error. `

        // GQL-level guard
        if (gqlOperationType === 'mutation' && !poolsConfig[target].writable) {
            // NOTE: if table not specified and sqlOperation is mutable or not specified -> requests should go to writeable
            if (!(sqlOperationName && IMMUTABLE_OPERATIONS.has(sqlOperationName)) && !tableName) {
                throw new TypeError(
                    commonErrorPrefix +
                    '"gqlOperationType" is set to "mutation", while target pool is not writable. ' +
                    'You should change target or add more conditions, like "sqlOperationName" or "tableName"'
                )
            }
        }

        // SQL-level guards
        if (sqlOperationName && !IMMUTABLE_OPERATIONS.has(sqlOperationName) && !poolsConfig[target].writable) {
            throw new TypeError(
                commonErrorPrefix +
                `"sqlOperationName" is set to "${sqlOperationName}", while target pool is not writable`
            )
        }

        // Default rule guards

        // Non-filter rule { target: "name" } must go to writable pool
        if (isDefaultRule(rule) && !poolsConfig[target].writable) {
            throw new TypeError(
                commonErrorPrefix +
                'Rule with no filters must point to writable target'
            )
        }

        // Default rule must be at the end of the chain
        if (isDefaultRule(rule) && idx !== parsedRules.length - 1) {
            throw new TypeError(
                commonErrorPrefix +
                'Rule with no filters must be at the end of the rule chain'
            )
        }

        // Default rule must be at the end of the chain
        if (idx === parsedRules.length - 1 && !isDefaultRule(rule)) {
            throw new TypeError(
                commonErrorPrefix +
                'Latest rule in chain must contains no filters'
            )
        }
    })

    return modifiedRules
}



module.exports = {
    isDefaultRule,
    getNamedDBs,
    getReplicaPoolsConfig,
    getQueryRoutingRules,
}