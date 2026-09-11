const { getLogger } = require('@open-condo/keystone/logging')

const logger = getLogger('cross-pool-constraints')

/**
 * Bookkeeping table holding constraints this module dropped, so the change is reversible.
 *
 * Created lazily: a single-pool database never has cross-pool constraints, so it never gets
 * this table. Invisible to kmigrator, which generates Django models from Keystone lists
 * rather than from live DDL.
 */
const DROPPED_CONSTRAINTS_TABLE = '_cross_pool_dropped_constraints'

/**
 * Every Postgres FK constraint in `schemaName`, with both sides of the reference.
 *
 * @param {import('knex').Knex} knex
 * @param {string} schemaName
 * @returns {Promise<Array<{ tableName: string, constraintName: string, referencedTableName: string, definition: string }>>}
 */
async function _getForeignKeys (knex, schemaName) {
    const { rows } = await knex.raw(`
        SELECT rel.relname AS "tableName",
               c.conname AS "constraintName",
               frel.relname AS "referencedTableName",
               pg_get_constraintdef(c.oid, true) AS "definition"
        FROM pg_constraint c
        JOIN pg_class rel ON rel.oid = c.conrelid
        JOIN pg_namespace ns ON ns.oid = rel.relnamespace
        JOIN pg_class frel ON frel.oid = c.confrelid
        WHERE c.contype = 'f' AND ns.nspname = ?
        ORDER BY rel.relname, c.conname
    `, [schemaName])

    return rows
}

async function _bookkeepingTableExists (knex, schemaName) {
    const { rows } = await knex.raw(
        'SELECT 1 FROM information_schema.tables WHERE table_schema = ? AND table_name = ?',
        [schemaName, DROPPED_CONSTRAINTS_TABLE],
    )
    return rows.length > 0
}

async function _ensureBookkeepingTable (knex, schemaName) {
    await knex.raw(`
        CREATE TABLE IF NOT EXISTS ??.?? (
            "tableName" text NOT NULL,
            "constraintName" text NOT NULL,
            "definition" text NOT NULL,
            "droppedAt" timestamptz NOT NULL DEFAULT now(),
            PRIMARY KEY ("tableName", "constraintName")
        )
    `, [schemaName, DROPPED_CONSTRAINTS_TABLE])
}

/**
 * Referenced table from a `FOREIGN KEY (...) REFERENCES "Table"(id) ...` definition.
 *
 * @param {string} definition
 * @returns {string|null} `null` when the definition cannot be parsed
 */
function parseReferencedTable (definition) {
    const match = String(definition || '').match(/\bREFERENCES\s+(?:"([^"]+)"|([A-Za-z0-9_]+))/i)
    if (!match) return null
    return match[1] || match[2]
}

/**
 * Cross-database FK constraints cannot hold anywhere: the referenced rows live in another
 * database, so Postgres would check them against an empty local copy of that table.
 *
 * Compared by physical database, not by pool name — several pools may share one database,
 * and FKs between tables homed on those pools are still satisfiable.
 *
 * Pure decision step — takes introspected constraints, returns the ones to drop.
 *
 * @param {object} options
 * @param {Array<{ tableName: string, referencedTableName: string }>} options.foreignKeys
 * @param {(tableName: string) => string} options.resolveTableDatabase table → home database name
 * @returns {Array} subset of `foreignKeys` whose two sides resolve to different databases
 */
function selectCrossPoolForeignKeys ({ foreignKeys, resolveTableDatabase }) {
    return (foreignKeys || []).filter((foreignKey) => (
        resolveTableDatabase(foreignKey.tableName) !== resolveTableDatabase(foreignKey.referencedTableName)
    ))
}

async function _dropCrossPoolConstraints ({ knex, schemaName, foreignKeys, resolveTableDatabase, dbName }) {
    const crossPoolForeignKeys = selectCrossPoolForeignKeys({ foreignKeys, resolveTableDatabase })
    if (!crossPoolForeignKeys.length) return []

    await _ensureBookkeepingTable(knex, schemaName)

    const dropped = []
    for (const { tableName, constraintName, definition, referencedTableName } of crossPoolForeignKeys) {
        await knex.transaction(async (trx) => {
            await trx.raw('ALTER TABLE ??.?? DROP CONSTRAINT ??', [schemaName, tableName, constraintName])
            await trx.raw(`
                INSERT INTO ??.?? ("tableName", "constraintName", "definition")
                VALUES (?, ?, ?)
                ON CONFLICT ("tableName", "constraintName") DO UPDATE SET "definition" = EXCLUDED."definition"
            `, [schemaName, DROPPED_CONSTRAINTS_TABLE, tableName, constraintName, definition])
        })
        dropped.push({ tableName, constraintName, referencedTableName })
        logger.info({
            msg: 'dropped cross-pool foreign key',
            entity: 'DatabaseConstraint',
            entityId: constraintName,
            data: { dbName, tableName, referencedTableName },
        })
    }

    return dropped
}

/**
 * Re-add constraints recorded earlier whose two tables now live in the same pool
 * (e.g. a table moved back, or the topology collapsed to a single database).
 */
async function _restoreSamePoolConstraints ({ knex, schemaName, liveConstraintNames, resolveTableDatabase, dbName }) {
    if (!(await _bookkeepingTableExists(knex, schemaName))) return []

    const { rows: records } = await knex.raw(
        'SELECT "tableName", "constraintName", "definition" FROM ??.?? ORDER BY "tableName", "constraintName"',
        [schemaName, DROPPED_CONSTRAINTS_TABLE],
    )

    const restored = []
    for (const { tableName, constraintName, definition } of records) {
        const referencedTableName = parseReferencedTable(definition)
        // Unparseable definition: leave the record alone rather than guess at its pool.
        if (!referencedTableName) continue
        if (resolveTableDatabase(tableName) !== resolveTableDatabase(referencedTableName)) continue

        await knex.transaction(async (trx) => {
            if (!liveConstraintNames.has(constraintName)) {
                // `definition` is pg_get_constraintdef output recorded by this module; a constraint
                // body cannot be parameterized and never contains end-user input.
                // nosemgrep: javascript.express.security.injection.tainted-sql-string.tainted-sql-string
                await trx.raw(
                    `ALTER TABLE ??.?? ADD CONSTRAINT ?? ${definition}`,
                    [schemaName, tableName, constraintName],
                )
            }
            await trx.raw(
                'DELETE FROM ??.?? WHERE "tableName" = ? AND "constraintName" = ?',
                [schemaName, DROPPED_CONSTRAINTS_TABLE, tableName, constraintName],
            )
        })
        restored.push({ tableName, constraintName, referencedTableName })
        logger.info({
            msg: 'restored same-pool foreign key',
            entity: 'DatabaseConstraint',
            entityId: constraintName,
            data: { dbName, tableName, referencedTableName },
        })
    }

    return restored
}

/**
 * Align one database with the current table topology.
 *
 * Drops FK constraints whose two tables live in different databases (recording them), then
 * restores recorded constraints that became same-database again. Idempotent, and a no-op on
 * a single-database config because every table then resolves to the same database.
 *
 * Dropping an FK constraint does not drop indexes: Keystone/kmigrator declares FK column
 * indexes separately, so they survive.
 *
 * @param {object} options
 * @param {import('knex').Knex} options.knex
 * @param {(tableName: string) => string} options.resolveTableDatabase table → home database name
 * @param {string} [options.schemaName]
 * @param {string} [options.dbName] label for logs
 * @returns {Promise<{ dbName: string|undefined, dropped: Array<object>, restored: Array<object> }>}
 */
async function reconcileCrossPoolConstraints ({ knex, resolveTableDatabase, schemaName = 'public', dbName }) {
    if (typeof resolveTableDatabase !== 'function') {
        throw new TypeError('reconcileCrossPoolConstraints() requires resolveTableDatabase')
    }

    const foreignKeys = await _getForeignKeys(knex, schemaName)

    const dropped = await _dropCrossPoolConstraints({
        knex, schemaName, foreignKeys, resolveTableDatabase, dbName,
    })

    const droppedConstraintNames = new Set(dropped.map(({ constraintName }) => constraintName))
    const liveConstraintNames = new Set(
        foreignKeys
            .map(({ constraintName }) => constraintName)
            .filter(constraintName => !droppedConstraintNames.has(constraintName)),
    )

    const restored = await _restoreSamePoolConstraints({
        knex, schemaName, liveConstraintNames, resolveTableDatabase, dbName,
    })

    return { dbName, dropped, restored }
}

module.exports = {
    reconcileCrossPoolConstraints,
    selectCrossPoolForeignKeys,
    parseReferencedTable,
    DROPPED_CONSTRAINTS_TABLE,
}
