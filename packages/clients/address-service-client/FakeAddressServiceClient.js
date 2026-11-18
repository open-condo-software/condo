const { faker } = require('@faker-js/faker')
const isPlainObject = require('lodash/isPlainObject')

const { AddressFromStringParser } = require('@open-condo/clients/address-service-client/utils')

const { isAddressUUID } = require('./utils/parseAddressesFromString')

class FakeAddressServiceClient {
    addressKeysToSearchResultsMapping = new Map()
    addressSourcesToAddressKeyMapping = new Map()
    bulkNormalizeResults = new Map()

    /**
     * @param {string} s
     * @param {AddressServiceSearchParams} [params]
     * @returns {Promise<*>}
     * @public
     */
    async search (s, params = {}) {
        if (!s) {
            throw new Error('The `s` parameter is mandatory')
        }

        // Extract unitType and unitName
        let address = s, unitType, unitName
        if (params.extractUnit) {
            const addressParser = new AddressFromStringParser()
            const { address: parsedAddress, unitType: ut, unitName: un } = addressParser.parse(address)
            address = parsedAddress
            if (!!ut && !!un) {
                unitType = ut
                unitName = un
            }
        }

        if (this.addressSourcesToAddressKeyMapping.has(address)) {
            return {
                ...this.addressKeysToSearchResultsMapping.get(this.addressSourcesToAddressKeyMapping.get(address)),
                unitType,
                unitName,
            }
        }

        const searchByKeyRegExp = /^key:(.+?)$/
        if (searchByKeyRegExp.test(address)) {
            const [, key] = searchByKeyRegExp.exec(address)
            if (this.addressKeysToSearchResultsMapping.has(key)) {
                return {
                    ...this.addressKeysToSearchResultsMapping.get(key),
                    unitType,
                    unitName,
                }
            } else {
                return null
            }
        }

        const addressKey = faker.datatype.uuid()

        const fiasId = faker.datatype.uuid()
        const addressSources = [address, `fiasId:${fiasId}`, `key:${addressKey}`]
        const searchResult = {
            addressSources,
            address,
            addressKey,
            addressMeta: {
                data: {
                    postal_code: null,
                    country: faker.address.country(),
                    country_iso_code: null,
                    federal_district: null,
                    region_fias_id: null,
                    region_kladr_id: null,
                    region_iso_code: null,
                    region_with_type: null,
                    region_type: null,
                    region_type_full: null,
                    region: faker.address.state(),
                    area_fias_id: null,
                    area_kladr_id: null,
                    area_with_type: null,
                    area_type: null,
                    area_type_full: null,
                    area: null,
                    city_fias_id: null,
                    city_kladr_id: null,
                    city_with_type: null,
                    city_type: null,
                    city_type_full: null,
                    city: null,
                    city_area: null,
                    city_district_fias_id: null,
                    city_district_kladr_id: null,
                    city_district_with_type: null,
                    city_district_type: null,
                    city_district_type_full: null,
                    city_district: null,
                    settlement_fias_id: null,
                    settlement_kladr_id: null,
                    settlement_with_type: null,
                    settlement_type: null,
                    settlement_type_full: null,
                    settlement: null,
                    street_fias_id: null,
                    street_kladr_id: null,
                    street_with_type: null,
                    street_type: null,
                    street_type_full: null,
                    street: null,
                    house_fias_id: fiasId,
                    house_kladr_id: null,
                    house_type: 'д',
                    house_type_full: 'дом',
                    house: null,
                    block_type: null,
                    block_type_full: null,
                    block: null,
                    entrance: null,
                    floor: null,
                    flat_fias_id: null,
                    flat_type: null,
                    flat_type_full: null,
                    flat: null,
                    flat_area: null,
                    square_meter_price: null,
                    flat_price: null,
                    postal_box: null,
                    fias_id: fiasId,
                    fias_code: null,
                    fias_level: null,
                    fias_actuality_state: null,
                    kladr_id: null,
                    geoname_id: null,
                    capital_marker: null,
                    okato: null,
                    oktmo: null,
                    tax_office: null,
                    tax_office_legal: null,
                    timezone: null,
                    geo_lat: null,
                    geo_lon: null,
                    beltway_hit: null,
                    beltway_distance: null,
                    metro: null,
                    qc_geo: null,
                    qc_complete: null,
                    qc_house: null,
                    history_values: null,
                    unparsed_parts: null,
                    source: null,
                    qc: null,
                },
                value: address,
                unrestricted_value: address,
            },
        }

        this.addressKeysToSearchResultsMapping.set(addressKey, searchResult)
        addressSources.forEach((source) => this.addressSourcesToAddressKeyMapping.set(source, addressKey))

        return { ...searchResult, unitType, unitName }
    }

    /**
     *
     * @param params
     * @return {Promise<{ addresses: Object<addressKey: string, address: AddressData>, map: Object<addressSource: string, {err: string, data: Object<addressKey: string, ?unitType: string, ?unitName: string>}> }>}
     */
    async bulkSearch (params = {}) {
        const { items = [] } = params
        const foundResults = await Promise.all(items.flatMap(async (houseAddress) => {
            return { houseAddress: await this.search(houseAddress) }
        }))

        const map = foundResults.reduce((map, foundResult) => {
            const { houseAddress: { address, addressKey, addressSources } } = foundResult

            return {
                ...map,
                ...addressSources.reduce((parts, source) => ({ ...parts, [source]: { data: { addressKey } } }), {}),
            }
        }, {})

        const addresses = Object.fromEntries(foundResults.map(({
            houseAddress: {
                address,
                addressKey,
            },
        }) => ([addressKey, { address }])))
        return { map, addresses }
    }

    async bulkNormalize ({ items } = {}) {
        if (!isPlainObject(items) || !Object.keys(items).length) return null
        const parser = new AddressFromStringParser()
        const normalized = await Promise.all(Object.entries(items).map(async ([input, metadata]) => {
            if (this.bulkNormalizeResults.has(input)) return [input, this.bulkNormalizeResults.get(input)]

            const { addressMeta = {} } = metadata || {}
            const keyIsGuid = isAddressUUID(input)
            const validMetadata = isPlainObject(addressMeta) && Object.values(addressMeta).every(value => value == null || typeof value === 'string')
            const [guid, ...tail] = validMetadata ? (addressMeta.globalId || '').split(',') : []
            if (!input.trim() || !isPlainObject(metadata) || !validMetadata ||
                (keyIsGuid && guid && guid.trim().toLowerCase() !== input.toLowerCase())) {
                return [input, {
                    result: null,
                    warnings: [],
                    error: { code: 'INVALID_INPUT', stage: 'validate', message: 'Invalid address or address metadata' },
                }]
            }

            const parsed = parser.parseExplicit(input)
            const source = keyIsGuid ? `fiasId:${input.toLowerCase()}` : parsed.address
            if (!source || (keyIsGuid && !this.addressSourcesToAddressKeyMapping.has(source))) {
                return [input, {
                    result: null,
                    warnings: [],
                    error: { code: 'ADDRESS_NOT_FOUND', stage: 'resolve-house', message: 'No house candidate was resolved' },
                }]
            }

            const tailUnit = parser.parseUnitDescription(tail.join(',').trim())
            const unitName = addressMeta.unitName || tailUnit.unitName || parsed.unitName
            const stored = await this.search(source)
            const acceptedTypes = ['flat', 'parking', 'apartment', 'commercial', 'warehouse']
            const explicitType = acceptedTypes.includes(addressMeta.unitType) ? addressMeta.unitType : null
            const inferredType = [tailUnit, parsed].find(unit => unit.unitName === unitName)?.unitType
            return [input, {
                result: {
                    id: stored.addressKey,
                    house: stored.address,
                    globalId: stored.addressMeta.data.house_fias_id,
                    unitName,
                    unitType: unitName ? explicitType || inferredType || null : null,
                    confidence: 100,
                },
                warnings: guid && !isAddressUUID(guid.trim()) ? ['BAD_FIAS'] : [],
                error: null,
            }]
        }))
        return { items: Object.fromEntries(normalized) }
    }

}

module.exports = { FakeAddressServiceClient }
