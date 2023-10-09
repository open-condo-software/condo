const index = require('@app/condo/index')

const { makeLoggedInAdminClient, setFakeClientMode } = require('@open-condo/keystone/test.utils')

const { createTestOrganization } = require('@condo/domains/organization/utils/testSchema')
const { createTestProperty } = require('@condo/domains/property/utils/testSchema')

const { findPropertyByOrganizationAndAddress, tokenifyAddress } = require('./propertyFinder')

const { keystone } = index

setFakeClientMode(index)
describe('propertyFinder', () => {
    describe('tokenify', () => {
        const cases = [
            ['Краснодарский край, г Новороссийск, К.Маркса 13, Офис 3', ['краснодарский', 'край', 'новороссийск', 'маркса', '13', 'офис', '3']],
            ['Краснодарский "край", город Новороссийск, Карла Маркса 3, Офис 1', ['краснодарский', 'край', 'новороссийск', 'маркса', 'карла', '3', 'офис', '1', 'город']],
            ['г Екатеринбург, ул. Тепло-Мягкого; дом 3а,. кв 100;', ['екатеринбург', 'ул', 'тепло', 'мягкого', 'дом', '3а', 'кв', '100']],
        ]

        test.each(cases)('%p', (addressString, expectedTokens) => {
            const tokens = tokenifyAddress(addressString)

            expect(tokens).toHaveLength(expectedTokens.length)
            expect(tokens).toEqual(expect.arrayContaining(expectedTokens))
        })
    })

    describe('find', () => {
        let adminContext

        beforeAll(async () => {
            adminContext = await keystone.createContext({ skipAccessControl: true })
        })

        test('find property', async () => {
            const admin = await makeLoggedInAdminClient()
            const [organization] = await createTestOrganization(admin)

            const [property1] = await createTestProperty(admin, organization, { address: 'Краснодарский край, г Новороссийск, К.Маркса 13, офис 3' })
            await createTestProperty(admin, organization, { address: 'Краснодарский край, г Новороссийск, К.Маркса 13, Офис 1' })
            await createTestProperty(admin, organization, { address: 'Краснодарский край, г Новороссийск, ул К.Маркса 14' })
            await createTestProperty(admin, organization, { address: 'Краснодарский край, г Новороссийск, Карла Маркса 14' })
            await createTestProperty(admin, organization, { address: 'Новороссийск, ул К Маркса 14' })

            const addressFromReceipt = 'Краснодарский край, г Новороссийск, К.Маркса 13, Офис 3'
            const [[finded], score] = await findPropertyByOrganizationAndAddress(adminContext, organization.id, addressFromReceipt)

            expect(finded).toBeTruthy()
            expect(finded.id).toEqual(property1.id)
            expect(score).toEqual(100)
        })
    })
})
