/**
 * @param context Keystone context
 * @param addressGql
 * @param addressSourceGql
 * @param {{ address: string, key: string, meta: NormalizedBuilding }} addressData
 * @param {string} addressSource
 * @param {{ dv: number, sender: { dv: number, fingerprint: string } }} dvSender
 */
async function createOrUpdateAddressWithSource (context, addressGql, addressSourceGql, addressData, addressSource, dvSender) {
    const { key } = addressData

    //
    // Address
    //
    let addressItem = await addressGql.getOne(context, { key })

    if (addressItem) {
        addressItem = await addressGql.update(context, addressItem.id, {
            ...dvSender,
            deletedAt: null, // Restore deleted address on demand
        })
    } else {
        addressItem = await addressGql.create(context, { ...dvSender, ...addressData })
    }

    //
    // Address source
    //
    const addressSourceItem = await addressSourceGql.getOne(context, { source: addressSource })

    if (addressSourceItem) {
        await addressSourceGql.update(context, addressSourceItem.id, {
            ...dvSender,
            source: addressSource,
            address: { connect: { id: addressItem.id } },
            deletedAt: null, // Restore deleted address source on demand
        })
    } else {
        await addressSourceGql.create(
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
