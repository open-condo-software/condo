const Ajv = require('ajv')

const ajv = new Ajv({ useDefaults: true })

const DB_URL_PROTOCOL_PREFIX = 'custom:'
const DB_URL_PATTERN = new RegExp(`${DB_URL_PROTOCOL_PREFIX}{.+}`)
const ANY_CHAR_PATTERNS = '^.+$'

const DB_URL_SCHEMA = {
    type: 'object',
    minProperties: 1,
    additionalProperties: false,
    patternProperties: {
        [ANY_CHAR_PATTERNS]: {
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
 * @param {string | undefined} databaseUrl - custom db url. Example: 'custom:{"write": "postgresql://postgres:postgres@127.0.0.1:5433/local-condo", "async_replica": "postgresql://postgres:postgres@127.0.0.1:5432/local-condo"}'
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

function _createBasicReplicaPoolsSchema (availableDatabases) {
    return {
        type: 'object',
        minProperties: 1,
        additionalProperties: false,
        patternProperties: {
            '^.+$': {
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

function getReplicaPoolsConfig (configString, availableDatabases) {
    if (!configString || typeof configString !== 'string') {
        throw new TypeError(`Invalid DB pools config passed. String was expected, but got ${typeof configString}`)
    }
    let parsedConfig = JSON.parse(configString)
    const validationSchema = _createBasicReplicaPoolsSchema(availableDatabases)
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

module.exports = {
    getNamedDBs,
    getReplicaPoolsConfig,
}