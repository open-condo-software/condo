/**
 * @jest-environment node
 */
const { faker } = require('@faker-js/faker')

const { DADATA_PROVIDER, PULLENTI_PROVIDER } = require('@address-service/domains/common/constants/providers')
const { generateAddressKey } = require('@address-service/domains/common/utils/addressKeyUtils')
const { getSearchProvider } = require('@address-service/domains/common/utils/services/providerDetectors')
const { createOrUpdateAddressWithSource } = require('@address-service/domains/common/utils/services/search/searchServiceUtils')

const { SearchByFiasId } = require('./SearchByFiasId')

// Mock the dependencies
jest.mock('@address-service/domains/common/utils/addressKeyUtils')
jest.mock('@address-service/domains/common/utils/services/providerDetectors', () => {
    const original = jest.requireActual('@address-service/domains/common/utils/services/providerDetectors')
    return {
        getSearchProvider: jest.fn().mockImplementation((args) => {
            return original.getSearchProvider(args)
        }),
    }
})
jest.mock('@address-service/domains/common/utils/services/search/searchServiceUtils')

describe('SearchByFiasId', () => {
    let searchPlugin
    
    // Create a consistent mock sudo context object
    const mockSudoContext = {
        query: {
            Address: {
                findOne: jest.fn(),
            },
            AddressSource: {
                findOne: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
            },
        },
    }
    
    const mockKeystoneContext = {
        sudo: jest.fn().mockReturnValue(mockSudoContext),
        query: {
            Address: {
                create: jest.fn(),
                update: jest.fn(),
            },
            AddressSource: {
                create: jest.fn(),
                update: jest.fn(),
            },
        },
    }

    const mockReq = {
        headers: {},
        query: { provider: DADATA_PROVIDER },
    }

    const mockDvSender = { dv: 1, sender: { dv: 1, fingerprint: 'test' } }

    beforeEach(() => {
        jest.clearAllMocks()

        // Setup search plugin
        searchPlugin = new SearchByFiasId()
        searchPlugin.getDvAndSender = jest.fn().mockReturnValue(mockDvSender)
        searchPlugin.prepare({
            keystoneContext: mockKeystoneContext,
            req: mockReq,
            helpers: {},
        })
    })

    describe('isEnabled()', () => {
        it('should be enabled for valid FIAS ID search with supported provider', () => {
            expect(searchPlugin.isEnabled('fiasId:123e4567-e89b-12d3-a456-426614174000', { req: { query: { provider: DADATA_PROVIDER } } })).toBe(true)
            expect(searchPlugin.isEnabled('fiasId:123e4567-e89b-12d3-a456-426614174000', { req: { query: { provider: PULLENTI_PROVIDER } } })).toBe(true)
        })

        it('should be disabled for invalid FIAS ID format', () => {
            expect(searchPlugin.isEnabled('fiasId:invalid-uuid', { req: { query: { provider: DADATA_PROVIDER } } })).toBe(false)
            expect(searchPlugin.isEnabled('not-fiasId:123e4567-e89b-12d3-a456-426614174000', { req: { query: { provider: DADATA_PROVIDER } } })).toBe(false)
            expect(searchPlugin.isEnabled('123e4567-e89b-12d3-a456-426614174000', { req: { query: { provider: DADATA_PROVIDER } } })).toBe(false)
        })

        it('should be disabled for unsupported provider', () => {
            expect(searchPlugin.isEnabled('fiasId:123e4567-e89b-12d3-a456-426614174000', { req: { query: { provider: 'unsupported' } } })).toBe(false)
        })
    })

    describe('search()', () => {
        const validFiasId = '123e4567-e89b-12d3-a456-426614174000'
        const searchString = `fiasId:${validFiasId}`

        let mockSearchProvider
        let mockCreateOrUpdateAddressWithSource
        let mockGetSearchProvider
        let mockGenerateAddressKey

        beforeEach(() => {
            // Mock search provider
            mockSearchProvider = {
                getProviderName: jest.fn(),
                getAddressByFiasId: jest.fn(),
                normalize: jest.fn(),
            }

            // Mock utility functions
            mockCreateOrUpdateAddressWithSource = jest.fn()
            mockGetSearchProvider = jest.fn().mockReturnValue(mockSearchProvider)
            mockGenerateAddressKey = jest.fn()

            // Setup the mocked functions
            getSearchProvider.mockImplementation(mockGetSearchProvider)
            generateAddressKey.mockImplementation(mockGenerateAddressKey)
            createOrUpdateAddressWithSource.mockImplementation(mockCreateOrUpdateAddressWithSource)
        })

        afterEach(() => {
            jest.clearAllMocks()
        })

        it('should successfully search and return address for valid house FIAS ID', async () => {
            // Mock data
            const mockRawData = {
                value: 'г Москва, ул Тверская, д 1',
                unrestricted_value: 'г Москва, ул Тверская, д 1',
                data: {
                    house_fias_id: validFiasId,
                    region: 'Москва',
                    city: 'Москва',
                    street: 'Тверская',
                    house: '1',
                },
            }

            const mockNormalizedResult = {
                value: 'г Москва, ул Тверская, д 1',
                unrestricted_value: 'г Москва, ул Тверская, д 1',
                data: {
                    house_fias_id: validFiasId,
                    region: 'Москва',
                    city: 'Москва',
                    street: 'Тверская',
                    house: '1',
                },
            }

            const mockAddressKey = 'moscow-tverskaya-1'
            const mockCreatedAddress = {
                id: 'address-123',
                address: 'г Москва, ул Тверская, д 1',
                key: mockAddressKey,
            }

            // Setup mocks
            mockSearchProvider.getProviderName.mockReturnValue(DADATA_PROVIDER)
            mockSearchProvider.getAddressByFiasId.mockResolvedValue(mockRawData)
            mockSearchProvider.normalize.mockReturnValue([mockNormalizedResult])
            mockGenerateAddressKey.mockReturnValue(mockAddressKey)
            // mockCreateOrUpdateAddressWithSource.mockResolvedValue(mockCreatedAddress)
            mockCreateOrUpdateAddressWithSource.mockImplementationOnce((...args) => {
                return mockCreatedAddress
            })

            // Execute
            const result = await searchPlugin.search(searchString)

            // Verify
            expect(mockGetSearchProvider).toHaveBeenCalledWith({ req: mockReq })
            expect(mockSearchProvider.getAddressByFiasId).toHaveBeenCalledWith(validFiasId)
            expect(mockSearchProvider.normalize).toHaveBeenCalledWith([mockRawData])
            expect(mockGenerateAddressKey).toHaveBeenCalledWith(mockNormalizedResult)
            expect(mockCreateOrUpdateAddressWithSource).toHaveBeenCalledWith(
                mockSudoContext,
                expect.anything(), // Address
                expect.anything(), // AddressSource
                {
                    address: mockNormalizedResult.value,
                    key: mockAddressKey,
                    meta: {
                        provider: {
                            name: DADATA_PROVIDER,
                            rawData: mockRawData,
                        },
                        value: mockNormalizedResult.value,
                        unrestricted_value: mockNormalizedResult.unrestricted_value,
                        data: mockNormalizedResult.data,
                    },
                },
                searchString,
                mockDvSender,
            )
            expect(result).toEqual(mockCreatedAddress)
        })

        it('should return null when provider returns no normalized result', async () => {
            // Mock data
            const mockRawData = null

            // Setup mocks
            mockSearchProvider.getProviderName.mockReturnValue(DADATA_PROVIDER)
            mockSearchProvider.getAddressByFiasId.mockResolvedValue(mockRawData)
            mockSearchProvider.normalize.mockReturnValue([null])

            // Execute
            const result = await searchPlugin.search(searchString)

            // Verify
            expect(mockSearchProvider.getAddressByFiasId).toHaveBeenCalledWith(validFiasId)
            expect(mockSearchProvider.normalize).toHaveBeenCalledWith([mockRawData])
            expect(mockCreateOrUpdateAddressWithSource).not.toHaveBeenCalled()
            expect(result).toBeNull()
        })

        it('should return null when house_fias_id does not match searched FIAS ID', async () => {
            // Mock data with different house_fias_id
            const differentFiasId = '987e6543-e21b-43d2-b654-321987654321'
            const mockRawData = {
                value: 'г Москва, ул Арбат, д 2',
                data: {
                    house_fias_id: differentFiasId,
                },
            }

            const mockNormalizedResult = {
                value: 'г Москва, ул Арбат, д 2',
                data: {
                    house_fias_id: differentFiasId,
                },
            }

            // Setup mocks
            mockSearchProvider.getProviderName.mockReturnValue(DADATA_PROVIDER)
            mockSearchProvider.getAddressByFiasId.mockResolvedValue(mockRawData)
            mockSearchProvider.normalize.mockReturnValue([mockNormalizedResult])

            // Execute
            const result = await searchPlugin.search(searchString)

            // Verify
            expect(mockSearchProvider.getAddressByFiasId).toHaveBeenCalledWith(validFiasId)
            expect(mockSearchProvider.normalize).toHaveBeenCalledWith([mockRawData])
            expect(mockCreateOrUpdateAddressWithSource).not.toHaveBeenCalled()
            expect(result).toBeNull()
        })

        it('should handle search with PULLENTI provider', async () => {
            // Mock data
            const mockRawData = {
                value: 'г Санкт-Петербург, ул Невский проспект, д 10',
                unrestricted_value: 'г Санкт-Петербург, ул Невский проспект, д 10',
                data: {
                    house_fias_id: validFiasId,
                    region: 'Санкт-Петербург',
                    city: 'Санкт-Петербург',
                    street: 'Невский проспект',
                    house: '10',
                },
            }

            const mockNormalizedResult = {
                value: 'г Санкт-Петербург, ул Невский проспект, д 10',
                unrestricted_value: 'г Санкт-Петербург, ул Невский проспект, д 10',
                data: {
                    house_fias_id: validFiasId,
                    region: 'Санкт-Петербург',
                    city: 'Санкт-Петербург',
                    street: 'Невский проспект',
                    house: '10',
                },
            }

            const mockAddressKey = faker.datatype.uuid()
            const mockCreatedAddress = {
                id: 'address-456',
                address: 'г Санкт-Петербург, ул Невский проспект, д 10',
                key: mockAddressKey,
            }

            // Setup mocks for PULLENTI provider
            mockSearchProvider.getProviderName.mockReturnValue(PULLENTI_PROVIDER)
            mockSearchProvider.getAddressByFiasId.mockResolvedValue(mockRawData)
            mockSearchProvider.normalize.mockReturnValue([mockNormalizedResult])
            mockGenerateAddressKey.mockReturnValue(mockAddressKey)
            mockCreateOrUpdateAddressWithSource.mockResolvedValue(mockCreatedAddress)

            // Execute
            const result = await searchPlugin.search(searchString)

            // Verify
            expect(mockSearchProvider.getProviderName).toHaveBeenCalled()
            expect(mockSearchProvider.getAddressByFiasId).toHaveBeenCalledWith(validFiasId)
            expect(mockSearchProvider.normalize).toHaveBeenCalledWith([mockRawData])
            expect(mockGenerateAddressKey).toHaveBeenCalledWith(mockNormalizedResult)
            expect(mockCreateOrUpdateAddressWithSource).toHaveBeenCalledWith(
                mockSudoContext,
                expect.anything(),
                expect.anything(),
                {
                    address: mockNormalizedResult.value,
                    key: mockAddressKey,
                    meta: {
                        provider: {
                            name: PULLENTI_PROVIDER,
                            rawData: mockRawData,
                        },
                        value: mockNormalizedResult.value,
                        unrestricted_value: mockNormalizedResult.unrestricted_value,
                        data: mockNormalizedResult.data,
                    },
                },
                searchString,
                mockDvSender,
            )
            expect(result).toEqual(mockCreatedAddress)
        })

        it('should handle empty normalized data gracefully', async () => {
            // Mock data with minimal structure
            const mockRawData = {
                value: 'г Екатеринбург, ул Ленина, д 5',
                data: {
                    house_fias_id: validFiasId,
                },
            }

            const mockNormalizedResult = {
                value: 'г Екатеринбург, ул Ленина, д 5',
                data: {
                    house_fias_id: validFiasId,
                },
            }

            const mockAddressKey = 'ekb-lenina-5'
            const mockCreatedAddress = {
                id: 'address-789',
                address: 'г Екатеринбург, ул Ленина, д 5',
                key: mockAddressKey,
            }

            // Setup mocks
            mockSearchProvider.getProviderName.mockReturnValue(DADATA_PROVIDER)
            mockSearchProvider.getAddressByFiasId.mockResolvedValue(mockRawData)
            mockSearchProvider.normalize.mockReturnValue([mockNormalizedResult])
            mockGenerateAddressKey.mockReturnValue(mockAddressKey)
            mockCreateOrUpdateAddressWithSource.mockResolvedValue(mockCreatedAddress)

            // Execute
            const result = await searchPlugin.search(searchString)

            // Verify that it handles missing unrestricted_value gracefully
            expect(mockCreateOrUpdateAddressWithSource).toHaveBeenCalledWith(
                mockSudoContext,
                expect.anything(),
                expect.anything(),
                {
                    address: mockNormalizedResult.value,
                    key: mockAddressKey,
                    meta: {
                        provider: {
                            name: DADATA_PROVIDER,
                            rawData: mockRawData,
                        },
                        value: mockNormalizedResult.value,
                        unrestricted_value: undefined,
                        data: mockNormalizedResult.data,
                    },
                },
                searchString,
                mockDvSender,
            )
            expect(result).toEqual(mockCreatedAddress)
        })

        it('should handle provider error gracefully', async () => {
            // Setup mocks to throw error
            mockSearchProvider.getProviderName.mockReturnValue(DADATA_PROVIDER)
            mockSearchProvider.getAddressByFiasId.mockRejectedValue(new Error('Provider API error'))

            // Execute and expect error to be thrown
            await expect(searchPlugin.search(searchString)).rejects.toThrow('Provider API error')

            // Verify that normalize and createOrUpdateAddressWithSource were not called
            expect(mockSearchProvider.normalize).not.toHaveBeenCalled()
            expect(mockCreateOrUpdateAddressWithSource).not.toHaveBeenCalled()
        })
    })
})
