/**
 * @param context Keystone context
 * @param addressServerUtils
 * @param addressSourceServerUtils
 * @param {{ address: string, key: string, meta: NormalizedBuilding }} addressData
 * @param {string} addressSource
 * @param {{ dv: number, sender: { dv: number, fingerprint: string } }} dvSender
 */
async function createOrUpdateAddressWithSource (context, addressServerUtils, addressSourceServerUtils, addressData, addressSource, dvSender) {
    const { key } = addressData

    //
    // Address
    //
    let addressItem = await addressServerUtils.getOne(context, { key })

    if (addressItem) {
        addressItem = await addressServerUtils.update(context, addressItem.id, {
            ...dvSender,
            deletedAt: null, // Restore deleted address on demand
        })
    } else {
        addressItem = await addressServerUtils.create(context, { ...dvSender, ...addressData })
    }

    //
    // Address source
    //
    const addressSourceItem = await addressSourceServerUtils.getOne(context, { source: addressSource })

    if (addressSourceItem) {
        await addressSourceServerUtils.update(context, addressSourceItem.id, {
            ...dvSender,
            source: addressSource,
            address: { connect: { id: addressItem.id } },
            deletedAt: null, // Restore deleted address source on demand
        })
    } else {
        await addressSourceServerUtils.create(
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
