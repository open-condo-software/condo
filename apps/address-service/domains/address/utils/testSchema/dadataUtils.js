const { faker: mockFaker, faker } = require('@faker-js/faker')

function generateDadataSuggestionItemData (attrs = {}) {
    const fiasId = mockFaker.datatype.uuid()
    const regionType = faker.lorem.word(2)
    const region = faker.address.county()
    const cityType = faker.lorem.word(2)
    const city = faker.address.city()
    const streetType = faker.lorem.word(2)
    const street = faker.address.street()
    const settlementType = faker.lorem.word(2)
    const settlement = faker.address.county()

    return {
        postal_code: faker.address.zipCode(),
        country: faker.address.country(),
        country_iso_code: faker.address.countryCode(),
        federal_district: faker.lorem.word(10),
        region_fias_id: faker.datatype.uuid(),
        region_with_type: `${regionType} ${region}`,
        region_type: regionType,
        region_type_full: `${regionType}${faker.lorem.word(4)}`,
        region: region,
        area_fias_id: null,
        area_with_type: null,
        area_type: null,
        area_type_full: null,
        area: null,
        city_fias_id: faker.datatype.uuid(),
        city_with_type: `${cityType} ${city}`,
        city_type: cityType,
        city_type_full: `${cityType}${faker.lorem.word(4)}`,
        city: city,
        city_area: faker.lorem.word(10),
        city_district_fias_id: null,
        city_district_with_type: null,
        city_district_type: null,
        city_district_type_full: null,
        city_district: null,
        settlement_fias_id: faker.datatype.uuid(),
        settlement_with_type: `${settlementType} ${settlement}`,
        settlement_type: settlementType,
        settlement_type_full: `${settlementType}${faker.lorem.word(4)}`,
        settlement: settlement,
        street_fias_id: faker.datatype.uuid(),
        street_with_type: `${streetType} ${street}`,
        street_type: streetType,
        street_type_full: `${streetType}${faker.lorem.word(4)}`,
        street: street,
        stead_fias_id: null,
        stead_type: null,
        stead_type_full: null,
        stead: null,
        house_fias_id: fiasId,
        house_type: faker.lorem.word(2),
        house_type_full: faker.lorem.word(6),
        house: faker.address.buildingNumber(),
        block_type: null,
        block_type_full: null,
        block: null,
        fias_id: fiasId,
        fias_code: null,
        fias_level: 7,
        ...attrs,
    }
}

function generateDadataSuggestionItem (attrs = {}, dataAttrs = {}) {
    const data = generateDadataSuggestionItemData(dataAttrs)

    return {
        data,
        value: [data.city_with_type, data.settlement_with_type, data.street_with_type, `${data.house_type} ${data.house}`].filter(Boolean).join(', '),
        unrestricted_value: [data.postal_code, data.region_with_type, data.city_with_type, data.city_district_with_type, data.settlement_with_type, data.street_with_type, `${data.house_type} ${data.house}`].filter(Boolean).join(', '),
        ...attrs,
    }
}

module.exports = {
    generateDadataSuggestionItem,
    generateDadataSuggestionItemData,
}
