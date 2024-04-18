const { faker } = require('@faker-js/faker')

const { AddressFromStringParser } = require('@open-condo/clients/address-service-client/utils')

class MockedAddressServiceClient {
    addressKeysToSearchResultsMapping = new Map()
    addressSourcesToAddressKeyMapping = new Map()

    /**
     * @param {string} url The address service url (root)
     */
    constructor (url) {
        console.log(`🥸The mocked AddressServiceClient is used. All calls to ${url} will be mocked.`)
    }

    async search (s, params = {}) {
        if (!s) {
            throw new Error('The `s` parameter is mandatory')
        }

        if (this.addressSourcesToAddressKeyMapping.has(s)) {
            return this.addressKeysToSearchResultsMapping.get(this.addressSourcesToAddressKeyMapping.get(s))
        }

        const searchByKeyRegExp = /^key:(.+?)$/
        if (searchByKeyRegExp.test(s)) {
            const [, key] = searchByKeyRegExp.exec(s)
            if (this.addressKeysToSearchResultsMapping.has(key)) {
                return this.addressKeysToSearchResultsMapping.get(key)
            } else {
                return null
            }
        }

        const addressKey = faker.datatype.uuid()
        const addressParser = new AddressFromStringParser()

        // Extract unitType and unitName
        let address = s, unitType, unitName
        if (params.extractUnit) {
            const { address: parsedAddress, unitType: ut, unitName: un } = addressParser.parse(s)
            address = parsedAddress
            if (!!ut && !!un) {
                unitType = ut
                unitName = un
            }
        }

        const fiasId = faker.datatype.uuid()
        const addressSources = [s, `fiasId:${fiasId}`]
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
            unitType,
            unitName,
        }

        this.addressKeysToSearchResultsMapping.set(addressKey, searchResult)
        addressSources.forEach((source) => this.addressSourcesToAddressKeyMapping.set(source, addressKey))

        return searchResult
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
}

module.exports = { MockedAddressServiceClient }
