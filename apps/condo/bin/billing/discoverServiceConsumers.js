/**
 * Creates ServiceConsumer models for given organization
 *
 * Usage:
 *      yarn workspace @app/condo node bin/billing/discoverServiceConsumers -o <organizationId>
 */

const path = require('path')

const commander = require('commander')
const { map, chunk } = require('lodash')

const { getLogger } = require('@open-condo/keystone/logging')
const { prepareKeystoneExpressApp } = require('@open-condo/keystone/prepareKeystoneApp')
const { find } = require('@open-condo/keystone/schema')

const { UUID_REGEXP } = require('@condo/domains/common/constants/regexps')
const { discoverServiceConsumers } = require('@condo/domains/resident/utils/serverSchema')

const logger = getLogger()

const DV_SENDER = { dv: 1, sender: { dv: 1, fingerprint: 'discoverServiceConsumersScript' } }

const program = new commander.Command()
program.requiredOption('-o, --organization <organizationId>', 'The organization\'s uuid', (value, previous) => {
    if (!UUID_REGEXP.test(value)) {
        throw new commander.InvalidArgumentError('Not a UUID.')
    }

    return value
})

async function main () {
    program.parse()
    /**
     * @type {{organization: string}}
     */
    const options = program.opts()

    const { keystone: context } = await prepareKeystoneExpressApp(
        path.resolve('./index.js'),
        { excludeApps: ['NextApp', 'AdminUIApp'] },
    )

    const accounts = await find('BillingAccount', {
        context: { organization: { id: options.organization } },
        deletedAt: null,
    })

    const chunks = chunk(accounts, 25)
    for (const chunkData of chunks) {
        const billingAccountsIds = map(chunkData, 'id')
        try {
            const result = await discoverServiceConsumers(context, { ...DV_SENDER, billingAccountsIds })
            logger.info({ msg: 'chunk processed', data: { billingAccountsIds, result }, count: chunkData.length })
        } catch (err) {
            logger.error({ msg: 'chunk error', data: { billingAccountsIds }, err, count: chunkData.length })
        }
    }

    return []
}

main().then(() => {
    console.info('✅ All done!')
    process.exit()
}).catch((e) => {
    console.error(e)
    process.exit(1)
})
