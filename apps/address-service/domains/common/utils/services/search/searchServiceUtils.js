const { isEmpty, isObject } = require('lodash')

const { AddressSource } = require('@address-service/domains/address/utils/serverSchema')
const { PULLENTI_PROVIDER } = require('@address-service/domains/common/constants/providers')
const { md5 } = require('@condo/domains/common/utils/crypto')

const ADDRESS_ITEM_FIELDS = 'id address key meta overrides'

async function upsertAddressSource (context, addressSourceServerUtils, dvSender, normalizedSource, addressId) {
    if (!normalizedSource) return null

    const source = normalizedSource.toLowerCase()

    const existing = await addressSourceServerUtils.getOne(
        context,
        { source, deletedAt: null },
        ADDRESS_ITEM_FIELDS
    )

    if (existing) {
        await addressSourceServerUtils.update(context, existing.id, {
            ...dvSender,
            source,
            address: { connect: { id: addressId } },
        })
        return existing.id
    }

    const created = await addressSourceServerUtils.create(context, {
        ...dvSender,
        source,
        address: { connect: { id: addressId } },
    })

    return created?.id ?? null
}

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
    const { helpers = null, provider: { name: providerName } = {}, data: { fias_id } = {} } = meta

    // TODO (DOMA-11991): Remove this condition
    // Do not save addresses from pullenti provider, because this provider is local and have no costs. Also, the normalizer is not finished yet.
    // Maybe, normalizer is not needed at all 🤔 and we need to add some settings for providers (free/paid)
    if (providerName === PULLENTI_PROVIDER) {
        return {
            id: `${providerName}:${fias_id || key}`,
            overrides: null,
            ...addressData,
        }
    }

    //
    // Address
    //
    let addressItem = await addressServerUtils.getOne(context, { key, deletedAt: null }, ADDRESS_ITEM_FIELDS)

    if (!addressItem) {
        addressItem = await addressServerUtils.create(context, { ...dvSender, ...addressData }, ADDRESS_ITEM_FIELDS)
    }

    //
    // Address source
    //
    const addressSourceCandidates = [addressSource, addressItem.address]
    const uniqueNormalizedSources = Array.from(
        new Set(
            addressSourceCandidates
                .filter((item) => typeof item === 'string' && item.trim().length > 0)
                .map((item) => mergeAddressAndHelpers(item.trim(), helpers))
                .filter(Boolean)
        )
    )

    for (const uniqueSource of uniqueNormalizedSources) {
        await upsertAddressSource(context, addressSourceServerUtils, dvSender, uniqueSource, addressItem.id)
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
    // TODO (DOMA-11991): Remove checking for provider
    const { meta: { provider: { name: providerName } = {} } = {} } = addressModel

    const addressSources = providerName === PULLENTI_PROVIDER
        ? []
        : (
            await AddressSourceServerUtils.getAll(
                context,
                { address: { id: addressModel.id } },
                'source'
            ) || []
        )

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
    upsertAddressSource,
    createOrUpdateAddressWithSource,
    createReturnObject,
    mergeAddressAndHelpers,
    hashJSON,
}
