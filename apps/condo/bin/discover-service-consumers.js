/**
 * Update address by id with new data got from external provider.
 * Use .env to detect particular provider.
 *
 * Usage:
 *      yarn workspace @app/condo node bin/discover-service-consumers [--dry-run] "some address" unitType unitName [billingAccountId [residentId]]
 */

const path = require('path')

const get = require('lodash/get')

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

    if (args.length !== 3) {
        throw new Error(`Wrong parameters "${args.join(',')}"! Usage: discover-service-consumers [--dry-run] "some address" unitType unitName [billingAccountId [residentId]]`)
    }

    const [address, unitType, unitName, billingAccountId, residentId] = args

    const { keystone: context } = await prepareKeystoneExpressApp(path.resolve('./index.js'), { excludeApps: ['NextApp', 'AdminUIApp'] })


    const data = {
        dv,
        sender,
        address,
        unitType,
        unitName,
    }

    if (billingAccountId) {
        data['billingAccount'] = { id: billingAccountId }
    }

    if (residentId) {
        data['resident'] = { id: residentId }
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
