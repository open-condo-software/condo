/**
 * Regenerate address.key using actual rules
 *
 * Usage:
 *      yarn workspace @app/address-service node bin/regenerate-keys [--dry-run] [addressId, addressId, ...]
 */

const path = require('path')

const { prepareKeystoneExpressApp } = require('@open-condo/keystone/prepareKeystoneApp')

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
        })

        for (const address of addresses) {
            const t1 = Date.now()
            process.stdout.write(`\r\n${address.id}: `)
            const newKey = generateAddressKey(address.meta)

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
