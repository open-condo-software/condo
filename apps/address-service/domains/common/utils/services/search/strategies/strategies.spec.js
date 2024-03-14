const index = require('@app/address-service/index')
const { faker } = require('@faker-js/faker')
const { isEqual } = require('lodash')

const { catchErrorFrom, setFakeClientMode, makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')

const { Address, AddressSource } = require('@address-service/domains/address/utils/testSchema')
const { SearchBySource } = require('@address-service/domains/common/utils/services/search/plugins')
const { createOrUpdateAddressWithSource } = require('@address-service/domains/common/utils/services/search/searchServiceUtils')
const { createBulkSearchStrategy } = require('@address-service/domains/common/utils/services/search/strategies')
const { BULK_SEARCH_STRATEGIES } = require('@address-service/domains/common/utils/services/search/strategies/constants')

const { keystone } = index

describe('Search strategies', () => {
    let adminClient
    let sender

    setFakeClientMode(index)

    beforeAll(async () => {
        adminClient = await makeLoggedInAdminClient()
        sender = { dv: 1, fingerprint: faker.random.alphaNumeric(8) }
    })

    it('Error must be thrown on unknown strategy', async () => {
        const wrongStrategyName = faker.datatype.string(8)

        await catchErrorFrom(
            async () => {
                createBulkSearchStrategy({ body: { strategy: wrongStrategyName } }, null, [])
            },
            (err) => {
                expect(err.message).toBe(`Wrong strategy '${wrongStrategyName}'. Allowed values are: EACH_ITEM_TO_PLUGINS, ALL_ITEMS_TO_EACH_PLUGIN`)
            },
        )
    })

    it('Each strategy must return the same result for the same input', async () => {
        const source1 = faker.address.streetAddress()
        const source2 = faker.address.streetAddress()
        const source3 = faker.address.streetAddress()

        const sources = [source1, source2, source3]
        const addressModels = []

        for (const source of sources) {
            const fakeMeta = {
                value: source,
                unrestricted_value: source,
                data: {
                    country: faker.address.country(),
                    region: faker.address.state(),
                    area: faker.address.state(),
                    city: faker.address.cityName(),
                    city_district: faker.address.cityName(),
                    settlement: faker.address.cityName(),
                    street: faker.address.streetName(),
                    house: faker.random.alphaNumeric(2),
                    block: faker.random.alphaNumeric(3),
                },
                provider: { name: 'test', rawData: {} },
            }

            const addressData = { address: source, meta: fakeMeta, key: faker.datatype.uuid() }

            const addressModel = await createOrUpdateAddressWithSource(adminClient, Address, AddressSource, addressData, source, {
                dv: 1,
                sender,
            })

            addressModels.push(addressModel)
        }

        const results = []
        for (const strategyName of BULK_SEARCH_STRATEGIES) {
            const strategy = createBulkSearchStrategy({ body: { strategy: strategyName } }, keystone, [new SearchBySource()])
            const result = await strategy.search({ body: { items: [source1, source3] } })
            results.push(result)
        }

        for (let i = 0; i < results.length; i++) {
            const oneResult = results[i]
            const anotherResult = results[i >= results.length - 1 ? 0 : i + 1]
            expect(isEqual(oneResult, anotherResult)).toBe(true)
            expect(oneResult).toEqual(expect.objectContaining({
                addresses: expect.objectContaining({
                    [addressModels[0].id]: expect.objectContaining({ address: addressModels[0].address }),
                    [addressModels[2].id]: expect.objectContaining({ address: addressModels[2].address }),
                }),
                map: {
                    [source1]: { err: undefined, data: expect.objectContaining({ addressKey: addressModels[0].id }) },
                    [source3]: { err: undefined, data: expect.objectContaining({ addressKey: addressModels[2].id }) },
                },
            }))
        }
    })
})
