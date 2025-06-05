const { XMLParser } = require('fast-xml-parser')
const get = require('lodash/get')

const conf = require('@open-condo/config')
const { fetch } = require('@open-condo/keystone/fetch')

const { BUILDING_ADDRESS_TYPE } = require('@address-service/domains/common/constants/addressTypes')
const { VALID_DADATA_BUILDING_TYPES } = require('@address-service/domains/common/constants/common')
const { PULLENTI_PROVIDER } = require('@address-service/domains/common/constants/providers')

const { AbstractSearchProvider } = require('./AbstractSearchProvider')
const { resolveArea } = require('./utils/pullenti/areaResolver')
const { resolveCity } = require('./utils/pullenti/cityResolver')
const { resolveFlat } = require('./utils/pullenti/flatResolver')
const { extractLastFiasId, extractLastGarParam } = require('./utils/pullenti/helpers')
const { resolveHouse } = require('./utils/pullenti/houseResolver')
const { resolveRegion } = require('./utils/pullenti/regionResolver')
const { resolveSettlement } = require('./utils/pullenti/settlementResolver')
const { resolveStead } = require('./utils/pullenti/steadResolver')
const { resolveStreet } = require('./utils/pullenti/streetResolver')

const CONFIG_KEY = 'PULLENTI_CONFIG'

/**
 * The Pullenti search provider
 * Uses local server with own custom index
 * Suitable for RU addresses
 */
class PullentiSearchProvider extends AbstractSearchProvider {

    /**
     * @param {ProviderDetectorArgs} args
     */
    constructor (args) {
        super(args)

        const config = get(conf, CONFIG_KEY)
        if (!config) {
            throw new Error(`There is no '${CONFIG_KEY}' in .env.`)
        }

        const { url } = JSON.parse(config)

        if (!url) {
            throw new Error(`There is no 'url' field within the json-value of the '${CONFIG_KEY}' in .env.`)
        }

        this.url = url
    }

    getProviderName () {
        return PULLENTI_PROVIDER
    }

    /**
     * @returns {Promise<string|null>}
     */
    async get ({ query, context = '', helpers = {} }) {
        const response = await fetch(`${this.url}`, {
            method: 'POST',
            body: `<ProcessSingleAddressText>${query}</ProcessSingleAddressText>`,
        })

        if (response.ok) {
            return await response.text()
        }

        return null
    }

    getLevel (item, levelName) {
        if (!item || !item.textaddr || !Array.isArray(item.textaddr.textobj)) {
            return null
        }

        for (const level of item.textaddr.textobj) {
            if (level && level.level === levelName) {
                return level
            }
        }
        
        return null
    }

    /**
     * @param {string} xmlString XML string
     * @returns {NormalizedBuilding[]}
     */
    normalize (xmlString) {
        const parser = new XMLParser({
            ignoreAttributes: false,
            numberParseOptions: {
                eNotation: false,
            },
        })
        let jsonObj = parser.parse(xmlString)

        const countryLevel = this.getLevel(jsonObj, 'country')
        const regionAreaLevel = this.getLevel(jsonObj, 'regionarea')
        const cityLevel = this.getLevel(jsonObj, 'city')
        const regionCityLevel = this.getLevel(jsonObj, 'regioncity')
        const districtLevel = this.getLevel(jsonObj, 'district')
        const localityLevel = this.getLevel(jsonObj, 'locality')
        const streetLevel = this.getLevel(jsonObj, 'street')
        const plotLevel = this.getLevel(jsonObj, 'plot')
        const buildingLevel = this.getLevel(jsonObj, 'building')
        const apartmentLevel = this.getLevel(jsonObj, 'apartment')

        const {
            region,
            region_type = null,
            region_type_full = null,
            region_with_type = null,
            region_fias_id = null,
            region_kladr_id = null,
        } = resolveRegion(regionAreaLevel)

        const {
            city,
            city_type = null,
            city_type_full = null,
            city_with_type = null,
            city_fias_id = null,
            city_kladr_id = null,
        } = resolveCity(cityLevel || regionCityLevel || {})

        const {
            area = null,
            area_type = null,
            area_type_full = null,
            area_with_type = null,
            area_fias_id = null,
            area_kladr_id = null,
        } = resolveArea(districtLevel)

        const {
            settlement = null,
            settlement_type = null,
            settlement_type_full = null,
            settlement_with_type = null,
            settlement_fias_id = null,
            settlement_kladr_id = null,
        } = resolveSettlement(localityLevel)

        const {
            street,
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

        const fias_id = extractLastFiasId(jsonObj?.textaddr?.textobj || [])
        const kladr_id = extractLastGarParam(jsonObj?.textaddr?.textobj || [], 'kladrcode')
        const okato = extractLastGarParam(jsonObj?.textaddr?.textobj || [], 'okato')
        const oktmo = extractLastGarParam(jsonObj?.textaddr?.textobj || [], 'oktmo')
        const gpspoint = extractLastGarParam(jsonObj?.textaddr?.textobj || [], 'gpspoint')
        const [geo_lat, geo_lon] = gpspoint ? gpspoint.split(' ') : [null, null]

        return [{
            value: get(jsonObj, ['textaddr', 'text']),
            unrestricted_value: [postal_code, get(buildingLevel, ['gar', 'path'])].filter(Boolean).join(' '),
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
                city_district_fias_id: null,
                city_district_kladr_id: null,
                city_district_with_type: null,
                city_district_type: null,
                city_district_type_full: null,
                city_district: null,
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
                rawData: xmlString,
            },
            type: VALID_DADATA_BUILDING_TYPES.includes(house_type_full) ? BUILDING_ADDRESS_TYPE : null,
        }]
    }
}

module.exports = { PullentiSearchProvider }
