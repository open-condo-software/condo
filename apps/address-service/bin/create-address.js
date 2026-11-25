/**
 * Add the address manually if there is no provider
 *
 * Usage:
 *      yarn workspace @app/address-service node bin/create-address "streetName, houseNumber"
 */

const path = require('path')

const { prepareKeystoneExpressApp } = require('@open-condo/keystone/prepareKeystoneApp')

const { AddressInjection } = require('@address-service/domains/address/utils/serverSchema')

async function main(args) {
    if (args.length === 0) {
        throw new Error('You must provide the address in the format: "Street Name, House Number"')
    }
    const [streetName, houseNumber] = args[0].split(',')

    if (!streetName || !houseNumber) {
        throw new Error('You must provide both street name and house number in the format: "Street Name, House Number"')
    }

    const { keystone: context } = await prepareKeystoneExpressApp(path.resolve('./index.js'), { excludeApps: ['NextApp', 'AdminUIApp'] })

    let addressData = {
        country: 'Россия',
        street: { 'name': streetName.trim(), 'typeFull': 'улица', 'typeShort': 'ул' },
        house: { 'name': houseNumber.trim(), 'typeFull': 'дом', 'typeShort': 'д' },
        dv: 1,
        sender: { 'dv': 1, 'fingerprint': 'create-address-script' },
    }

    const address = await AddressInjection.getOne(context, { street: addressData.street, house: addressData.house })

    if (!address) {
        await AddressInjection.create(context, {
            ...addressData,
        })
        console.info('Address created!')
    } else {
        throw new Error('Address already exists')
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