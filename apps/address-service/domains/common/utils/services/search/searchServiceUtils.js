const { isEmpty, isObject } = require('lodash')

const { AddressSource } = require('@address-service/domains/address/utils/serverSchema')
const { md5 } = require('@condo/domains/common/utils/crypto')

/**
 * @param context Keystone context
 * @param addressServerUtils
 * @param addressSourceServerUtils
 * @param {{ address: string, key: string, meta: NormalizedBuilding }} addressData
 * @param {string} addressSource
 * @param {{ dv: number, sender: { dv: number, fingerprint: string } }} dvSender
 */
async function createOrUpdateAddressWithSource (context, addressServerUtils, addressSourceServerUtils, addressData, addressSource, dvSender) {
    const { key, meta } = addressData
    const { helpers = null } = meta

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
    const compoundedAddressSource = mergeAddressAndHelpers(addressSource, helpers)
    const addressSourceItem = await addressSourceServerUtils.getOne(context, { source: compoundedAddressSource })

    if (addressSourceItem) {
        await addressSourceServerUtils.update(context, addressSourceItem.id, {
            ...dvSender,
            source: compoundedAddressSource,
            address: { connect: { id: addressItem.id } },
            deletedAt: null, // Restore deleted address source on demand
        })
    } else {
        await addressSourceServerUtils.create(
            context,
            {
                ...dvSender,
                source: compoundedAddressSource,
                address: { connect: { id: addressItem.id } },
            },
        )
    }

    return addressItem
}

/**
 * @typedef {Object} AddressData
 * @property {string} address
 * @property {string} addressKey
 * @property {NormalizedBuilding} addressMeta
 * @property {string[]} addressSources
 */

/**
 * Converts the `Address` model to service response
 * @param context Keystone context
 * @param {Address} addressModel
 * @param {Object} overridden Original values of overridden fields
 * @param AddressSourceServerUtils The AddressSource server utils (differs for prod and test env)
 * @returns {Promise<AddressData>}
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

function sortObject (obj) {
    if (typeof obj !== 'object' || obj === null) {
        return obj
    }

    if (Array.isArray(obj)) {
        return obj.map(sortObject)
    }

    const sortedKeys = Object.keys(obj).sort()
    const result = {}
    sortedKeys.forEach((key) => {
        result[key] = sortObject(obj[key])
    })
    return result
}

function hashJSON (obj) {
    const sortedObj = sortObject(obj)
    const jsonStr = JSON.stringify(sortedObj)
    return md5(jsonStr)
}

/**
 * @param {string} address
 * @param {?SuggestionHelpersType} [helpers]
 * @returns {string}
 */
function mergeAddressAndHelpers (address, helpers) {
    if (!isObject(helpers) || isEmpty(helpers)) {
        return address
    }

    const helpersHash = hashJSON(helpers)

    return `${address}|helpers:${helpersHash}`
}

module.exports = {
    createOrUpdateAddressWithSource,
    createReturnObject,
    mergeAddressAndHelpers,
    hashJSON,
}
