const { Address, AddressSource } = require('@address-service/domains/address/utils/serverSchema')

/**
 * @param context Keystone context
 * @param {{ address: string, key: string, meta: NormalizedBuilding }} addressData
 * @param {string} addressSource
 * @param {{ dv: number, sender: { dv: number, fingerprint: string } }} dvSender
 */
async function createOrUpdateAddressWithSource (context, addressData, addressSource, dvSender) {
    const { key, ...addressDataWithoutKey } = addressData

    //
    // Address
    //
    let addressItem = await Address.getOne(context, { key })

    if (addressItem) {
        addressItem = await Address.update(context, addressItem.id, {
            ...dvSender,
            ...addressDataWithoutKey,
            deletedAt: null, // Restore deleted address on demand
        })
    } else {
        addressItem = await Address.create(context, { ...dvSender, ...addressData })
    }

    //
    // Address source
    //
    const addressSourceItem = await AddressSource.getOne(context, { source: addressSource })

    if (addressSourceItem) {
        await AddressSource.update(context, addressSourceItem.id, {
            ...dvSender,
            source: addressSource,
            address: { connect: { id: addressItem.id } },
            deletedAt: null, // Restore deleted address source on demand
        })
    } else {
        await AddressSource.create(
            context,
            {
                ...dvSender,
                source: addressSource,
                address: { connect: { id: addressItem.id } },
            },
        )
    }

    return addressItem
}

module.exports = { createOrUpdateAddressWithSource }
