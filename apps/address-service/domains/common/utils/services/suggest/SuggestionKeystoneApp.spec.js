/**
 * @jest-environment node
 */

const index = require('@app/address-service/index')
const { faker } = require('@faker-js/faker')

const { fetch } = require('@open-condo/keystone/fetch')
const { makeClient, setFakeClientMode } = require('@open-condo/keystone/test.utils')

const { generateDadataSuggestionItem } = require('@address-service/domains/address/utils/testSchema/dadataUtils')
const { DadataSuggestionProvider } = require('@address-service/domains/common/utils/services/suggest/providers')

async function requestApp (client, { method = 'GET', path = '/' }) {
    const response = await fetch(`${client.serverUrl}${path}`, { method })

    return {
        statusCode: response.status,
        body: await response.text(),
    }
}

describe('SuggestionKeystoneApp', () => {
    setFakeClientMode(index)

    let mockedCallToDadata
    let client

    beforeAll(async () => {
        client = await makeClient()
    })

    beforeEach(() => {
        mockedCallToDadata = jest.spyOn(DadataSuggestionProvider.prototype, 'callToDadata')
            .mockResolvedValue({ suggestions: [] })
    })

    afterEach(() => {
        jest.clearAllMocks()
        mockedCallToDadata.mockRestore()
    })

    test('should return 400 when query parameter s is missing', async () => {
        const response = await requestApp(client, { path: '/suggest' })

        expect(response.statusCode).toBe(400)
    })

    test('should proxy external provider answer for GET /suggest', async () => {
        const dadataSuggestion = generateDadataSuggestionItem({
            value: 'г Москва, ул Тверская, д 1',
            unrestricted_value: 'г Москва, ул Тверская, д 1',
        }, {
            city_with_type: 'г Москва',
            street_with_type: 'ул Тверская',
            house_type: 'д',
            house: '1',
            qc_geo: 0,
            geo_lat: '55.7558',
            geo_lon: '37.6173',
        })

        mockedCallToDadata.mockResolvedValueOnce({ suggestions: [dadataSuggestion] })

        const response = await requestApp(client, {
            path: '/suggest?s=%D0%9C%D0%BE%D1%81%D0%BA%D0%B2%D0%B0&provider=dadata&session=s1&context=suggestHouse&language=ru&count=5',
        })

        expect(response.statusCode).toBe(200)
        expect(mockedCallToDadata).toHaveBeenCalledTimes(1)

        const payload = JSON.parse(response.body)
        expect(payload).toEqual(expect.arrayContaining([
            expect.objectContaining({
                value: 'г Москва, ул Тверская, д 1',
                unrestricted_value: 'г Москва, ул Тверская, д 1',
                provider: expect.objectContaining({ name: 'dadata' }),
            }),
        ]))
    })

    test('should return raw provider payload when bypass=true', async () => {
        const rawSuggestion = { value: faker.address.streetAddress(), data: { fias_id: faker.datatype.uuid() } }
        mockedCallToDadata.mockResolvedValueOnce({ suggestions: [rawSuggestion] })

        const response = await requestApp(client, {
            path: '/suggest?s=test&provider=dadata&bypass=true',
        })

        expect(response.statusCode).toBe(200)
        expect(JSON.parse(response.body)).toEqual([rawSuggestion])
    })
})
