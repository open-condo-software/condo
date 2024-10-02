const Ajv = require('ajv')

const ajv = new Ajv()

const DB_URL_PROTOCOL_PREFIX = 'custom:'
const DB_URL_PATTERN = new RegExp(`${DB_URL_PROTOCOL_PREFIX}{.+}`)

const DB_URL_SCHEMA = {
    type: 'object',
    minProperties: 1,
    additionalProperties: false,
    patternProperties: {
        '^.+$': {
            type: 'string',
            pattern: '^postgresql://.+',
        },
    },
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
        throw new Error('Invalid DB url. Expected prefix "custom:" followed by stringified connection-string dictionary')
    }

    const parsedDBs = JSON.parse(databaseUrl.substring(DB_URL_PROTOCOL_PREFIX.length))
    const isValidConfig = validateDBConfig(parsedDBs)
    if (isValidConfig) {
        return parsedDBs
    }

    throw new Error(`Invalid DB config inside databaseUrl. ${ajv.errorsText(validateDBConfig.errors)}`)
}

module.exports = {
    getNamedDBs,
}