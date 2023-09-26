const index = require('@app/condo/index')

const { makeLoggedInAdminClient, setFakeClientMode } = require('@open-condo/keystone/test.utils')

const { createTestOrganization } = require('@condo/domains/organization/utils/testSchema')
const { createTestProperty, Property } = require('@condo/domains/property/utils/testSchema')

const { findPropertyByOrganizationAndAddress, tokenifyAddress } = require('./propertyFinder')

const { keystone } = index

setFakeClientMode(index)
describe('propertyFinder', () => {
    let adminContext

    beforeAll(async () => {
        adminContext = await keystone.createContext({ skipAccessControl: true })
    })

    test('tokenify', () => {
        const tokens = tokenifyAddress('Краснодарский край, г Новороссийск, К.Маркса 13, Офис 3')

        expect(tokens).toHaveLength(6)
        expect(tokens).toEqual(expect.arrayContaining(['Краснодарский', 'край', 'Новороссийск', 'Маркса', '13', 'Офис']))
    })

    test('find property', async () => {
        const admin = await makeLoggedInAdminClient()
        const [organization] = await createTestOrganization(admin)

        const [property1] = await createTestProperty(admin, organization, { address: 'Краснодарский край, г Новороссийск, К.Маркса 13' })
        await createTestProperty(admin, organization, { address: 'Краснодарский край, г Новороссийск, ул К.Маркса 14' })
        await createTestProperty(admin, organization, { address: 'Краснодарский край, г Новороссийск, Карла Маркса 14' })
        await createTestProperty(admin, organization, { address: 'Новороссийск, ул К Маркса 14' })

        const addressFromReceipt = 'Краснодарский край, г Новороссийск, К.Маркса 13, Офис 3'
        const [finded, score] = await findPropertyByOrganizationAndAddress(adminContext, organization.id, addressFromReceipt)

        expect(finded).toBeTruthy()
        expect(finded.id).toEqual(property1.id)
        expect(score).toEqual(83.33)
    })
})
