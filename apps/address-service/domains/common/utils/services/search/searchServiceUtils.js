const { isEmpty, isObject } = require('lodash')

const { find } = require('@open-condo/keystone/schema')

const { AddressHeuristic, AddressSource } = require('@address-service/domains/address/utils/serverSchema')
const { PULLENTI_PROVIDER } = require('@address-service/domains/common/constants/providers')
const { md5 } = require('@condo/domains/common/utils/crypto')

const { findAddressByHeuristics, upsertHeuristics } = require('./heuristicMatcher')

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

class AddressIdentityConflict extends Error {}

async function createOrRead (read, create, validate) {
    const existing = await read()
    if (existing) return validate(existing)

    try {
        return await create()
    } catch (err) {
        // Keystone may wrap uniqueness violations in a GraphQL error. Only recover
        // when the row can be read again and its identity is verified.
        const concurrent = await read()
        if (!concurrent) throw err
        return validate(concurrent)
    }
}

async function persistWithExactFias (context, addressServerUtils, addressSourceServerUtils, addressData, dvSender, heuristic, strictFias) {
    const { guid, findByGuid, getStoredGuid, sources } = strictFias
    const validateAddress = (address) => {
        const storedGuid = getStoredGuid(address)
        if (storedGuid && storedGuid !== guid) throw new AddressIdentityConflict('Address FIAS does not match')
        return address
    }
    const readAddress = async () => {
        const matches = await findByGuid()
        if (matches.length > 1) throw new AddressIdentityConflict('Multiple addresses for one FIAS')
        return matches[0]
    }
    const address = await createOrRead(
        readAddress,
        () => addressServerUtils.create(context, { ...dvSender, ...addressData }, ADDRESS_ITEM_FIELDS),
        validateAddress,
    )
    validateAddress(address)

    const readHeuristic = async () => {
        const [existing] = await find('AddressHeuristic', {
            type: heuristic.type, value: guid, deletedAt: null,
        })
        return existing
    }
    // Each write is idempotent. If a later write fails, the next request can
    // resume from the existing exact Address and heuristic.
    await createOrRead(
        readHeuristic,
        () => AddressHeuristic.create(context, {
            ...dvSender,
            ...heuristic,
            address: { connect: { id: address.id } },
            provider: addressData.meta.provider.name,
            enabled: true,
        }),
        (existing) => {
            if (existing.address !== address.id || !existing.enabled) throw new AddressIdentityConflict('Conflicting FIAS heuristic')
            return existing
        },
    )

    for (const source of sources) {
        await createOrRead(
            async () => (await find('AddressSource', { source, deletedAt: null }))[0],
            () => addressSourceServerUtils.create(context, {
                ...dvSender,
                source,
                address: { connect: { id: address.id } },
            }),
            (existing) => {
                if (existing.address !== address.id) throw new AddressIdentityConflict('Address alias already belongs to a different house')
                return existing
            },
        )
    }

    return address
}

/**
 * @param context Keystone context
 * @param addressServerUtils
 * @param addressSourceServerUtils
 * @param {{ address: string, key: string, meta: NormalizedBuilding }} addressData
 * @param {string} addressSource
 * @param {{ dv: number, sender: { dv: number, fingerprint: string } }} dvSender
 * @param {Array<{type: string, value: string, reliability: number, meta?: object}>} [heuristics] - extracted heuristics from provider
 */
async function createOrUpdateAddressWithSource (context, addressServerUtils, addressSourceServerUtils, addressData, addressSource, dvSender, heuristics = [], { strictFias } = {}) {
    if (strictFias) {
        return await persistWithExactFias(context, addressServerUtils, addressSourceServerUtils, addressData, dvSender, heuristics[0], strictFias)
    }

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
    // Address: first try heuristic-based matching, then fall back to key lookup
    //
    let addressItem = null

    if (heuristics.length > 0) {
        const heuristicMatch = await findAddressByHeuristics(heuristics)
        if (heuristicMatch) {
            addressItem = await addressServerUtils.getOne(
                context,
                { id: heuristicMatch.addressId, deletedAt: null },
                ADDRESS_ITEM_FIELDS
            )
        }
    }

    // Fallback: key-based lookup (backward compat with pre-migration data).
    if (!addressItem) {
        addressItem = await addressServerUtils.getOne(context, { key, deletedAt: null }, ADDRESS_ITEM_FIELDS)
    }

    if (!addressItem) {
        addressItem = await addressServerUtils.create(context, { ...dvSender, ...addressData }, ADDRESS_ITEM_FIELDS)
    }

    // Upsert heuristics for the address
    if (heuristics.length > 0) {
        await upsertHeuristics(context, addressItem.id, heuristics, providerName, dvSender)
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
    AddressIdentityConflict,
    upsertAddressSource,
    createOrUpdateAddressWithSource,
    createReturnObject,
    mergeAddressAndHelpers,
    hashJSON,
}
