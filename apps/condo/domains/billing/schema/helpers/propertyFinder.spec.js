const index = require('@app/condo/index')

const { makeLoggedInAdminClient, setFakeClientMode } = require('@open-condo/keystone/test.utils')

const { createTestOrganization } = require('@condo/domains/organization/utils/testSchema')
const { createTestProperty } = require('@condo/domains/property/utils/testSchema')

const { findPropertyByOrganizationAndAddress, tokenifyAddress, orderedIntersection } = require('./propertyFinder')

const { keystone } = index

setFakeClientMode(index)
describe('propertyFinder', () => {
    describe('tokenify', () => {
        const cases = [
            // [<address string>, <array of tokens>]
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

    describe('orderedIntersection', () => {
        const cases = [
            // ['string1', 'string2', ['expected', 'interception', 'tokens', 'array']]
            ['aa bb cc', 'dd aa bb aa bb cc dd', ['aa', 'bb', 'cc']],
            ['1 2 3 4 5 6 7', '1 2 1 2 3 1 2 3 5 1 2 3 4 5 6 2 3 7', ['1', '2', '3', '4', '5', '6', '7']],
            ['Батюшкова, д 2 к 4', 'г Москва, поселение Сосенское, деревня Николо-Хованское, ул Батюшкова, д 2 к 4', ['батюшкова', '2', '4']],
            ['Батюшкова, д 2/4', 'г Москва, поселение Сосенское, деревня Николо-Хованское, ул Батюшкова, д 2 к 4', ['батюшкова', '2', '4']],
            ['Батюшкова, д 2 к 4, к. 7', 'г Москва, поселение Сосенское, деревня Николо-Хованское, ул Батюшкова, д 2 к 4', ['батюшкова', '2', '4']],
            ['Батюшкова, д 2/4, к. 7', 'г Москва, поселение Сосенское, деревня Николо-Хованское, ул Батюшкова, д 2 к 4', ['батюшкова', '2', '4']],
        ]

        test.each(cases)('%p', (str1, str2, expectedIntersection) => {
            expect(orderedIntersection(tokenifyAddress(str1), tokenifyAddress(str2))).toEqual(expectedIntersection)
        })
    })

    describe('find', () => {
        let adminContext
        let admin

        beforeAll(async () => {
            adminContext = await keystone.createContext({ skipAccessControl: true })
            admin = await makeLoggedInAdminClient()
        })

        test('find property', async () => {
            const [organization] = await createTestOrganization(admin)

            const [property1] = await createTestProperty(admin, organization, { address: 'Краснодарский край, г Новороссийск, К.Маркса 13, офис 3' })
            await createTestProperty(admin, organization, { address: 'Краснодарский край, г Новороссийск, К.Маркса 13, Офис 1' })
            await createTestProperty(admin, organization, { address: 'Краснодарский край, г Новороссийск, ул К.Маркса 14' })
            await createTestProperty(admin, organization, { address: 'Краснодарский край, г Новороссийск, Карла Маркса 14' })
            await createTestProperty(admin, organization, { address: 'Новороссийск, ул К Маркса 14' })

            await createTestProperty(admin, organization, { address: 'г Москва, поселение Сосенское, деревня Николо-Хованское, ул Батюшкова, д 4 к 2' })
            const [property2] = await createTestProperty(admin, organization, { address: 'г Москва, поселение Сосенское, деревня Николо-Хованское, ул Батюшкова, д 2/4' })
            await createTestProperty(admin, organization, { address: 'г Москва, поселение Сосенское, деревня Николо-Хованское, ул Батюшкова, д 2/2' })
            await createTestProperty(admin, organization, { address: 'г Москва, поселение Сосенское, деревня Николо-Хованское, ул Батюшкова, д 8 к 3' })

            const addressFromReceipt1 = 'Краснодарский край, г Новороссийск, Маркса 13, Офис 3'
            const [found1, score1] = await findPropertyByOrganizationAndAddress(adminContext, organization.id, addressFromReceipt1)

            const addressFromReceipt2 = 'Батюшкова, д 2 к 4'
            const [found2, score2] = await findPropertyByOrganizationAndAddress(adminContext, organization.id, addressFromReceipt2)

            const addressFromReceipt3 = 'Николо-Хованское; Батюшкова, д 2/4, к.3'
            const [found3, score3] = await findPropertyByOrganizationAndAddress(adminContext, organization.id, addressFromReceipt3)

            expect(found1).toHaveLength(1)
            expect(found1[0].id).toEqual(property1.id)
            expect(score1).toEqual(100)

            expect(found2).toHaveLength(1)
            expect(found2[0].id).toEqual(property2.id)
            expect(score2).toEqual(100)

            expect(found3).toHaveLength(1)
            expect(found3[0].id).toEqual(property2.id)
            expect(score3).toEqual(83.33)
        })
    })
})
