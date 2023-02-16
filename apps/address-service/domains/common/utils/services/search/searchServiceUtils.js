const get = require('lodash/get')
const set = require('lodash/set')

const { OVERRIDING_ROOT } = require('@address-service/domains/address/constants')
const { AddressSource } = require('@address-service/domains/address/utils/serverSchema')

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

/**
 * Converts the `Address` model to service response
 * @param context Keystone context
 * @param {Address} addressModel
 * @param {Object} overridden Original values of overridden fields
 * @param AddressSourceServerUtils The AddressSource server utils (differs for prod and test env)
 * @returns {Promise<{ address: string, addressKey: string, addressMeta: NormalizedBuilding, addressSources: string[] }>}
 */
async function createReturnObject ({
    context,
    addressModel,
    overridden = {},
    AddressSourceServerUtils = AddressSource,
}) {
    const addressSources = await AddressSourceServerUtils.getAll(context, { address: { id: addressModel.id } }) || []
    const ret = {
        address: addressModel.address,
        addressKey: addressModel.id,
        addressMeta: addressModel.meta,
        addressSources: addressSources.map(({ source }) => source),
    }

    if (Object.keys(overridden).length > 0) {
        ret.overridden = { addressMeta: { data: overridden } }
    }

    return ret
}

module.exports = { createOrUpdateAddressWithSource, createReturnObject }
