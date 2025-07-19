const get = require('lodash/get')

const conf = require('@open-condo/config')
const { fetch } = require('@open-condo/keystone/fetch')


const { GOOGLE_PROVIDER } = require('@address-service/domains/common/constants/providers')

const { AbstractSearchProvider } = require('./AbstractSearchProvider')

// https://developers.google.com/maps/faq#languagesupport
const SUPPORTED_LANGUAGES = ['af', 'ja', 'sq', 'kn', 'am', 'kk', 'ar', 'km', 'hy', 'ko', 'az', 'ky', 'eu', 'lo', 'be', 'lv', 'bn', 'lt', 'bs', 'mk', 'bg', 'ms', 'my', 'ml', 'ca', 'mr', 'zh', 'mn', 'zh-CN', 'ne', 'zh-HK', 'no', 'zh-TW', 'pl', 'hr', 'pt', 'cs', 'pt-BR', 'da', 'pt-PT', 'nl', 'pa', 'en', 'ro', 'en-AU', 'ru', 'en-GB', 'sr', 'et', 'si', 'fa', 'sk', 'fi', 'sl', 'fil', 'es', 'fr', 'es-419', 'fr-CA', 'sw', 'gl', 'sv', 'ka', 'ta', 'de', 'te', 'el', 'th', 'gu', 'tr', 'iw', 'uk', 'hi', 'ur', 'hu', 'uz', 'is', 'vi', 'id', 'zu', 'it']
const DEFAULT_LOCALE = get(conf, 'DEFAULT_LOCALE', 'en')
const LANGUAGE = SUPPORTED_LANGUAGES.includes(DEFAULT_LOCALE) ? DEFAULT_LOCALE : 'en'

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
 * @property {string} [place_id]
 * @property {string[]} [types]
 * @property {string} [vicinity]
 */

const CONFIG_KEY = 'GOOGLE_API_KEY'

/**
 * The Google search provider
 */
class GoogleSearchProvider extends AbstractSearchProvider {

    /**
     * @param {ProviderDetectorArgs} args
     */
    constructor (args) {
        super(args)

        const apiKey = get(conf, CONFIG_KEY)
        if (!apiKey) {
            throw new Error(`There is no '${CONFIG_KEY}' in .env.`)
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
     * @returns {Promise<GooglePlace[]>}
     */
    async get ({ query, context = null, helpers = {} }) {
        const params = new URLSearchParams({
            query,
            key: this.apiKey,
        })

        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?${params.toString()}`
        this.logger.info({ msg: 'request textsearch googleapis', url })

        try {
            const answer = await fetch(url)

            if (answer.status === 200) {
                /**
                 * @type {{html_attributions: string[], results: GooglePlace[], status: string, [error_message]: string, [info_messages]: string[], [next_page_token]: string}}
                 */
                const result = await answer.json()
                this.logger.info({ msg: 'response textsearch googleapis', url, status: answer.status, data: result })

                /**
                 * @see https://developers.google.com/maps/documentation/places/web-service/search-text#PlacesSearchStatus
                 */
                if (result.status === 'OK') {
                    /** @type {GooglePlace[]} */
                    const ret = []

                    for (const row of result.results) {
                        const placeId = get(row, 'place_id')
                        if (placeId) {
                            ret.push(await this.getByPlaceId(placeId))
                        }
                    }

                    return ret
                }
            } else {
                const result = await answer.text()
                this.logger.info({ msg: 'response textsearch googleapis', url, status: answer.status, data: result })
            }
        } catch (err) {
            this.logger.error({ msg: 'googleapis textsearch error', url, err })
            throw err
        }

        return []
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
            'address_components',
            'formatted_address',
            'geometry',
            'name',
            'photo',
            'place_id',
            'plus_code',
            'type',
            'url',
            'utc_offset',
            'vicinity',
            'wheelchair_accessible_entrance',
        ].join(',')

        const placeDetailsResult = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${this.apiKey}&language=${LANGUAGE}`)

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
        return data.map((item) => {
            // https://developers.google.com/maps/documentation/places/web-service/supported_types#table2
            const components = get(item, 'address_components', []).reduce((result, addressComponent) => {
                const { short_name = null, long_name = null, types = [] } = addressComponent
                const newResultItems = {}
                types.filter((type) => type !== 'political').forEach((type) => {
                    if (!result[type] && !newResultItems[type]) {
                        newResultItems[type] = { short_name, long_name }
                    }
                })

                return { ...result, ...newResultItems }
            }, {})

            return {
                /**
                 * In an emergency try to build the `value` as dadata does
                 * {@link https://confluence.hflabs.ru/pages/viewpage.action?pageId=1105068073}
                 */
                value: get(item, 'formatted_address'),
                unrestricted_value: get(item, 'formatted_address'),
                rawValue: get(item, 'value'),
                data: {
                    postal_code: get(components, ['postal_code', 'long_name']),
                    country: get(components, ['country', 'long_name']),
                    country_iso_code: get(components, ['country', 'short_name']),
                    federal_district: undefined,
                    region_fias_id: undefined,
                    region_kladr_id: undefined,
                    region_iso_code: undefined,
                    region_with_type: get(components, ['administrative_area_level_1', 'long_name']),
                    region_type: undefined,
                    region_type_full: undefined,
                    region: get(components, ['administrative_area_level_1', 'long_name']),
                    area_fias_id: undefined,
                    area_kladr_id: undefined,
                    area_with_type: get(components, ['administrative_area_level_2', 'long_name']),
                    area_type: undefined,
                    area_type_full: undefined,
                    area: get(components, ['administrative_area_level_2', 'long_name']),
                    city_fias_id: undefined,
                    city_kladr_id: undefined,
                    city_with_type: get(components, ['locality', 'long_name']),
                    city_type: undefined,
                    city_type_full: undefined,
                    city: get(components, ['locality', 'long_name']),
                    city_area: undefined,
                    city_district_fias_id: undefined,
                    city_district_kladr_id: undefined,
                    city_district_with_type: get(components, ['administrative_area_level_3', 'long_name']),
                    city_district_type: undefined,
                    city_district_type_full: undefined,
                    city_district: get(components, ['administrative_area_level_3', 'long_name']),
                    settlement_fias_id: undefined,
                    settlement_kladr_id: undefined,
                    settlement_with_type: undefined,
                    settlement_type: undefined,
                    settlement_type_full: undefined,
                    settlement: undefined,
                    street_fias_id: undefined,
                    street_kladr_id: undefined,
                    street_with_type: get(components, ['route', 'long_name']),
                    street_type: undefined,
                    street_type_full: undefined,
                    street: get(components, ['route', 'long_name']),
                    stead_fias_id: undefined,
                    stead_cadnum: undefined,
                    stead_type: undefined,
                    stead_type_full: undefined,
                    stead: undefined,
                    house_fias_id: undefined,
                    house_kladr_id: undefined,
                    house_cadnum: undefined,
                    house_type: undefined,
                    house_type_full: undefined,
                    house: get(components, ['street_number', 'long_name']),
                    block_type: undefined,
                    block_type_full: undefined,
                    block: undefined,
                    entrance: undefined,
                    floor: undefined,
                    flat_fias_id: undefined,
                    flat_cadnum: undefined,
                    flat_type: undefined,
                    flat_type_full: undefined,
                    flat: undefined,
                    flat_area: undefined,
                    square_meter_price: undefined,
                    flat_price: undefined,
                    postal_box: undefined,
                    fias_id: undefined,
                    fias_code: undefined,
                    fias_level: undefined,
                    fias_actuality_state: undefined,
                    kladr_id: undefined,
                    geoname_id: undefined,
                    capital_marker: undefined,
                    okato: undefined,
                    oktmo: undefined,
                    tax_office: undefined,
                    tax_office_legal: undefined,
                    timezone: undefined,
                    geo_lat: get(item, ['geometry', 'location', 'lat']),
                    geo_lon: get(item, ['geometry', 'location', 'lng']),
                    beltway_hit: undefined,
                    beltway_distance: undefined,
                    metro: undefined,
                    divisions: undefined,
                    qc_geo: undefined,
                    qc_complete: undefined,
                    qc_house: undefined,
                    history_values: undefined,
                    unparsed_parts: undefined,
                    source: undefined,
                    qc: undefined,
                },
                provider: {
                    name: GOOGLE_PROVIDER,
                    rawData: item,
                },
            }
        })
    }
}

module.exports = { GoogleSearchProvider }
