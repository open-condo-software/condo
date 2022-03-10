const { makeClient } = require('@core/keystone/test.utils')
const { makeClientWithProperty } = require('@condo/domains/property/utils/testSchema')
const { GET_PROPERTY_UNIT_TYPES } = require('@condo/domains/property/gql')
const { UNIT_TYPES } = require('@condo/domains/property/constants/common')

describe('PropertyUnitTypeService', () => {
    describe('User', () => {
        it('can get property unit types info',  async () => {
            const client = await makeClientWithProperty()
            const { data: { result: { unitTypes } } } = await client.query(GET_PROPERTY_UNIT_TYPES)

            expect(unitTypes).toBeDefined()
            expect(unitTypes).toHaveLength(UNIT_TYPES.length)
            expect(unitTypes[0]).toHaveProperty('type')
            expect(unitTypes[0]).toHaveProperty('label')
            expect(unitTypes[0]).toHaveProperty('prefix')
            expect(unitTypes[0]).toHaveProperty('showNumber')
            expect(unitTypes.map(({ type }) => type)).toStrictEqual(UNIT_TYPES)
        })
    })

    describe('Anonymous', () => {
        it('can not get property unit types info', async () => {
            const client = await makeClient()
            const { errors } = await client.query(GET_PROPERTY_UNIT_TYPES)
            expect(errors).toHaveLength(1)
            expect(errors[0]).toHaveProperty('name', 'AuthenticationError')
        })
    })
})
