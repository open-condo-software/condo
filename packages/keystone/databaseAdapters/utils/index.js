const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ISO_DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Rewrites $N placeholders in a raw SQL string to add explicit type casts
 * when the corresponding parameter value can be detected as a specific type.
 * This is needed because Prisma's $queryRawUnsafe sends all parameters as text,
 * causing PostgreSQL to reject comparisons like `uuid = text` or `timestamptz >= text`.
 *
 * Detected types:
 *  - UUID strings → $N::uuid
 *  - ISO datetime strings (e.g. 2025-01-01T00:00:00.000Z) → $N::timestamptz
 *  - Date-only strings (e.g. 2025-01-01) → $N::date
 *
 * @param {string} sql - raw SQL with $1, $2, ... placeholders
 * @param {Array} params - query parameters
 * @returns {string} sql with type casts added where needed
 */
function castUuidParams (sql, params) {
    let result = sql
    for (let i = params.length - 1; i >= 0; i--) {
        const val = params[i]
        let cast = null
        if (typeof val === 'string') {
            if (UUID_RE.test(val)) {
                cast = '::uuid'
            } else if (ISO_DATETIME_RE.test(val)) {
                cast = '::timestamptz'
            } else if (DATE_ONLY_RE.test(val)) {
                cast = '::date'
            }
        } else if (val instanceof Date) {
            cast = '::timestamptz'
        }
        if (cast) {
            const idx = i + 1
            result = result.replace(new RegExp(`\\$${idx}(?![0-9]|::)`, 'g'), `$${idx}${cast}`)
        }
    }
    return result
}

/**
 * Returns active database adapter. Might be helpful when you need to build custom query
 * @param keystone {import('@open-keystone/keystone').Keystone} keystone instance
 * @returns {import('@open-keystone/keystone').BaseKeystoneAdapter}
 */
function getDatabaseAdapter (keystone) {
    return keystone.adapter
}

function getListAdapters (keystone) {
    return keystone.adapter.listAdapters
}

/**
 * Returns true if the active adapter is Prisma-based
 * @param keystone {import('@open-keystone/keystone').Keystone} keystone instance
 * @returns {boolean}
 */
function isPrismaAdapter (keystone) {
    return keystone.adapter.name === 'prisma'
}

/**
 * Converts BigInt values in Prisma raw query result rows to Numbers.
 * Prisma returns BigInt for COUNT/SUM aggregates, which cannot be serialized
 * by JSON.stringify or GraphQL Int scalars.
 *
 * @param {Array<Object>} rows - array of row objects from $queryRawUnsafe
 * @returns {Array<Object>} rows with BigInt values converted to Numbers
 */
function convertPrismaBigInts (rows) {
    if (!Array.isArray(rows)) return rows
    return rows.map(row => {
        const converted = {}
        for (const [key, val] of Object.entries(row)) {
            converted[key] = typeof val === 'bigint' ? Number(val) : val
        }
        return converted
    })
}

/**
 * Executes a raw SQL query using whatever adapter is active (knex or prisma).
 * Returns an array of row objects.
 *
 * @param keystone {import('@open-keystone/keystone').Keystone} keystone instance
 * @param {string} sql - raw SQL string (use $1, $2 for Prisma or ? for knex placeholders)
 * @param {Array} [params] - query parameters
 * @returns {Promise<Array<Object>>}
 */
async function executeRawQuery (keystone, sql, params = []) {
    const adapter = getDatabaseAdapter(keystone)
    if (adapter.name === 'prisma') {
        const rows = await adapter.prisma.$queryRawUnsafe(castUuidParams(sql, params), ...params)
        return convertPrismaBigInts(rows)
    } else {
        const result = await adapter.knex.raw(sql, params)
        return result.rows || result
    }
}

module.exports = {
    getDatabaseAdapter,
    getListAdapters,
    isPrismaAdapter,
    executeRawQuery,
    castUuidParams,
    convertPrismaBigInts,
}
