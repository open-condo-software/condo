/**
 * Creates ServiceConsumer models for given organization
 *
 * Usage:
 *      yarn workspace @app/condo node bin/billing/discoverServiceConsumers -o <organizationId>
 */

const path = require('path')

const commander = require('commander')
const { map } = require('lodash')

const { prepareKeystoneExpressApp } = require('@open-condo/keystone/test.utils')

const { BillingAccount } = require('@condo/domains/billing/utils/serverSchema')
const { UUID_REGEXP } = require('@condo/domains/common/constants/regexps')
const { loadListByChunks } = require('@condo/domains/common/utils/serverSchema')
const { discoverServiceConsumers } = require('@condo/domains/resident/utils/serverSchema')

const DV_SENDER = { dv: 1, sender: { dv: 1, fingerprint: 'discoverServiceConsumersScript' } }

const program = new commander.Command()
program.requiredOption('-o, --organization <organizationId>', 'The organization\'s id', (value, previous) => {
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
        chunkSize: 50,
        chunkProcessor: async (/** @type {BillingAccount[]} */ chunk) => {
            try {
                const result = await discoverServiceConsumers(context, {
                    ...DV_SENDER,
                    billingAccountsIds: map(chunk, 'id'),
                })
                console.log(`chunk[${chunk.length}] result: ${JSON.stringify(result)}`)
            } catch (err) {
                console.error(`chunk[${chunk.length}] error: ${err.message}`)
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
