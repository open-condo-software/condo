const faker = require('faker')

export const buildFakeAddressMeta = (address) => {
    return {
        dv: 1, city: faker.address.city(), zipCode: faker.address.zipCode(),
        street: faker.address.streetName(), number: faker.address.secondaryAddress(),
        county: faker.address.county(),
        address,
    }
}
