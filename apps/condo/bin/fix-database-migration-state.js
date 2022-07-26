/**
 * We don't remove any tables/columns from the database for backward compatibility!
 * But we same such tables/columns here to apply it after some day!
 * This script just remove legacy backward compatibility tables and columns!
 *
 * Usage:
 *      yarn workspace @app/condo node bin/fix-database-migration-state.js
 */

const { prepareKeystoneExpressApp } = require('@core/keystone/test.utils')

const index = require('@app/condo')

function exit (code, error) {
    console.error(error)
    process.exit(code)
}

function result (obj) {
    const data = JSON.stringify(obj, null, 2)
    console.log(`

* RESULT *
----------
${data}
----------

`)
    return data
}

async function init () {
    const { keystone } = await prepareKeystoneExpressApp(index, { excludeApps: ['NextApp'] })
    if (!keystone) exit(3, 'ERROR: Wrong prepare Keystone result')
    const adapter = keystone.adapter
    if (!adapter || !adapter._createTables || !adapter.knex) exit(4, 'ERROR: No KNEX adapter! Check the DATABASE_URL or The Keystone configuration')
    const knex = adapter.knex
    return { keystone, knex }
}

async function main () {
    console.info('[INFO] Init keystone ...')

    console.time('init')
    const { knex } = await init()
    console.timeEnd('init')

    return result(await knex.raw(`
BEGIN;
--
-- We don't remove any tables/columns from the database for backward compatibility! But we same such tables/columns here to apply it after some day!
--

--
-- 20210817111732-0043_auto_20210817_1117.js: change id from Number to UUID: remove backward compatibility
--

ALTER TABLE "OrganizationEmployee" DROP COLUMN if exists "old_id";
ALTER TABLE "OrganizationEmployee" DROP COLUMN if exists "old_newId";
ALTER TABLE "OrganizationEmployeeHistoryRecord" DROP COLUMN if exists "old_history_id";
ALTER TABLE "OrganizationEmployee" DROP COLUMN if exists "_old_id";
ALTER TABLE "OrganizationEmployee" DROP COLUMN if exists "_old_newId";
ALTER TABLE "OrganizationEmployeeHistoryRecord" DROP COLUMN if exists "_old_history_id";

COMMIT;
    `))
}

main().then(
    () => process.exit(),
    (error) => {
        console.error(error)
        process.exit(1)
    },
)
