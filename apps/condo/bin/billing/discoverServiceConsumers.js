/**
 * Creates ServiceConsumer models for given organization
 *
 * Usage:
 *      yarn workspace @app/condo node bin/billing/discoverServiceConsumers -o <organizationId>
 */

const path = require('path')

const commander = require('commander')
const { map } = require('lodash')

const { getLogger } = require('@open-condo/keystone/logging')
const { prepareKeystoneExpressApp } = require('@open-condo/keystone/prepareKeystoneApp')

const { BillingAccount } = require('@condo/domains/billing/utils/serverSchema')
const { UUID_REGEXP } = require('@condo/domains/common/constants/regexps')
const { loadListByChunks } = require('@condo/domains/common/utils/serverSchema')
const { discoverServiceConsumers } = require('@condo/domains/resident/utils/serverSchema')

const logger = getLogger('discoverServiceConsumersScript')

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

    await loadListByChunks({
        context,
        list: BillingAccount,
        where: {
            context: { organization: { id: options.organization } },
            deletedAt: null,
        },
        chunkSize: 25,
        chunkProcessor: async (/** @type {BillingAccount[]} */ chunk) => {
            const billingAccountsIds = map(chunk, 'id')
            try {
                const result = await discoverServiceConsumers(context, { ...DV_SENDER, billingAccountsIds })
                logger.info({ msg: `chunk[${chunk.length}]`, billingAccountsIds, result })
            } catch (err) {
                logger.error({ msg: `chunk[${chunk.length}] error`, billingAccountsIds, err })
            }

            return []
        },
    })
}

main().then(() => {
    console.info('✅ All done!')
    process.exit()
}).catch((e) => {
    console.error(e)
    process.exit(1)
})
