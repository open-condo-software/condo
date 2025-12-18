/**
 * Regenerate address.key using actual rules
 *
 * Usage:
 *      yarn workspace @app/address-service node bin/regenerate-keys [--dry-run] [addressId, addressId, ...]
 */

const path = require('path')

const get = require('lodash/get')

const { prepareKeystoneExpressApp } = require('@open-condo/keystone/prepareKeystoneApp')

const { Address } = require('@address-service/domains/address/utils/serverSchema')
const { DADATA_PROVIDER, PULLENTI_PROVIDER, GOOGLE_PROVIDER, INJECTIONS_PROVIDER } = require('@address-service/domains/common/constants/providers')
const { InjectionsSeeker } = require('@address-service/domains/common/utils/services/InjectionsSeeker')
const { DadataSearchProvider } = require('@address-service/domains/common/utils/services/search/providers/DadataSearchProvider')
const { GoogleSearchProvider } = require('@address-service/domains/common/utils/services/search/providers/GoogleSearchProvider')
const { PullentiSearchProvider } = require('@address-service/domains/common/utils/services/search/providers/PullentiSearchProvider')

const dv = 1
const sender = { dv, fingerprint: 'regenerate-keys-script' }

/**
 * Get the appropriate provider instance based on provider name
 * @param {string} providerName
 * @returns {Object|null}
 */
function getProviderByName (providerName) {
    const mockReq = { id: 'regenerate-keys-script' }
    switch (providerName) {
        case DADATA_PROVIDER:
            return new DadataSearchProvider({ req: mockReq })
        case PULLENTI_PROVIDER:
            return new PullentiSearchProvider({ req: mockReq })
        case GOOGLE_PROVIDER:
            return new GoogleSearchProvider({ req: mockReq })
        case INJECTIONS_PROVIDER:
            return new InjectionsSeeker('')
        default:
            return null
    }
}

async function main (args) {
    let offset = 0
    let pageSize = 100
    let isDryRun = false

    if (args[0] === '--dry-run') {
        isDryRun = true
        args.shift()
    }

    const { keystone: context } = await prepareKeystoneExpressApp(path.resolve('./index.js'), { excludeApps: ['NextApp', 'AdminUIApp'] })

    const where = { deletedAt: null }
    if (args.length > 0) {
        where.id_in = args
    }

    let addresses
    do {
        addresses = await Address.getAll(context, where, {
            first: pageSize,
            skip: offset,
            sortBy: ['createdAt_ASC'],
        }, 'id meta key')

        for (const address of addresses) {
            const t1 = Date.now()
            process.stdout.write(`\r\n${address.id}: `)

            const providerName = get(address, ['meta', 'provider', 'name'])
            const provider = getProviderByName(providerName)

            if (!provider) {
                process.stdout.write(`unknown provider: ${providerName}`)
                process.stdout.write(`, done in ${Number(Date.now() - t1)} ms`)
                continue
            }

            const newKey = provider.generateAddressKey(address.meta)

            if (newKey) {
                if (address.key === newKey) {
                    process.stdout.write('the key was not changed')
                } else {
                    process.stdout.write(`${address.key} -> ${newKey}`)
                    if (!isDryRun) {
                        await Address.update(context, address.id, { dv, sender, key: newKey })
                    }
                }
            } else {
                process.stdout.write('no data to generate new key')
            }
            process.stdout.write(`, done in ${Number(Date.now() - t1)} ms`)
        }

        offset += Math.min(pageSize, addresses.length)
    } while (addresses.length > 0)
    process.stdout.write('\r\n')
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
