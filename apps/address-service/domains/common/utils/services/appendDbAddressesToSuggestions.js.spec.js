const index = require('@app/address-service/index')
const get = require('lodash/get')

const conf = require('@open-condo/config')
const { makeLoggedInAdminClient, setFakeClientMode } = require('@open-condo/keystone/test.utils')

const {
    createTestAddress,
    updateTestAddress,
    createTestAddressSource,
    updateTestAddressSource,
} = require('@address-service/domains/address/utils/testSchema')

const { appendDbAddressesToSuggestions } = require('./appendDbAddressesToSuggestions')

const { GOOGLE_PROVIDER } = require('../../constants/providers')

const { keystone } = index

const ADDRESS_PROVIDER = get(conf, 'PROVIDER')

const LAGOS_DE_CORONAS_ADDRESSES = [
    {
        AddressSchema: {
            'address': 'C. de los Lagos de Coronas, 9, 50011 Zaragoza, España',
            'key': 'españa~aragón~zaragoza~zaragoza~calle_de_los_lagos_de_coronas~9',
            'meta': {
                'data': {
                    'area': 'Zaragoza',
                    'city': 'Zaragoza',
                    'house': '9',
                    'region': 'Aragón',
                    'street': 'Calle de los Lagos de Coronas',
                    'country': 'España',
                    'geo_lat': 41.6574294,
                    'geo_lon': -0.9333313000000002,
                    'postal_code': '50011',
                    'area_with_type': 'Zaragoza',
                    'city_with_type': 'Zaragoza',
                    'country_iso_code': 'ES',
                    'region_with_type': 'Aragón',
                    'street_with_type': 'Calle de los Lagos de Coronas',
                },
                'value': 'C. de los Lagos de Coronas, 9, 50011 Zaragoza, España',
                'helpers': {},
                'provider': {
                    'name': 'google',
                    'rawData': {
                        'url': 'https://maps.google.com/?q=C.+de+los+Lagos+de+Coronas,+9,+50011+Zaragoza,+Espa%C3%B1a&ftid=0xd596b6d38257fab:0xded3d707cc3bdb85',
                        'name': 'C. de los Lagos de Coronas, 9',
                        'types': [
                            'street_address',
                        ],
                        'geometry': {
                            'location': {
                                'lat': 41.6574294,
                                'lng': -0.9333313000000002,
                            },
                            'viewport': {
                                'northeast': {
                                    'lat': 41.6587950802915,
                                    'lng': -0.9320505697084983,
                                },
                                'southwest': {
                                    'lat': 41.6560971197085,
                                    'lng': -0.9347485302915024,
                                },
                            },
                        },
                        'place_id': 'ChIJq38lOG1rWQ0Rhds7zAfX094',
                        'vicinity': 'Zaragoza',
                        'plus_code': {
                            'global_code': '8CHXM348+XM',
                            'compound_code': 'M348+XM Zaragoza, España',
                        },
                        'utc_offset': 120,
                        'formatted_address': 'C. de los Lagos de Coronas, 9, 50011 Zaragoza, España',
                        'address_components': [
                            {
                                'types': [
                                    'street_number',
                                ],
                                'long_name': '9',
                                'short_name': '9',
                            },
                            {
                                'types': [
                                    'route',
                                ],
                                'long_name': 'Calle de los Lagos de Coronas',
                                'short_name': 'C. de los Lagos de Coronas',
                            },
                            {
                                'types': [
                                    'locality',
                                    'political',
                                ],
                                'long_name': 'Zaragoza',
                                'short_name': 'Zaragoza',
                            },
                            {
                                'types': [
                                    'administrative_area_level_2',
                                    'political',
                                ],
                                'long_name': 'Zaragoza',
                                'short_name': 'Z',
                            },
                            {
                                'types': [
                                    'administrative_area_level_1',
                                    'political',
                                ],
                                'long_name': 'Aragón',
                                'short_name': 'AR',
                            },
                            {
                                'types': [
                                    'country',
                                    'political',
                                ],
                                'long_name': 'España',
                                'short_name': 'ES',
                            },
                            {
                                'types': [
                                    'postal_code',
                                ],
                                'long_name': '50011',
                                'short_name': '50011',
                            },
                        ],
                    },
                },
                'unrestricted_value': 'C. de los Lagos de Coronas, 9, 50011 Zaragoza, España',
            },
        },
        AddressSourceSchema: [
            { 'source': 'españa, zaragoza, calle de los lagos de coronas, 9' },
            { 'source': 'c. de los lagos de coronas, 9, 50011 zaragoza, españa' },
        ],
    },
    {
        AddressSchema: {
            'address': 'C. de los Lagos de Coronas, 23, 50011 Zaragoza, España',
            'key': 'españa~aragón~zaragoza~zaragoza~calle_de_los_lagos_de_coronas~23',
            'meta': {
                'data': {
                    'area': 'Zaragoza',
                    'city': 'Zaragoza',
                    'house': '23',
                    'region': 'Aragón',
                    'street': 'Calle de los Lagos de Coronas',
                    'country': 'España',
                    'geo_lat': 41.6537865,
                    'geo_lon': -0.9341464999999999,
                    'postal_code': '50011',
                    'area_with_type': 'Zaragoza',
                    'city_with_type': 'Zaragoza',
                    'country_iso_code': 'ES',
                    'region_with_type': 'Aragón',
                    'street_with_type': 'Calle de los Lagos de Coronas',
                },
                'value': 'C. de los Lagos de Coronas, 23, 50011 Zaragoza, España',
                'provider': {
                    'name': 'google',
                    'rawData': {
                        'url': 'https://maps.google.com/?q=C.+de+los+Lagos+de+Coronas,+23,+50011+Zaragoza,+Espa%C3%B1a&ftid=0xd596b120b957989:0xc8dd75e1682ce771',
                        'name': 'C. de los Lagos de Coronas, 23',
                        'types': [
                            'street_address',
                        ],
                        'geometry': {
                            'location': {
                                'lat': 41.6537865,
                                'lng': -0.9341464999999999,
                            },
                            'viewport': {
                                'northeast': {
                                    'lat': 41.6551322802915,
                                    'lng': -0.9328643697084978,
                                },
                                'southwest': {
                                    'lat': 41.6524343197085,
                                    'lng': -0.9355623302915019,
                                },
                            },
                        },
                        'place_id': 'EjVDLiBkZSBsb3MgTGFnb3MgZGUgQ29yb25hcywgMjMsIDUwMDExIFphcmFnb3phLCBTcGFpbiIwEi4KFAoSCYl5lQsSa1kNER0HPQfKOSD4EBcqFAoSCXVHVmUSa1kNESZcAqW4kRPN',
                        'vicinity': 'C. de los Lagos de Coronas, 23, Zaragoza',
                        'utc_offset': 120,
                        'formatted_address': 'C. de los Lagos de Coronas, 23, 50011 Zaragoza, España',
                        'address_components': [
                            {
                                'types': [
                                    'street_number',
                                ],
                                'long_name': '23',
                                'short_name': '23',
                            },
                            {
                                'types': [
                                    'route',
                                ],
                                'long_name': 'Calle de los Lagos de Coronas',
                                'short_name': 'C. de los Lagos de Coronas',
                            },
                            {
                                'types': [
                                    'locality',
                                    'political',
                                ],
                                'long_name': 'Zaragoza',
                                'short_name': 'Zaragoza',
                            },
                            {
                                'types': [
                                    'administrative_area_level_2',
                                    'political',
                                ],
                                'long_name': 'Zaragoza',
                                'short_name': 'Z',
                            },
                            {
                                'types': [
                                    'administrative_area_level_1',
                                    'political',
                                ],
                                'long_name': 'Aragón',
                                'short_name': 'AR',
                            },
                            {
                                'types': [
                                    'country',
                                    'political',
                                ],
                                'long_name': 'España',
                                'short_name': 'ES',
                            },
                            {
                                'types': [
                                    'postal_code',
                                ],
                                'long_name': '50011',
                                'short_name': '50011',
                            },
                        ],
                    },
                },
                'unrestricted_value': 'C. de los Lagos de Coronas, 23, 50011 Zaragoza, España',
            },
        },
        AddressSourceSchema: [
            { 'source': 'españa, zaragoza, calle de los lagos de coronas, 23' },
            { 'source': 'c. de los lagos de coronas, 23, 50011 zaragoza, españa' },
        ],
    },
]

describe('Augmented address suggestions', () => {
    setFakeClientMode(index)

    let adminClient
    let godContext
    let isGoogleProvider

    beforeAll(async () => {
        adminClient = await makeLoggedInAdminClient()
        godContext = await keystone.createContext({ skipAccessControl: true })

        isGoogleProvider = ADDRESS_PROVIDER === GOOGLE_PROVIDER
    })

    describe('Lagos de coronas', () => {
        const createdAddresses = []

        beforeAll(async () => {
            for (const address of LAGOS_DE_CORONAS_ADDRESSES) {
                const [createdAddress] = await createTestAddress(adminClient, { ...address.AddressSchema })

                const addressSources = []

                for (const source of address.AddressSourceSchema) {
                    const [createdSource] = await createTestAddressSource(adminClient, {
                        ...source,
                        address: { connect: { id: createdAddress.id } },
                    })
                    addressSources.push(createdSource.id)
                }

                createdAddresses.push({
                    AddressSchema: createdAddress.id,
                    AddressSourceSchema: addressSources,
                })
            }
        })

        afterAll(async () => {
            const deletedAt = { deletedAt: new Date().toISOString() }

            for (const address of createdAddresses) {

                await updateTestAddress(adminClient, address.AddressSchema, deletedAt)

                for (const source of address.AddressSourceSchema) {
                    await updateTestAddressSource(adminClient, source, deletedAt)
                }
            }
        })

        test('With addresses from db (Lagos de coronas)', async () => {
            const augmentedSuggestions = await appendDbAddressesToSuggestions(
                godContext,
                [{ value: 'España, Zaragoza, Calle de los Lagos de Coronas' }]
            )

            expect(augmentedSuggestions).toHaveLength(3)

            expect(augmentedSuggestions[0].value).toEqual('España, Zaragoza, Calle de los Lagos de Coronas')
            expect(augmentedSuggestions[0].isAugmentedAddress).toBeUndefined()

            if (isGoogleProvider) {
                expect(augmentedSuggestions[1].value).toEqual('España, Zaragoza, Calle de los lagos de coronas, 9')
                expect(augmentedSuggestions[1].isAugmentedAddress).toBeTruthy()

                expect(augmentedSuggestions[2].value).toEqual('España, Zaragoza, Calle de los lagos de coronas, 23')
                expect(augmentedSuggestions[2].isAugmentedAddress).toBeTruthy()
            } else {
                expect(augmentedSuggestions[1].value).toEqual('C. de los Lagos de Coronas, 9, 50011 Zaragoza, España')
                expect(augmentedSuggestions[1].isAugmentedAddress).toBeTruthy()

                expect(augmentedSuggestions[2].value).toEqual('C. de los Lagos de Coronas, 23, 50011 Zaragoza, España')
                expect(augmentedSuggestions[2].isAugmentedAddress).toBeTruthy()
            }
        })

        test('With addresses from db 2 (Lagos de coronas 2)', async () => {
            const augmentedSuggestions = await appendDbAddressesToSuggestions(
                godContext,
                [{ value: 'España, Zaragoza, Calle de los Lagos de Coronas, 2' }]
            )

            expect(augmentedSuggestions).toHaveLength(2)

            expect(augmentedSuggestions[0].value).toEqual('España, Zaragoza, Calle de los Lagos de Coronas, 2')
            expect(augmentedSuggestions[0].isAugmentedAddress).toBeUndefined()

            if (isGoogleProvider) {
                expect(augmentedSuggestions[1].value).toEqual('España, Zaragoza, Calle de los lagos de coronas, 23')
                expect(augmentedSuggestions[1].isAugmentedAddress).toBeTruthy()
            } else {
                expect(augmentedSuggestions[1].value).toEqual('C. de los Lagos de Coronas, 23, 50011 Zaragoza, España')
                expect(augmentedSuggestions[1].isAugmentedAddress).toBeTruthy()
            }
        })

        test('With addresses from db 3 (Lagos de coronas 9)', async () => {
            const augmentedSuggestions = await appendDbAddressesToSuggestions(
                godContext,
                [{ value: 'España, Zaragoza, Calle de los Lagos de Coronas, 9' }]
            )

            expect(augmentedSuggestions).toHaveLength(1)

            expect(augmentedSuggestions[0].value).toEqual('España, Zaragoza, Calle de los Lagos de Coronas, 9')
            expect(augmentedSuggestions[0].isAugmentedAddress).toBeUndefined()
        })

        test('With addresses from db 4 (Lagos de coronas 42)', async () => {
            const augmentedSuggestions = await appendDbAddressesToSuggestions(
                godContext,
                [{ value: 'España, Zaragoza, Calle de los Lagos de Coronas, 42' }]
            )

            expect(augmentedSuggestions).toHaveLength(1)

            expect(augmentedSuggestions[0].value).toEqual('España, Zaragoza, Calle de los Lagos de Coronas, 42')
            expect(augmentedSuggestions[0].isAugmentedAddress).toBeUndefined()
        })
    })
})
