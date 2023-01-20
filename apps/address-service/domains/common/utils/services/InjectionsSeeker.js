const get = require('lodash/get')

const { KEYWORDS_SPECIAL_SYMBOLS_REGEX } = require('@address-service/domains/address/constants')
const { AddressInjection } = require('@address-service/domains/address/utils/serverSchema')
const { INJECTIONS_PROVIDER } = require('@address-service/domains/common/constants/providers')

/**
 * A class used to search injections within database.
 * Injections will be included into suggested results in normalized form {@see SuggestionKeystoneApp}
 */
class InjectionsSeeker {

    /**
     * @param {String} s The string to search injections with
     */
    constructor (s) {
        this.s = s
    }

    /**
     * Splits search string to words
     * @returns {string[]}
     */
    extractSearchParts () {
        return this.s
            .replace(KEYWORDS_SPECIAL_SYMBOLS_REGEX, '')
            .split(' ')
            .filter(Boolean)
            .filter((x) => x.length > 1) // to allow search by house numbers contains 2 digits
    }

    /**
     * Builds the `where` condition for the database query
     * @returns {{AND: [{deletedAt: null},{AND: {keywords_contains_i: *}[]}]}}
     */
    buildWhere () {
        const searchParts = this.extractSearchParts()

        return {
            AND: [
                { deletedAt: null },
                {
                    // There is an ability to use `AND` or `OR`
                    AND: searchParts.map((searchPart) => ({ keywords_contains_i: searchPart })),
                },
            ],
        }
    }

    /**
     * Normalizes injections
     * @param {AddressInjection[]} injections
     * @returns {(NormalizedBuilding & {rawValue: string})[]}
     */
    normalize (injections) {
        return injections.map((injection) => {
            const country = get(injection, 'country', '')
            const region_with_type = String(`${get(injection, ['region', 'typeShort'], '')} ${get(injection, ['region', 'name'], '')}`).trim()
            const area_with_type = String(`${get(injection, ['area', 'typeShort'], '')} ${get(injection, ['area', 'name'], '')}`).trim()
            const city_with_type = String(`${get(injection, ['city', 'typeShort'], '')} ${get(injection, ['city', 'name'], '')}`).trim()
            const city_district_with_type = String(`${get(injection, ['cityDistrict', 'typeShort'], '')} ${get(injection, ['cityDistrict', 'name'], '')}`).trim()
            const settlement_with_type = String(`${get(injection, ['settlement', 'typeShort'], '')} ${get(injection, ['settlement', 'name'], '')}`).trim()
            const street_with_type = String(`${get(injection, ['street', 'typeShort'], '')} ${get(injection, ['street', 'name'], '')}`).trim()
            const house_type = get(injection, ['house', 'typeShort'], '')
            const house = get(injection, ['house', 'name'], '')
            const block_type = get(injection, ['block', 'typeShort'], '')
            const block = get(injection, ['block', 'name'], '')

            const value = (isUnrestricted = false) => [
                isUnrestricted ? country : null,
                region_with_type,
                area_with_type,
                city_with_type,
                city_district_with_type,
                settlement_with_type,
                street_with_type,
                `${house_type} ${house}`.trim(),
                `${block_type} ${block}`.trim(),
            ].filter(Boolean).join(', ').trim()

            return {
                value: value(),
                unrestricted_value: value(true),
                rawValue: `injectionId:${injection.id}`,
                data: {
                    postal_code: null,
                    country,
                    country_iso_code: null,
                    federal_district: null,
                    region_fias_id: null,
                    region_kladr_id: null,
                    region_iso_code: null,
                    region_with_type,
                    region_type: get(injection, ['region', 'typeShort'], ''),
                    region_type_full: get(injection, ['region', 'typeFull'], ''),
                    region: get(injection, ['region', 'name'], ''),
                    area_fias_id: null,
                    area_kladr_id: null,
                    area_with_type,
                    area_type: get(injection, ['area', 'typeShort'], ''),
                    area_type_full: get(injection, ['area', 'typeFull'], ''),
                    area: get(injection, ['area', 'name']),
                    city_fias_id: null,
                    city_kladr_id: null,
                    city_with_type,
                    city_type: get(injection, ['city', 'typeShort'], ''),
                    city_type_full: get(injection, ['city', 'typeFull'], ''),
                    city: get(injection, ['city', 'name']),
                    city_area: null,
                    city_district_fias_id: null,
                    city_district_kladr_id: null,
                    city_district_with_type,
                    city_district_type: get(injection, ['cityDistrict', 'typeShort'], ''),
                    city_district_type_full: get(injection, ['cityDistrict', 'typeFull'], ''),
                    city_district: get(injection, ['cityDistrict', 'name']),
                    settlement_fias_id: null,
                    settlement_kladr_id: null,
                    settlement_with_type,
                    settlement_type: get(injection, ['settlement', 'typeShort'], ''),
                    settlement_type_full: get(injection, ['settlement', 'typeFull'], ''),
                    settlement: get(injection, ['settlement', 'name']),
                    street_fias_id: null,
                    street_kladr_id: null,
                    street_with_type,
                    street_type: get(injection, ['street', 'typeShort'], ''),
                    street_type_full: get(injection, ['street', 'typeFull'], ''),
                    street: get(injection, ['street', 'name']),
                    stead_fias_id: null,
                    stead_cadnum: null,
                    stead_type: null,
                    stead_type_full: null,
                    stead: null,
                    house_fias_id: null,
                    house_kladr_id: null,
                    house_cadnum: null,
                    house_type,
                    house_type_full: get(injection, ['house', 'typeFull'], ''),
                    house,
                    block_type,
                    block_type_full: get(injection, ['block', 'typeFull'], ''),
                    block,
                    entrance: null,
                    floor: null,
                    flat_fias_id: null,
                    flat_cadnum: null,
                    flat_type: null,
                    flat_type_full: null,
                    flat: null,
                    flat_area: null,
                    square_meter_price: null,
                    flat_price: null,
                    postal_box: null,
                    fias_id: null,
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
                    divisions: null,
                    qc_geo: null,
                    qc_complete: null,
                    qc_house: null,
                    history_values: null,
                    unparsed_parts: null,
                    source: null,
                    qc: null,
                },
                provider: {
                    name: INJECTIONS_PROVIDER,
                    rawData: injection,
                },
            }
        })
    }

    /**
     * @param {Keystone} context The keystone's context
     * @returns {Promise<AddressInjection[]>}
     */
    async getInjections (context) {
        return await AddressInjection.getAll(context, this.buildWhere())
    }
}

module.exports = { InjectionsSeeker }
