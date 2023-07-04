const { faker } = require('@faker-js/faker')
const { sample } = require('lodash')

const { AddressMetaDataFields } = require('../../schema/fields/AddressMetaField')

const FIAS_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 35, 65, 75, 90, 91]
const FIAS_ACTUALITY_STATE = [0, 1]

const buildFakeAddressMeta = (withFlat = false, extraAttrs = {}) => {
    const emptyData = Object.assign({}, ...Object.keys(AddressMetaDataFields).map((field) => ({[field]: null})))
    emptyData.postal_code = faker.address.zipCode()
    emptyData.country = faker.address.country()
    emptyData.country_iso_code = faker.address.countryCode()
    emptyData.capital_marker = String(faker.datatype.number())

    emptyData.fias_id = faker.datatype.uuid()
    emptyData.fias_level = String(sample(FIAS_LEVELS))
    emptyData.fias_code = String(faker.datatype.number())
    emptyData.fias_actuality_state = String(sample(FIAS_ACTUALITY_STATE))
    emptyData.kladr_id = String(faker.datatype.number())
    emptyData.geoname_id = String(faker.datatype.number())
    emptyData.okato = String(faker.datatype.number())
    emptyData.oktmo = String(faker.datatype.number())
    emptyData.tax_office = String(faker.datatype.number())
    emptyData.tax_office_legal = String(faker.datatype.number())
    emptyData.qc_geo = String(faker.datatype.number())

    emptyData.city = faker.address.city()
    emptyData.city_type = 'г'
    emptyData.city_type_full = 'город'
    emptyData.city_with_type = `${emptyData.city_type} ${emptyData.city}`
    emptyData.city_fias_id = faker.datatype.uuid()
    emptyData.city_kladr_id = String(faker.datatype.number())

    emptyData.street = faker.address.street() 
    emptyData.street_type = 'ул'
    emptyData.street_type_full = 'улица'
    emptyData.street_with_type = `${emptyData.street_type} ${emptyData.street}`
    emptyData.street_fias_id = faker.datatype.uuid()
    emptyData.street_kladr_id = String(faker.datatype.number())

    emptyData.house = String(faker.datatype.number({ max: 100000000 }))
    emptyData.house_type = 'д'
    emptyData.house_type_full = 'дом'
    emptyData.house_fias_id = faker.datatype.uuid()
    emptyData.house_kladr_id = String(faker.datatype.number())

    emptyData.block = String(faker.datatype.number())
    emptyData.block_type = 'б'
    emptyData.block_type_full= 'блок'

    emptyData.region = faker.address.state()
    emptyData.region_iso_code = faker.address.stateAbbr()
    emptyData.region_type_full = 'регион'
    emptyData.region_type = 'р'
    emptyData.region_with_type = `${emptyData.region_type} ${emptyData.region}`
    emptyData.region_fias_id = faker.datatype.uuid()
    emptyData.region_kladr_id = String(faker.datatype.number())

    if (withFlat) {
        emptyData.flat = String(faker.datatype.number())
        emptyData.flat_type = 'кв'
        emptyData.flat_type_full = 'квартира'
    }

    emptyData.geo_lat = faker.address.latitude()
    emptyData.geo_lon = faker.address.longitude()

    for (const key in extraAttrs) (
        emptyData[key] = extraAttrs[key]
    )

    const fullHouseName = [emptyData.house_type, emptyData.house, emptyData.block_type, emptyData.block]
        .filter(Boolean)
        .join(' ')
    const flat = emptyData.flat ? `${emptyData.flat_type} ${emptyData.flat}` : null
    const value = [emptyData.region_with_type, emptyData.city_with_type, emptyData.street_with_type, fullHouseName, flat]
        .filter(Boolean)
        .join(', ')
    const unrestrictedValue = [emptyData.postal_code, value].join(', ')
    return {
        dv: 1,
        data: emptyData,
        value,
        unrestricted_value: unrestrictedValue,
    }
}

const buildFakeAddressAndMeta = (withFlat, addressMetaExtraAttrs = {}) => {
    const addressMeta = buildFakeAddressMeta(withFlat, addressMetaExtraAttrs)
    let address = addressMeta.value
    if (withFlat) {
        const index = address.lastIndexOf(',')
        address = address.substring(0, index)
    }
    return { address, addressMeta }
}

module.exports = {
    buildFakeAddressMeta,
    buildFakeAddressAndMeta,
}