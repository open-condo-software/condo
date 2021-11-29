/**
 * Sets "finishAt" to specified value for ServiceSubscription records,
 * which belonging to organizations with ids from specified file,
 * and which satisfies filtering conditions
 *
 * Usage:
 *  yarn workspace @app/condo subscription:prolong <type> <isTrial> <date> <finishAt> <filePathWithOrganizationIds>
 *
 *  <type>
 *      Value for `ServiceSubscription.type` for filtering condition of records, that will be affected with this script
 *  <isTrial>
 *      Value for `ServiceSubscription.isTrial` for filtering condition of records, that will be affected with this script
 *  <date>
 *      New value of `ServiceSubscription.finishAt` for records, that will be affected with this script
 *  <filePathWithOrganizationIds>
 *      Path to file, that contains a list of organization ids, whose subscriptions should be altered. Each id should be on separate line
 *
 * Example:
 *      yarn workspace @app/condo subscription:prolong default true 2021-12-01T12:00:00.000Z ./ids.txt
 */
const fs = require('fs')
const path = require('path')
const readline = require('readline')
const { values } = require('lodash')
const dayjs = require('dayjs')
const { GraphQLApp } = require('@keystonejs/app-graphql')
const { SUBSCRIPTION_TYPE } = require('@condo/domains/subscription/constants')
const { ServiceSubscription } = require('@condo/domains/subscription/utils/serverSchema')

const CORRECT_TYPE_VALUES = ['true', 'false']

const parseArguments = () => {
    const args = process.argv.slice(2)
    if (args.length !== 4) {
        throw new Error('Incorrect number of arguments')
    }
    const [
        //
        type,
        //
        isTrial,
        //
        finishAt,
        //
        filePathWithOrganizationIds,
    ] = args
    if (!values(SUBSCRIPTION_TYPE).includes(type)) {
        throw new Error(`Wrong value of "type" argument. Correct values: ${values(SUBSCRIPTION_TYPE).join(', ')}`)
    }
    const finishAtDate = dayjs(finishAt)
    if (!finishAtDate.isValid()) {
        throw new Error('Wrong value of "date" argument. Correct value is a date in format, supported by dayjs library')
    }
    const fileContentWithOrganizationIds = fs.readFileSync(filePathWithOrganizationIds, 'utf8')
    if (!CORRECT_TYPE_VALUES.includes(isTrial)) {
        throw new Error(`Wrong value of "isTrial" argument. Correct values: ${CORRECT_TYPE_VALUES.join(', ')}`)
    }
    if (!fileContentWithOrganizationIds) {
        throw new Error(`Loaded file "${filePathWithOrganizationIds}" seems to be empty or have incorrect data format`)
    }
    const organizationIds = fileContentWithOrganizationIds.split('\n')
    if (!Array.isArray(organizationIds)) {
        throw new Error(`File ${filePathWithOrganizationIds}, specified in "filePathWithOrganizationIds" argument has wrong format. Each id should be on separate line`)
    }
    return {
        where: {
            type,
            isTrial: isTrial === 'true',
            organization: {
                id_in: organizationIds,
            },
        },
        finishAt: dayjs.utc(finishAt),
    }
}

async function main () {
    const resolved = path.resolve('./index.js')
    const { distDir, keystone, apps } = require(resolved)
    const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)
    // we need only apollo
    await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
    await keystone.connect()

    const { where, finishAt } = parseArguments()

    const adminContext = await keystone.createContext({ skipAccessControl: true })

    console.debug('where', where)
    console.debug('finishAt', finishAt.format())

    const serviceSubscriptions = await ServiceSubscription.getAll(adminContext, where)
    if (serviceSubscriptions.length === 0) {
        console.log(`No ServiceSubscription records found by conditions: ${JSON.stringify(where)}`)
        process.exit(0)
    }
    console.debug(serviceSubscriptions)

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    })

    console.log(`Above are ${serviceSubscriptions.length} ServiceSubscription records, that will get "finishAt" changed to ${finishAt.format()}.\n`)

    rl.question('Continue (y/n)?', async answer => {
        if (answer === 'n') {
            console.log('Do nothing. Bye!')
        } else {
            let processedCount = 0
            await Promise.all(serviceSubscriptions.map(async serviceSubscription => {
                console.log(`Updating service subscription with organization=${serviceSubscription.id}`)
                console.debug('before', serviceSubscription)
                const result = await ServiceSubscription.update(adminContext, serviceSubscription.id, {
                    dv: 1,
                    sender: { dv: 1, fingerprint: 'prolong-subscriptions' },
                    finishAt: finishAt.format(),
                })
                console.debug('after', result)
                processedCount++
            }))
            console.log(`${processedCount === serviceSubscriptions.length ? `All ${processedCount}` : `Only ${processedCount} from ${serviceSubscriptions.length}`} records was processed`)
        }
        process.exit(0)
    })
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})