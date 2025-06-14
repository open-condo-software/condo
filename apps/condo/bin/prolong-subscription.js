/**
 * Sets "finishAt" to specified value for ServiceSubscription records,
 * which belonging to organizations with ids from specified file,
 * and which satisfies filtering conditions
 *
 * Usage:
 *  yarn workspace @app/condo subscription:prolong <type> <isTrial> <finishAt> <filePathWithOrganizationIds>
 *
 *  <type>
 *      Value for `ServiceSubscription.type` for filtering condition of records, that will be affected with this script
 *  <isTrial>
 *      Value for `ServiceSubscription.isTrial` for filtering condition of records, that will be affected with this script
 *  <duration>
 *      Relative amount in format of "N unit", like "3 days", on that the `ServiceSubscription.finishAt` for each selected record will be increased.
 *      Where "unit" value should belong to UNIT_VALUES
 *  <filePathWithOrganizationIds>
 *      Path to file, that contains a list of organization ids, whose subscriptions should be altered. Each id should be on separate line
 *
 * Example:
 *      cd apps/condo
 *      yarn node ./bin/prolong-subscription.js default true '15 days' ./ids.txt
 */
const fs = require('fs')
const path = require('path')
const readline = require('readline')

const { GraphQLApp } = require('@open-keystone/app-graphql')
const dayjs = require('dayjs')
const { values, identity, filter } = require('lodash')

const { SUBSCRIPTION_TYPE } = require('@condo/domains/subscription/constants')
const { ServiceSubscription } = require('@condo/domains/subscription/utils/serverSchema')

const CORRECT_TYPE_VALUES = ['true', 'false']

const UNIT_VALUES = [
    'days',
    'weeks',
    'months',
    'years',
    'hours',
    'minutes',
    'seconds',
    'milliseconds',
]

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
        duration,
        //
        filePathWithOrganizationIds,
    ] = args
    if (!values(SUBSCRIPTION_TYPE).includes(type)) {
        throw new Error(`Wrong value of "type" argument. Correct values: ${values(SUBSCRIPTION_TYPE).join(', ')}`)
    }
    if (!CORRECT_TYPE_VALUES.includes(isTrial)) {
        throw new Error(`Wrong value of "isTrial" argument. Correct values: ${CORRECT_TYPE_VALUES.join(', ')}`)
    }
    const fileContentWithOrganizationIds = fs.readFileSync(filePathWithOrganizationIds, 'utf8')
    if (!fileContentWithOrganizationIds) {
        throw new Error(`Loaded file "${filePathWithOrganizationIds}" seems to be empty or have incorrect data format`)
    }
    const organizationIds = filter(fileContentWithOrganizationIds.split('\n'), identity)
    if (!Array.isArray(organizationIds)) {
        throw new Error(`File ${filePathWithOrganizationIds}, specified in "filePathWithOrganizationIds" argument has wrong format. Each id should be on separate line`)
    }

    let increaseFinishAtBy
    const parsedDuration = duration.split(' ')
    const [ amount, unit ] = parsedDuration
    if (parsedDuration.length !== 2) {
        throw new Error(`Wrong format of relative "finishAt" argument with provided value "${duration}". It should be provided in format "N units", where "N" is an integer representing amount and "units" is a duration unit, supported by https://day.js.org/docs/en/durations/durations, for example "days", "months" etc.`)
    } else if (!UNIT_VALUES.includes(unit)) {
        throw new Error(`Invalid unit type part "${unit}" for argument <duration> with value "${duration}". It should belong to UNIT_VALUES.`)
    } else if (Number.isNaN(parseInt(amount))) {
        throw new Error(`Invalid amount part "${amount}" for argument <duration> with value "${duration}". It should be a number.`)
    } else {
        increaseFinishAtBy = parsedDuration
    }

    return {
        where: {
            type,
            isTrial: isTrial === 'true',
            organization: {
                id_in: organizationIds,
            },
        },
        increaseFinishAtBy,
    }
}

async function main () {
    const resolved = path.resolve('./index.js')
    const { distDir, keystone, apps } = require(resolved)
    const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)
    // we need only apollo
    await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
    await keystone.connect()

    const { where, increaseFinishAtBy } = parseArguments()

    const adminContext = await keystone.createContext({ skipAccessControl: true })

    console.debug('where', where)
    console.debug('increaseFinishAtBy', increaseFinishAtBy)

    const serviceSubscriptions = await ServiceSubscription.getAll(adminContext, where, 'id finishAt')
    if (serviceSubscriptions.length === 0) {
        console.log(`No ServiceSubscription records found by conditions: ${JSON.stringify(where)}`)
        process.exit(0)
    }
    console.debug(serviceSubscriptions)
    console.log(`Above are ${serviceSubscriptions.length} ServiceSubscription records, that will get "finishAt" increased to ${increaseFinishAtBy.join(' ')}\n`)

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    })

    rl.question('Continue (y/n)?', async answer => {
        if (answer === 'n') {
            console.log('Do nothing. Bye!')
        } else {
            let processedCount = 0
            await Promise.all(serviceSubscriptions.map(async serviceSubscription => {
                const [ amount, unit ] = increaseFinishAtBy
                const newFinishAt = dayjs(serviceSubscription.finishAt).add(amount, unit).format()
                console.log(`Updating service subscription with organization=${serviceSubscription.id}`)
                console.debug('old finishAt', serviceSubscription.finishAt)
                console.debug('new finishAt', newFinishAt)
                console.debug('before', serviceSubscription)
                const result = await ServiceSubscription.update(adminContext, serviceSubscription.id, {
                    dv: 1,
                    sender: { dv: 1, fingerprint: 'prolong-subscriptions' },
                    finishAt: newFinishAt,
                }, 'id finishAt')
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