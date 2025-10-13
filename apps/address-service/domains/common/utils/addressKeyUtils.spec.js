const { GOOGLE_PROVIDER, FIAS_PROVIDERS } = require('@address-service/domains/common/constants/providers')
const { generateAddressKey, generateAddressKeyFromFiasId, JOINER, SPACE_REPLACER } = require('@address-service/domains/common/utils/addressKeyUtils')

describe('Address key utils', () => {
    describe('will generate the correct address key', () => {
        /**
         * @type {NormalizedBuildingData[]}
         */
        const cases = [
            [
                {
                    country: 'Some  [country] ',
                    region: 'far... \r  \n\t    {region},',
                    area: '\t',
                    city: 'The= \t N\nCity',
                    city_district: 'District: $19',
                    settlement: '|~',
                    street_type_full: '$str!\tType',
                    street: '  Straight,\tstreet',
                    house: '42/1',
                    block_type_full: '*korpus!',
                    block: '!@#$%^&*)(+=.,_:;4"\'`[]{}№|<>~ ',
                },
                [
                    'some', SPACE_REPLACER, 'country',
                    JOINER,
                    'far', SPACE_REPLACER, 'region',
                    JOINER,
                    'the', SPACE_REPLACER, 'n', SPACE_REPLACER, 'city',
                    JOINER,
                    'district', SPACE_REPLACER, '19',
                    JOINER,
                    'str', SPACE_REPLACER, 'type',
                    JOINER,
                    'straight', SPACE_REPLACER, 'street',
                    JOINER,
                    '42/1',
                    JOINER,
                    'korpus',
                    JOINER,
                    '4',
                ].join(''),
            ],
            [
                {
                    country: 'Molvania%',
                    region: 'South; ~district',
                    settlement: 'Stone, _ creek',
                    street: 'Усть-бобруйская',
                    house: '№+<42>',
                },
                [
                    'molvania',
                    JOINER,
                    'south', SPACE_REPLACER, 'district',
                    JOINER,
                    'stone', SPACE_REPLACER, 'creek',
                    JOINER,
                    'усть-бобруйская', // The dash must be kept
                    JOINER,
                    '42',
                ].join(''),
            ],
        ]

        test.each(cases)('%p should be converted to `%s`', (data, expected) => {
            const t = generateAddressKey({
                data,
                value: 'some value unnecessary for this test',
                unrestricted_value: '',
            })
            expect(t).toBe(expected)
        })
    })

    describe('generateAddressKeyFromFiasId', () => {
        it('should return FIAS-based key when house_fias_id is present', () => {
            const normalizedBuilding = {
                data: {
                    house_fias_id: '12345678-1234-1234-1234-123456789abc',
                    country: 'Russia',
                    city: 'Moscow',
                },
                value: 'some address',
                unrestricted_value: '',
            }

            const result = generateAddressKeyFromFiasId(normalizedBuilding)

            expect(result).toBe('fias:12345678-1234-1234-1234-123456789abc')
        })

        it('should return null when house_fias_id is not present', () => {
            const normalizedBuilding = {
                data: {
                    country: 'Russia',
                    city: 'Moscow',
                },
                value: 'some address',
                unrestricted_value: '',
            }

            const result = generateAddressKeyFromFiasId(normalizedBuilding)

            expect(result).toBeNull()
        })

        it('should return null when house_fias_id is empty string', () => {
            const normalizedBuilding = {
                data: {
                    house_fias_id: '',
                    country: 'Russia',
                    city: 'Moscow',
                },
                value: 'some address',
                unrestricted_value: '',
            }

            const result = generateAddressKeyFromFiasId(normalizedBuilding)

            expect(result).toBeNull()
        })

        it('should return null when house_fias_id is null', () => {
            const normalizedBuilding = {
                data: {
                    house_fias_id: null,
                    country: 'Russia',
                    city: 'Moscow',
                },
                value: 'some address',
                unrestricted_value: '',
            }

            const result = generateAddressKeyFromFiasId(normalizedBuilding)

            expect(result).toBeNull()
        })
    })

    describe('generateAddressKey with FIAS providers', () => {
        describe('should use FIAS key when house_fias_id is present', () => {
            test.each(FIAS_PROVIDERS)('for %s provider', (providerName) => {
                const normalizedBuilding = {
                    data: {
                        house_fias_id: 'abc-123-def-456',
                        country: 'Russia',
                        city: 'Moscow',
                        street: 'Tverskaya',
                        house: '1',
                    },
                    provider: {
                        name: providerName,
                    },
                    value: 'some address',
                    unrestricted_value: '',
                }

                const result = generateAddressKey(normalizedBuilding)

                expect(result).toBe('fias:abc-123-def-456')
            })
        })

        describe('should fallback to standard key generation when house_fias_id is missing', () => {
            test.each(FIAS_PROVIDERS)('for %s provider', (providerName) => {
                const normalizedBuilding = {
                    data: {
                        country: 'Russia',
                        city: 'Moscow',
                        street: 'Tverskaya',
                        house: '1',
                    },
                    provider: {
                        name: providerName,
                    },
                    value: 'some address',
                    unrestricted_value: '',
                }

                const result = generateAddressKey(normalizedBuilding)

                expect(result).toBe('russia~moscow~tverskaya~1')
            })
        })

        it('should use standard key generation for non-FIAS providers', () => {
            const normalizedBuilding = {
                data: {
                    country: 'USA',
                    city: 'New York',
                    street: 'Broadway',
                    house: '42',
                },
                provider: {
                    name: GOOGLE_PROVIDER,
                },
                value: 'some address',
                unrestricted_value: '',
            }

            const result = generateAddressKey(normalizedBuilding)

            expect(result).toBe('usa~new_york~broadway~42')
        })

        it('should use standard key generation when provider is not specified', () => {
            const normalizedBuilding = {
                data: {
                    country: 'Germany',
                    city: 'Berlin',
                    street: 'Unter den Linden',
                    house: '5',
                },
                value: 'some address',
                unrestricted_value: '',
            }

            const result = generateAddressKey(normalizedBuilding)

            expect(result).toBe('germany~berlin~unter_den_linden~5')
        })
    })
})
