/**
 * Repairs legacy RentCharge.tenant rows from Occupancy.tenant when the occupancy tenant is valid.
 * Defaults to dry-run and reports unresolved rows.
 *
 * Usage:
 *      yarn workspace @app/condo node bin/repair-legacy-rent-charge-tenant.js
 *      yarn workspace @app/condo node bin/repair-legacy-rent-charge-tenant.js --apply
 */

const index = require('@app/condo')
const commander = require('commander')

const { prepareKeystoneExpressApp } = require('@open-condo/keystone/prepareKeystoneApp')

const {
    createLegacyRentChargeTenantRepairOperations,
    repairLegacyRentChargeTenants,
} = require('@condo/domains/billing/utils/serverSchema/rentChargeTenantRepair')

const program = new commander.Command()

program
    .name('repair-legacy-rent-charge-tenant')
    .option('--apply', 'Persist tenant repairs. Default mode is dry-run')

async function init () {
    const { keystone } = await prepareKeystoneExpressApp(index, { excludeApps: ['NextApp', 'AdminUIApp'] })
    if (!keystone || !keystone.adapter || !keystone.adapter.knex) {
        throw new Error('No KNEX adapter available. Check the DATABASE_URL and Keystone configuration')
    }

    return {
        keystone,
        knex: keystone.adapter.knex,
    }
}

async function main () {
    program.parse(process.argv)
    const options = program.opts()
    const { keystone, knex } = await init()

    try {
        const summary = await repairLegacyRentChargeTenants(
            createLegacyRentChargeTenantRepairOperations(knex),
            { apply: options.apply === true },
        )

        console.log(JSON.stringify(summary, null, 2))
    } finally {
        await keystone.disconnect()
    }
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})