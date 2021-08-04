const faker = require('faker')

export const buildFakeAddressMeta = (address, withFlat = false) => {
    let extraAttrs = {}
    let full_address = address

    // SHOULD CONTAINS value = DADATA_SUGGESTION (OPTIONAL FLAT + FLAT_TYPE
    if (withFlat) {
        const flat = faker.datatype.number({min: 1, max: 50})
        const flat_type = 'кв'
        full_address = `${address}, ${flat_type} ${flat}`
        extraAttrs = {
            flat,
            flat_type
        }
    }

    return {
        dv: 1, city: faker.address.city(), zipCode: faker.address.zipCode(),
        street: faker.address.streetName(), number: faker.address.secondaryAddress(),
        county: faker.address.county(),
        address,
        value: full_address,
        ...extraAttrs
    }
}
