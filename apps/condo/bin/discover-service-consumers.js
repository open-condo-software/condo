/**
 * Update address by id with new data got from external provider.
 * Use .env to detect particular provider.
 *
 * Usage:
 *      yarn workspace @app/condo node bin/discover-service-consumers [--dry-run] "billingAccountId1, billingAccountId2,..." ["residentId1, residentId2,..."]
 */

const path = require('path')

const set = require('lodash/set')

const { prepareKeystoneExpressApp } = require('@open-condo/keystone/test.utils')

const { discoverServiceConsumers } = require('@condo/domains/resident/utils/serverSchema')

const dv = 1
const sender = { dv, fingerprint: 'discover-service-consumers-script' }

async function main (args) {
    let isDryRun = false

    if (args[0] === '--dry-run') {
        isDryRun = true
        args.shift()
    }

    if (args.length !== 2) {
        throw new Error(`Wrong parameters "${args.join(',')}"! Usage: discover-service-consumers [--dry-run] "billingAccountId1, billingAccountId2,..." ["residentId1, residentId2,..."]`)
    }

    const [billingAccountsIds, residentsIds] = args

    const { keystone: context } = await prepareKeystoneExpressApp(path.resolve('./index.js'), { excludeApps: ['NextApp', 'AdminUIApp'] })


    const data = { dv, sender, billingAccountsIds }

    if (residentsIds) {
        set(data, ['filters', 'residentsIds'], residentsIds)
    }

    console.log(`discoverServiceConsumers data: ${JSON.stringify(data)}`)

    if (isDryRun) {
        console.log('Nothing changed in database')
    } else {
        const result = await discoverServiceConsumers(context, data)

        console.log(`discoverServiceConsumers result: ${JSON.stringify(result)}`)
    }
}

main(process.argv.slice(2)).then(
    () => {
        console.info('✅ All done!')
        process.exit()
    },
    (error) => {
        console.error(error)
        process.exit(1)
    },
)
