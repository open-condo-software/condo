const { find, getByCondition } = require('@open-condo/keystone/schema')

const { Address, AddressSource } = require('@address-service/domains/address/utils/serverSchema')
const { HEURISTIC_TYPE_FIAS_ID } = require('@address-service/domains/common/constants/heuristicTypes')
const { DADATA_PROVIDER } = require('@address-service/domains/common/constants/providers')
const { AddressIdentityConflict, createOrUpdateAddressWithSource, mergeAddressAndHelpers } = require('@address-service/domains/common/utils/services/search/searchServiceUtils')

const { formatDadataHouse, parser } = require('./addressParts')
const { toGuid } = require('./bulkNormalizeInput')

const FIELDS = 'id address key meta'
const DV_SENDER = { dv: 1, sender: { dv: 1, fingerprint: 'bulkNormalize' } }

function getStoredGuid (address) {
    const data = address?.meta?.data || {}
    const key = address?.key || ''
    const legacyGuid = ['8', '75'].includes(String(data.fias_level)) ? toGuid(data.fias_id) : null
    return toGuid(data.house_fias_id) || toGuid(data.stead_fias_id)
        || (key.startsWith(`${HEURISTIC_TYPE_FIAS_ID}:`) ? toGuid(key.split(':')[1]) : null)
        || legacyGuid
}

function getSourceKey (house, helpers) {
    return mergeAddressAndHelpers(house.trim(), helpers).toLowerCase()
}

class BulkNormalizeStore {
    constructor (context) {
        this.context = context
    }

    async findBySource (source) {
        const match = await getByCondition('AddressSource', { source, deletedAt: null })
        return match ? await Address.getOne(this.context, { id: match.address, deletedAt: null }, FIELDS) : null
    }

    async findByGuid (guid) {
        const heuristics = await find('AddressHeuristic', {
            type: HEURISTIC_TYPE_FIAS_ID,
            value: guid,
            deletedAt: null,
            enabled: true,
        })
        const matches = await Address.getAll(this.context, {
            deletedAt: null,
            OR: [
                { key: `${HEURISTIC_TYPE_FIAS_ID}:${guid}` },
                ...heuristics.map(({ address }) => ({ id: address })),
            ],
        }, FIELDS)
        return matches
    }

    async persist ({ guid, dadata, sources, helpers, existingAddress }) {
        const data = { ...dadata.data }
        for (const key of Object.keys(data)) {
            if (/^(?:flat|room|entrance|floor)(?:_|$)/.test(key)) data[key] = null
        }

        const address = formatDadataHouse(data) || parser.parseExplicit(dadata.value).address
        data.fias_id = guid
        data.fias_level = data.stead_fias_id && !dadata.rawHouseGuid ? '75' : '8'
        const heuristic = { type: HEURISTIC_TYPE_FIAS_ID, value: guid, reliability: 95, meta: null }
        const addressData = {
            address,
            key: `${HEURISTIC_TYPE_FIAS_ID}:${guid}`,
            meta: {
                provider: { name: DADATA_PROVIDER },
                value: address,
                unrestricted_value: address,
                data,
                helpers,
            },
        }

        const findExisting = async () => {
            const matches = await this.findByGuid(guid)
            if (!existingAddress || matches.some(({ id }) => id === existingAddress.id)) return matches

            // Legacy aliases can point to an Address with a non-FIAS key and no heuristic.
            // Re-read that exact row before creating a new Address for the same GUID.
            const linked = await Address.getOne(this.context, { id: existingAddress.id, deletedAt: null }, FIELDS)
            if (!linked) return matches
            if (getStoredGuid(linked) !== guid) throw new AddressIdentityConflict('Address alias FIAS changed')
            return [...matches, linked]
        }

        return await createOrUpdateAddressWithSource(
            this.context, Address, AddressSource, addressData, null, DV_SENDER, [heuristic],
            { strictFias: { guid, findByGuid: findExisting, getStoredGuid, sources } }
        )
    }
}

module.exports = { BulkNormalizeStore, getSourceKey, getStoredGuid }
