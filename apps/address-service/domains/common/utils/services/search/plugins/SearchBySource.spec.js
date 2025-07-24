/**
 * @jest-environment node
 */

const index = require('@app/address-service/index')
const { faker } = require('@faker-js/faker')

const { makeLoggedInAdminClient, setFakeClientMode } = require('@open-condo/keystone/test.utils')

const {
    Address,
    AddressSource,
} = require('@address-service/domains/address/utils/testSchema')
const {
    createOrUpdateAddressWithSource,
    hashJSON,
} = require('@address-service/domains/common/utils/services/search/searchServiceUtils')

const { SearchBySource } = require('./SearchBySource')

const { keystone } = index

describe('SearchBySource plugin', () => {
    let adminClient
    let context
    let sender

    setFakeClientMode(index)

    beforeAll(async () => {
        context = await keystone.createContext({ skipAccessControl: true })
        adminClient = await makeLoggedInAdminClient()
        sender = { dv: 1, fingerprint: faker.random.alphaNumeric(8) }
    })
    test('helpers using correctly', async () => {
        const source = faker.address.streetAddress(true)
        const tin = faker.random.numeric(12)
        const helpers = { tin }

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
            provider: {
                name: 'test',
                rawData: {},
            },
            helpers,
        }

        const key = faker.datatype.uuid()

        const addressData = {
            address: source,
            meta: fakeMeta,
            key,
        }

        const addressModel = await createOrUpdateAddressWithSource(adminClient, Address, AddressSource, addressData, source, {
            dv: 1,
            sender,
        })

        const plugin = new SearchBySource()

        const params = { req: { id: faker.datatype.uuid() } }

        expect(plugin.isEnabled(source, params)).toEqual(true)

        plugin.prepare({
            keystoneContext: context,
            req: params.req,
            helpers: { tin },
        })
        const result = await plugin.search(source)

        expect(result).toEqual(expect.objectContaining({
            address: source,
            meta: expect.objectContaining({ helpers }),
        }))

        const sources = await AddressSource.getAll(adminClient, { address: { id: addressModel.id } })
        const helpersHash = hashJSON(helpers)
        const fullSource = `${source}|helpers:${helpersHash}`.toLowerCase()

        expect(sources).toHaveLength(1)
        expect(sources).toEqual(expect.arrayContaining([
            expect.objectContaining({ source: fullSource }),
        ]))
    })
})
