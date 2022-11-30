/**
 * We don't remove any tables/columns from the database for backward compatibility!
 * But we need to save backward-incompatible changes to apply it someday! 
 * Backward compatibility is required but we also need a way to remove legacy compatibility tables and columns.
 * This script solves this problem!
 * This script simply removes legacy backward compatibility tables and columns!
 *
 * Usage:
 *      yarn workspace @app/condo node bin/fix-database-migration-state.js
 */

const { prepareKeystoneExpressApp } = require('@open-condo/keystone/test.utils')

const index = require('@app/condo')

function exit (code, error) {
    console.error(error)
    process.exit(code)
}

function printResult (obj) {
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

    return printResult(await knex.raw(`
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

--
-- 20221013121613-0177_assigneescope_assigneescopehistoryrecord_and_more.js: Drop Division_properties_many,
-- Division_executors_many, Division, DivisionHistoryRecord, OrganizationEmployee_specializations_many tables
--

DROP TABLE "Division_properties_many" CASCADE;
DROP TABLE "Division_executors_many" CASCADE;
DROP TABLE "Division" CASCADE;
DROP TABLE "DivisionHistoryRecord" CASCADE;
DROP TABLE "OrganizationEmployee_specializations_many" CASCADE;


--
-- 20221102170215-0184_auto_20221102_1402.js: remove old TokenSet table: we use redis at the moment
--

DROP TABLE "TokenSet" CASCADE;
DROP TABLE "TokenSetHistoryRecord" CASCADE;

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
