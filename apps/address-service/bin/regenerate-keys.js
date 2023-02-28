/**
 * Regenerate address.key using actual rules
 *
 * Usage:
 *      yarn workspace @app/condo node bin/regenerate-keys [--dry-run] [addressId, addressId, ...]
 */

const path = require('path')

const { prepareKeystoneExpressApp } = require('@open-condo/keystone/test.utils')

const { Address } = require('@address-service/domains/address/utils/serverSchema')
const { generateAddressKey } = require('@address-service/domains/common/utils/addressKeyUtils')

const dv = 1
const sender = { dv, fingerprint: 'regenerate-keys-script' }

async function main (args) {
    let offset = 0
    let pageSize = 100
    let isDryRun = false

    if (args[0] === '--dry-run') {
        isDryRun = true
        args.shift()
    }

    const { keystone } = await prepareKeystoneExpressApp(path.resolve(__dirname, '../index.js'), { excludeApps: ['NextApp'] })
    const context = await keystone.createContext({ skipAccessControl: true })

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
        })

        await addresses.map(async (address) => {
            const newKey = generateAddressKey(address.meta)
            if (address.key !== newKey) {
                console.info(`${address.id}: ${address.key} -> ${newKey}`)
                if (!isDryRun) {
                    await Address.update(context, address.id, { dv, sender, key: newKey })
                }
            }
        })

        offset += Math.min(pageSize, addresses.length)
    } while (addresses.length > 0)
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
