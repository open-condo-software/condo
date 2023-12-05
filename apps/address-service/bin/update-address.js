/**
 * Update address by id with new data got from external provider.
 * Use .env to detect particular provider.
 *
 * Usage:
 *      yarn workspace @app/address-service node bin/update-address [--dry-run] addressId "some search string"
 */

const path = require('path')

const get = require('lodash/get')
const { v4 } = require('uuid')

const { prepareKeystoneExpressApp } = require('@open-condo/keystone/prepareKeystoneApp')

const { Address, AddressSource } = require('@address-service/domains/address/utils/serverSchema')
const { generateAddressKey } = require('@address-service/domains/common/utils/addressKeyUtils')
const { getSearchProvider } = require('@address-service/domains/common/utils/services/providerDetectors')

const dv = 1
const sender = { dv, fingerprint: 'update-address-script' }

async function main (args) {
    let isDryRun = false

    if (args[0] === '--dry-run') {
        isDryRun = true
        args.shift()
    }

    if (args.length !== 2) {
        throw new Error(`Wrong parameters "${args.join(',')}"! Usage: update-address [--dry-run] addressId "some search string"`)
    }

    const [addressId, searchString] = args

    const { keystone: context } = await prepareKeystoneExpressApp(path.resolve('./index.js'), { excludeApps: ['NextApp', 'AdminUIApp'] })

    let addressItem = await Address.getOne(context, { id: addressId })

    if (!addressItem) {
        throw new Error(`Can not find address by id=${addressId}`)
    }

    console.log(`Address found. key=${addressItem.key}, address=${addressItem.address}`)

    const searchProvider = getSearchProvider({ req: { id: v4() } })

    if (!searchProvider) {
        throw new Error('Can not detect which provider to use')
    }

    console.log(`Use search provider: ${searchProvider.getProviderName()}`)

    const denormalizedRows = await searchProvider.get({ query: searchString })
    const searchResults = searchProvider ? searchProvider.normalize(denormalizedRows) : []

    if (searchResults.length === 0) {
        throw new Error('Nothing found')
    }

    console.log(`Found ${searchResults.length} items in external provider. Will use the first one.`)

    // Use the first result for a while
    const searchResult = searchResults[0]

    const addressKey = generateAddressKey(searchResult)
    console.log(`Generate address key: ${addressKey}`)

    const addressData = {
        address: searchResult.value,
        key: addressKey,
        meta: {
            provider: {
                name: searchProvider.getProviderName(),
                rawData: denormalizedRows[0],
            },
            value: searchResult.value,
            unrestricted_value: searchResult.unrestricted_value,
            data: get(searchResult, 'data', {}),
        },
    }

    console.log(`For addressId=${addressId} "${addressItem.address}" will be changed to "${addressData.address}"`)

    if (isDryRun) {
        console.log('Nothing changed in database')
    } else {
        const { key, ...addressDataWithoutKey } = addressData

        const updatedAddressItem = await Address.update(context, addressItem.id, {
            dv,
            sender,
            deletedAt: null, // Restore deleted address on demand
            ...addressDataWithoutKey,
        })

        console.log(`Address model updated. New address: ${updatedAddressItem.address}`)

        const addressSourceItem = await AddressSource.getOne(context, { source: searchString })

        if (addressSourceItem) {
            console.log(`Found address source with id=${addressSourceItem.id}`)
            const updatedAddressSourceItem = await AddressSource.update(context, addressSourceItem.id, {
                dv,
                sender,
                source: searchString,
                address: { connect: { id: addressItem.id } },
                deletedAt: null, // Restore deleted address source on demand
            })
            console.log(`Address source linked to address ${updatedAddressSourceItem.address.id} (was ${addressSourceItem.address.id})`)
        } else {
            const createdAddressSourceItem = await AddressSource.create(
                context,
                {
                    dv,
                    sender,
                    source: searchString,
                    address: { connect: { id: addressItem.id } },
                },
            )
            console.log(`New address source "${createdAddressSourceItem.source}" was created and linked to address ${createdAddressSourceItem.address.id}`)
        }
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
