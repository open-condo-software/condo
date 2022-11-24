const { Address, AddressSource } = require('@address-service/domains/address/utils/serverSchema')

/**
 * @param context Keystone context
 * @param {{ address: string, key: string, meta: NormalizedBuilding }} addressData
 * @param {string} addressSource
 * @param {{ dv: number, sender: { dv: number, fingerprint: string } }} dvSender
 */
async function createOrUpdateAddressWithSource (context, addressData, addressSource, dvSender) {

    let addressItem = await Address.getOne(context, { key: addressData.key })

    if (!addressItem) {
        addressItem = await Address.create(context, { ...dvSender, ...addressData })
    }

    const addressSourcesCount = await AddressSource.count(context, { source: addressSource })
    if (addressSourcesCount === 0) {
        await AddressSource.create(
            context,
            {
                source: addressSource,
                address: { connect: { id: addressItem.id } },
                ...dvSender,
            },
        )
    }

    return addressItem
}

module.exports = { createOrUpdateAddressWithSource }
