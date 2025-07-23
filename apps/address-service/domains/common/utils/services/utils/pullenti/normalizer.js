const { XMLParser } = require('fast-xml-parser')
const get = require('lodash/get')

const { BUILDING_ADDRESS_TYPE } = require('@address-service/domains/common/constants/addressTypes')
const { VALID_DADATA_BUILDING_TYPES } = require('@address-service/domains/common/constants/common')
const { PULLENTI_PROVIDER } = require('@address-service/domains/common/constants/providers')
const { resolveArea } = require('@address-service/domains/common/utils/services/utils/pullenti/areaResolver')
const { resolveCityDistrict } = require('@address-service/domains/common/utils/services/utils/pullenti/cityDistrictResolver')
const { resolveCity } = require('@address-service/domains/common/utils/services/utils/pullenti/cityResolver')
const { resolveFlat } = require('@address-service/domains/common/utils/services/utils/pullenti/flatResolver')
const { extractLastFiasId, extractLastGarParam, getLevel, getGar } = require('@address-service/domains/common/utils/services/utils/pullenti/helpers')
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

// TODO (AleX83Xpert): Improve normalizer. It must return same data as dadata normalizer.

/**
 * @param {string} rawXmlString XML string
 * @returns {NormalizedBuilding}
 */
function normalize (rawXmlString) {
    const parser = getXmlParser()
    let jsonObj = parser.parse(rawXmlString)

    let textObj = jsonObj?.textaddr?.textobj || []
    textObj = Array.isArray(textObj) ? textObj : [textObj]

    // TODO (AleX83Xpert): Maybe we should check expired status?
    // if (
    //     !textObj
    //     || textObj.length === 0
    //     || textObj.some((obj) => !!obj.gar?.expired)
    // ) {
    //     return null
    // }

    const countryLevel = getLevel(jsonObj, 'country')
    const garRegionArea_region = getGar(jsonObj, 'regionarea', 'region')
    const garRegionArea_adminarea = getGar(jsonObj, 'regionarea', 'adminarea')
    const garCity_city = getGar(jsonObj, 'city', 'city')
    const garCity_adminarea = getGar(jsonObj, 'city', 'adminarea')
    const garRegionCity_city = getGar(jsonObj, 'regioncity', 'city')
    const garRegionCity_region = getGar(jsonObj, 'regioncity', 'region')
    const garDistrict_adminarea = getGar(jsonObj, 'district', 'adminarea')
    const garDistrict_municipalarea = getGar(jsonObj, 'district', 'municipalarea')
    const garLocality_locality = getGar(jsonObj, 'locality', 'locality')
    const garStreet_street = getGar(jsonObj, 'street', 'street')
    const garPlot_plot = getGar(jsonObj, 'plot', 'plot')
    const garBuilding_building = getGar(jsonObj, 'building', 'building')
    const garApartment_room = getGar(jsonObj, 'apartment', 'room')

    const {
        region,
        region_type,
        region_type_full,
        region_with_type,
        region_fias_id,
        region_kladr_id,
    } = resolveRegion(garRegionArea_region || (garCity_city ? null : (garRegionCity_region || garRegionArea_adminarea)))

    const {
        area,
        area_type,
        area_type_full,
        area_with_type,
        area_fias_id,
        area_kladr_id,
    } = resolveArea(garDistrict_adminarea || garCity_adminarea || (garCity_city ? null : garDistrict_municipalarea))

    const {
        city,
        city_type,
        city_type_full,
        city_with_type,
        city_fias_id,
        city_kladr_id,
    } = resolveCity(garCity_city || garCity_adminarea || garRegionCity_city || garRegionCity_region)

    const {
        city_district,
        city_district_type,
        city_district_type_full,
        city_district_with_type,
        city_district_fias_id,
        city_district_kladr_id,
    } = resolveCityDistrict(garCity_city ? null : (garDistrict_municipalarea || garDistrict_adminarea))

    const {
        settlement,
        settlement_type,
        settlement_type_full,
        settlement_with_type,
        settlement_fias_id,
        settlement_kladr_id,
    } = resolveSettlement(garLocality_locality)

    const {
        street,
        street_type,
        street_type_full,
        street_with_type,
        street_fias_id,
        street_kladr_id,
    } = resolveStreet(garStreet_street)

    const {
        stead,
        stead_type,
        stead_type_full,
        stead_fias_id,
        stead_cadnum,
    } = resolveStead(garPlot_plot)

    const {
        house,
        house_type,
        house_type_full,
        house_fias_id,
        house_kladr_id,
        house_cadnum,
        block,
        block_type,
        block_type_full,
        postal_code,
    } = resolveHouse(garBuilding_building)

    const {
        flat,
        flat_type,
        flat_type_full,
        flat_fias_id,
        flat_cadnum,
    } = resolveFlat(garApartment_room)

    const fias_id = extractLastFiasId(textObj)
    const path = get(garBuilding_building, 'path', null)
    const kladr_id = extractLastGarParam(textObj, 'kladrcode')
    const okato = extractLastGarParam(textObj, 'okato')
    const oktmo = extractLastGarParam(textObj, 'oktmo')
    const gpspoint = extractLastGarParam(textObj, 'gpspoint')
    const [geo_lat, geo_lon] = gpspoint ? gpspoint.split(' ') : [null, null]

    const value = [
        region_with_type,
        area_with_type,
        city_with_type,
        city_district_with_type,
        settlement_with_type,
        street_with_type,
        house ? `${house_type_full} ${house}` : null,
        block ? `${block_type_full} ${block}` : null,
        stead ? `${stead_type_full} ${stead}` : null,
    ].filter(Boolean).join(', ')

    return {
        value,
        unrestricted_value: [postal_code, path].filter(Boolean).join(', '),
        rawValue: path,
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
            area_fias_id,
            area_kladr_id,
            area_with_type,
            area_type,
            area_type_full,
            area,
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
