const faker = require('faker')
const { AddressMetaDataFields } = require('../addressApi/AddressMetaSchema')

const buildFakeAddressMeta = (withFlat = false) => {
    const emptyData = Object.assign({}, ...AddressMetaDataFields.map((field) => ({[field]: null})))
    emptyData.postal_code = faker.address.zipCode()
    emptyData.country = faker.address.country()
    emptyData.country_iso_code = faker.address.countryCode()

    emptyData.city = faker.address.city()
    emptyData.city_type = 'c'
    emptyData.city_type_full = 'city'
    emptyData.city_with_type = `${emptyData.city_type} ${emptyData.city}`

    emptyData.street = faker.address.streetName()
    emptyData.street_type = 'st'
    emptyData.street_type_full = 'street'
    emptyData.street_with_type = `${emptyData.street_type} ${emptyData.street}`

    emptyData.house = String(faker.datatype.number())
    emptyData.house_type = 'h'
    emptyData.house_type_full = 'house'

    if (faker.datatype.boolean()) {
        emptyData.block = String(faker.datatype.number())
        emptyData.block_type = 'b'
        emptyData.block_type_full= 'block'
    }

    if (faker.datatype.boolean()) {
        emptyData.region = faker.address.state()
        emptyData.region_iso_code = faker.address.stateAbbr()
        emptyData.region_type_full = 'region'
        emptyData.region_type = 'r'
        emptyData.region_with_type = `${emptyData.region_type} ${emptyData.region}`
    }

    if (withFlat) {
        emptyData.flat = String(faker.datatype.number())
        emptyData.flat_type = 'fl'
        emptyData.flat_type_full = 'flat'
    }

    emptyData.geo_lat = faker.address.latitude()
    emptyData.geo_lon = faker.address.longitude()

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
        address: value
    }
}

const buildFakeAddressAndMeta = (withFlat) => {
    const addressMeta = buildFakeAddressMeta(withFlat)
    let address = addressMeta.address
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