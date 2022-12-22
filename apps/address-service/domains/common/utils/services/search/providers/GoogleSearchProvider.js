const { AbstractSearchProvider } = require('./AbstractSearchProvider')
const { GOOGLE_PROVIDER } = require('@address-service/domains/common/constants/providers')
const conf = require('@open-condo/config')
const get = require('lodash/get')
const fetch = require('node-fetch')
const { DADATA_PROVIDER } = require('../../../../constants/providers')

/**
 * @typedef {Object} GoogleAddressComponent
 * @property {string} long_name
 * @property {string} short_name
 * @property {string[]} types {@see https://developers.google.com/maps/documentation/places/web-service/supported_types table2}
 */

/**
 * @typedef {Object} GooglePlace
 * @property {GoogleAddressComponent[]} [address_components]
 * @property {string} [adr_address]
 * @property {string} [formatted_address]
 * @property {string} [name]
 */

const CONFIG_KEY = 'GOOGLE_API_KEY'

/**
 * The Google search provider
 */
class GoogleSearchProvider extends AbstractSearchProvider {

    constructor () {
        super()

        const apiKey = get(conf, CONFIG_KEY)
        if (!apiKey) {
            throw new Error(`There is no '${CONFIG_KEY}' in .env`)
        }

        this.apiKey = apiKey
    }

    getProviderName () {
        return GOOGLE_PROVIDER
    }

    /**
     * https://developers.google.com/maps/documentation/places/web-service/search
     * ->
     * https://developers.google.com/maps/documentation/places/web-service/search-text
     * @returns {Promise<Object[]>}
     */
    async get ({ query, context = null }) {

    }

    /**
     * https://developers.google.com/maps/documentation/places/web-service/details
     * @param {string} placeId
     * @returns {Promise<GooglePlace>}
     */
    async getByPlaceId (placeId) {
        // Some fields billed in higher rates. Try to use Basic fields.
        // Which fields to return see https://developers.google.com/maps/documentation/places/web-service/details#fields
        const fields = [
            'address_component',
            'adr_address',
            'formatted_address',
            'name',
        ].join(',')

        const placeDetailsResult = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${this.apiKey}`)

        if (placeDetailsResult.status === 200) {
            /**
             * @type {{html_attributions: string[], result: GooglePlace, status: string, [info_messages]: string[]}}
             */
            const result = await placeDetailsResult.json()

            /**
             * @see https://developers.google.com/maps/documentation/places/web-service/details#PlacesDetailsStatus
             */
            if (result.status === 'OK') {
                return result.result
            }
        }

        return null
    }

    /**
     * @param {GooglePlace[]} data
     * @returns {NormalizedBuilding[]}
     */
    normalize (data) {
        //
        // TODO(AleX83Xpert) N O R M A L I Z A T I O N  ! ! !
        return data.map((item) => (
            {
                value: get(item, 'value'),
                unrestricted_value: get(item, 'unrestricted_value'),
                rawValue: get(item, 'value'),
                data: {
                    postal_code: get(item, ['data', 'postal_code']),
                    country: get(item, ['data', 'country']),
                    country_iso_code: get(item, ['data', 'country_iso_code']),
                    federal_district: get(item, ['data', 'federal_district']),
                    region_fias_id: get(item, ['data', 'region_fias_id']),
                    region_kladr_id: get(item, ['data', 'region_kladr_id']),
                    region_iso_code: get(item, ['data', 'region_iso_code']),
                    region_with_type: get(item, ['data', 'region_with_type']),
                    region_type: get(item, ['data', 'region_type']),
                    region_type_full: get(item, ['data', 'region_type_full']),
                    region: get(item, ['data', 'region']),
                    area_fias_id: get(item, ['data', 'area_fias_id']),
                    area_kladr_id: get(item, ['data', 'area_kladr_id']),
                    area_with_type: get(item, ['data', 'area_with_type']),
                    area_type: get(item, ['data', 'area_type']),
                    area_type_full: get(item, ['data', 'area_type_full']),
                    area: get(item, ['data', 'area']),
                    city_fias_id: get(item, ['data', 'city_fias_id']),
                    city_kladr_id: get(item, ['data', 'city_kladr_id']),
                    city_with_type: get(item, ['data', 'city_with_type']),
                    city_type: get(item, ['data', 'city_type']),
                    city_type_full: get(item, ['data', 'city_type_full']),
                    city: get(item, ['data', 'city']),
                    city_area: get(item, ['data', 'city_area']),
                    city_district_fias_id: get(item, ['data', 'city_district_fias_id']),
                    city_district_kladr_id: get(item, ['data', 'city_district_kladr_id']),
                    city_district_with_type: get(item, ['data', 'city_district_with_type']),
                    city_district_type: get(item, ['data', 'city_district_type']),
                    city_district_type_full: get(item, ['data', 'city_district_type_full']),
                    city_district: get(item, ['data', 'city_district']),
                    settlement_fias_id: get(item, ['data', 'settlement_fias_id']),
                    settlement_kladr_id: get(item, ['data', 'settlement_kladr_id']),
                    settlement_with_type: get(item, ['data', 'settlement_with_type']),
                    settlement_type: get(item, ['data', 'settlement_type']),
                    settlement_type_full: get(item, ['data', 'settlement_type_full']),
                    settlement: get(item, ['data', 'settlement']),
                    street_fias_id: get(item, ['data', 'street_fias_id']),
                    street_kladr_id: get(item, ['data', 'street_kladr_id']),
                    street_with_type: get(item, ['data', 'street_with_type']),
                    street_type: get(item, ['data', 'street_type']),
                    street_type_full: get(item, ['data', 'street_type_full']),
                    street: get(item, ['data', 'street']),
                    stead_fias_id: get(item, ['data', 'stead_fias_id']),
                    stead_cadnum: get(item, ['data', 'stead_cadnum']),
                    stead_type: get(item, ['data', 'stead_type']),
                    stead_type_full: get(item, ['data', 'stead_type_full']),
                    stead: get(item, ['data', 'stead']),
                    house_fias_id: get(item, ['data', 'house_fias_id']),
                    house_kladr_id: get(item, ['data', 'house_kladr_id']),
                    house_cadnum: get(item, ['data', 'house_cadnum']),
                    house_type: get(item, ['data', 'house_type']),
                    house_type_full: get(item, ['data', 'house_type_full']),
                    house: get(item, ['data', 'house']),
                    block_type: get(item, ['data', 'block_type']),
                    block_type_full: get(item, ['data', 'block_type_full']),
                    block: get(item, ['data', 'block']),
                    entrance: get(item, ['data', 'entrance']),
                    floor: get(item, ['data', 'floor']),
                    flat_fias_id: get(item, ['data', 'flat_fias_id']),
                    flat_cadnum: get(item, ['data', 'flat_cadnum']),
                    flat_type: get(item, ['data', 'flat_type']),
                    flat_type_full: get(item, ['data', 'flat_type_full']),
                    flat: get(item, ['data', 'flat']),
                    flat_area: get(item, ['data', 'flat_area']),
                    square_meter_price: get(item, ['data', 'square_meter_price']),
                    flat_price: get(item, ['data', 'flat_price']),
                    postal_box: get(item, ['data', 'postal_box']),
                    fias_id: get(item, ['data', 'fias_id']),
                    fias_code: get(item, ['data', 'fias_code']),
                    fias_level: get(item, ['data', 'fias_level']),
                    fias_actuality_state: get(item, ['data', 'fias_actuality_state']),
                    kladr_id: get(item, ['data', 'kladr_id']),
                    geoname_id: get(item, ['data', 'geoname_id']),
                    capital_marker: get(item, ['data', 'capital_marker']),
                    okato: get(item, ['data', 'okato']),
                    oktmo: get(item, ['data', 'oktmo']),
                    tax_office: get(item, ['data', 'tax_office']),
                    tax_office_legal: get(item, ['data', 'tax_office_legal']),
                    timezone: get(item, ['data', 'timezone']),
                    geo_lat: get(item, ['data', 'geo_lat']),
                    geo_lon: get(item, ['data', 'geo_lon']),
                    beltway_hit: get(item, ['data', 'beltway_hit']),
                    beltway_distance: get(item, ['data', 'beltway_distance']),
                    metro: get(item, ['data', 'metro']),
                    divisions: get(item, ['data', 'divisions']),
                    qc_geo: get(item, ['data', 'qc_geo']),
                    qc_complete: get(item, ['data', 'qc_complete']),
                    qc_house: get(item, ['data', 'qc_house']),
                    history_values: get(item, ['data', 'history_values']),
                    unparsed_parts: get(item, ['data', 'unparsed_parts']),
                    source: get(item, ['data', 'source']),
                    qc: get(item, ['data', 'qc']),
                },
                provider: {
                    name: DADATA_PROVIDER,
                    rawData: item,
                },
            }
        ))
    }
}

module.exports = { GoogleSearchProvider }
