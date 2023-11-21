import { faker } from '@faker-js/faker'

import { generateSignature } from './generateSignature'


describe('generateSignature', () => {
    test('must be deterministic', () => {
        const userId = faker.datatype.uuid()
        const organizationId = faker.datatype.uuid()
        const testKey = faker.random.alphaNumeric(16)
        const sign1 = generateSignature(organizationId, userId, testKey)
        const sign2 = generateSignature(organizationId, userId, testKey)
        const sign3 = generateSignature(organizationId, userId, testKey)

        expect(sign1).toBeDefined()
        expect(sign1).toBe(sign2)
        expect(sign1).toBe(sign3)
    })

    test('should return different results for different data set', () => {
        const userId = faker.datatype.uuid()
        const organizationId1 = faker.datatype.uuid()
        const organizationId2 = faker.datatype.uuid()
        const testKey = faker.random.alphaNumeric(16)
        const sign1 = generateSignature(organizationId1, userId, testKey)
        const sign2 = generateSignature(organizationId2, userId, testKey)

        expect(sign1).toBeDefined()
        expect(sign2).toBeDefined()
        expect(sign1).not.toBe(sign2)
    })
})
