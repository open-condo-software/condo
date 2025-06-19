const { XMLParser } = require('fast-xml-parser')
const get = require('lodash/get')

const { BUILDING_ADDRESS_TYPE } = require('@address-service/domains/common/constants/addressTypes')
const { VALID_DADATA_BUILDING_TYPES } = require('@address-service/domains/common/constants/common')
const { PULLENTI_PROVIDER } = require('@address-service/domains/common/constants/providers')
const { resolveCityDistrict } = require('@address-service/domains/common/utils/services/utils/pullenti/cityDistrictResolver')
const { resolveCity } = require('@address-service/domains/common/utils/services/utils/pullenti/cityResolver')
const { resolveFlat } = require('@address-service/domains/common/utils/services/utils/pullenti/flatResolver')
const { extractLastFiasId, extractLastGarParam, getLevel } = require('@address-service/domains/common/utils/services/utils/pullenti/helpers')
const { resolveHouse } = require('@address-service/domains/common/utils/services/utils/pullenti/houseResolver')
const { resolveRegion } = require('@address-service/domains/common/utils/services/utils/pullenti/regionResolver')
const { resolveSettlement } = require('@address-service/domains/common/utils/services/utils/pullenti/settlementResolver')
const { resolveStead } = require('@address-service/domains/common/utils/services/utils/pullenti/steadResolver')
const { resolveStreet } = require('@address-service/domains/common/utils/services/utils/pullenti/streetResolver')

/**
 * Creates and returns an instance of XMLParser configured for Pullenti XML responses.
 * @returns {XMLParser}
 */
function getXmlParser () {
    return new XMLParser({
        ignoreAttributes: false,
        numberParseOptions: {
            eNotation: false,
        },
    })
}

/**
 * @param {string} rawXmlString XML string
 * @returns {NormalizedBuilding}
 */
function normalize (rawXmlString) {
    const parser = getXmlParser()
    let jsonObj = parser.parse(rawXmlString)

    let textObj = jsonObj?.textaddr?.textobj || []
    textObj = Array.isArray(textObj) ? textObj : [textObj]

    if (
        !textObj
        || textObj.length === 0
        || textObj.some((obj) => !!obj.gar?.expired)
    ) {
        return null
    }

    const countryLevel = getLevel(jsonObj, 'country')
    const regionAreaLevel = getLevel(jsonObj, 'regionarea')
    const cityLevel = getLevel(jsonObj, 'city')
    const regionCityLevel = getLevel(jsonObj, 'regioncity')
    const districtLevel = getLevel(jsonObj, 'district')
    const localityLevel = getLevel(jsonObj, 'locality')
    const streetLevel = getLevel(jsonObj, 'street')
    const plotLevel = getLevel(jsonObj, 'plot')
    const buildingLevel = getLevel(jsonObj, 'building')
    const apartmentLevel = getLevel(jsonObj, 'apartment')

    const {
        region = null,
        region_type = null,
        region_type_full = null,
        region_with_type = null,
        region_fias_id = null,
        region_kladr_id = null,
    } = resolveRegion(regionAreaLevel)

    const {
        city = null,
        city_type = null,
        city_type_full = null,
        city_with_type = null,
        city_fias_id = null,
        city_kladr_id = null,
    } = resolveCity(cityLevel || regionCityLevel || {})

    const {
        city_district_fias_id = null,
        city_district_kladr_id = null,
        city_district_with_type = null,
        city_district_type = null,
        city_district_type_full = null,
        city_district = null,
    } = resolveCityDistrict(districtLevel)

    const {
        settlement = null,
        settlement_type = null,
        settlement_type_full = null,
        settlement_with_type = null,
        settlement_fias_id = null,
        settlement_kladr_id = null,
    } = resolveSettlement(localityLevel)

    const {
        street = null,
        street_type = null,
        street_type_full = null,
        street_with_type = null,
        street_fias_id = null,
        street_kladr_id = null,
    } = resolveStreet(streetLevel)

    const {
        house = null,
        house_type = null,
        house_type_full = null,
        block = null,
        block_type = null,
        block_type_full = null,
        house_fias_id = null,
        house_kladr_id = null,
        house_cadnum = null,
        postal_code = null,
    } = resolveHouse(buildingLevel)

    const {
        stead = null,
        stead_type = null,
        stead_type_full = null,
        stead_fias_id = null,
        stead_cadnum = null,
    } = resolveStead(plotLevel)

    const {
        flat = null,
        flat_type = null,
        flat_type_full = null,
        flat_fias_id = null,
        flat_cadnum = null,
    } = resolveFlat(apartmentLevel)

    const fias_id = extractLastFiasId(textObj)
    const kladr_id = extractLastGarParam(textObj, 'kladrcode')
    const okato = extractLastGarParam(textObj, 'okato')
    const oktmo = extractLastGarParam(textObj, 'oktmo')
    const gpspoint = extractLastGarParam(textObj, 'gpspoint')
    const [geo_lat, geo_lon] = gpspoint ? gpspoint.split(' ') : [null, null]

    const value = [
        region_with_type,
        city_with_type,
        city_district_with_type,
        settlement_with_type,
        street_with_type,
        house ? `${house_type_full} ${house}` : null,
        block ? `${block_type_full} ${block}` : null,
        stead ? `${stead_type_full} ${stead}` : null,
    ].filter(Boolean).join(', ')

    return {
        value, //: get(jsonObj, ['textaddr', 'text']),
        unrestricted_value: [postal_code, get(buildingLevel, ['gar', 'path'])].filter(Boolean).join(', '),
        rawValue: get(jsonObj, ['textaddr', 'text']),
        data: {
            postal_code,
            country: get(countryLevel, ['area', 'name']),
            country_iso_code: get(jsonObj, ['textaddr', 'alpha2']),
            federal_district: null,
            region_fias_id,
            region_kladr_id,
            region_iso_code: null,
            region_with_type,
            region_type,
            region_type_full,
            region,
            area_fias_id: null,
            area_kladr_id: null,
            area_with_type: null,
            area_type: null,
            area_type_full: null,
            area: null,
            city_fias_id,
            city_kladr_id,
            city_with_type,
            city_type,
            city_type_full,
            city,
            city_area: null,
            city_district_fias_id,
            city_district_kladr_id,
            city_district_with_type,
            city_district_type,
            city_district_type_full,
            city_district,
            settlement_fias_id,
            settlement_kladr_id,
            settlement_with_type,
            settlement_type,
            settlement_type_full,
            settlement,
            street_fias_id,
            street_kladr_id,
            street_with_type,
            street_type,
            street_type_full,
            street,
            stead_fias_id,
            stead_cadnum,
            stead_type,
            stead_type_full,
            stead,
            house_fias_id,
            house_kladr_id,
            house_cadnum,
            house_type,
            house_type_full,
            house,
            block_type,
            block_type_full,
            block,
            entrance: null,
            floor: null,
            flat_fias_id,
            flat_cadnum,
            flat_type,
            flat_type_full,
            flat,
            flat_area: null,
            square_meter_price: null,
            flat_price: null,
            postal_box: null,
            fias_id,
            fias_code: null,
            fias_level: null,
            fias_actuality_state: null,
            kladr_id,
            geoname_id: null,
            capital_marker: null,
            okato,
            oktmo,
            tax_office: null,
            tax_office_legal: null,
            timezone: null,
            geo_lat,
            geo_lon,
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
            qc: get(jsonObj, ['textaddr', 'coef'], null),
        },
        provider: {
            name: PULLENTI_PROVIDER,
            rawData: rawXmlString,
        },
        type: VALID_DADATA_BUILDING_TYPES.includes(house_type_full) ? BUILDING_ADDRESS_TYPE : null,
    }
}

module.exports = { getXmlParser, normalize }
