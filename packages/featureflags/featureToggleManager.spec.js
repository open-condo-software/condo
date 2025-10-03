/**
 * @jest-environment node
 */
jest.mock('@open-condo/keystone/fetch', () => ({ fetch: jest.fn() }))
jest.mock('@open-condo/keystone/kv', () => ({ getKVClient: jest.fn() }))

const { fetch } = require('@open-condo/keystone/fetch')
const { getKVClient } = require('@open-condo/keystone/kv')

const { _FeatureToggleManagerClass } = require('./featureToggleManager')


const KV_FEATURES_KEY = 'features'
const KV_FEATURES_UPDATE_KEY = 'features-update'
const KV_FEATURES_RECENTLY_ERROR_FLAG_KEY = 'features-recently-error'
const FEATURES_RECENTLY_ERROR_FLAG_EXPIRE_IN_SECONDS = 60 * 30
const FEATURES_EXPIRED_IN_SECONDS = 60 * 5

describe('FeatureToggleManager', () => {
    let kvStorageMock
    let featureToggleManager

    beforeEach(() => {
        jest.clearAllMocks()

        kvStorageMock = { get: jest.fn(), set: jest.fn() }
        getKVClient.mockReturnValue(kvStorageMock)

        featureToggleManager = new _FeatureToggleManagerClass()
        featureToggleManager._kvStorage = kvStorageMock
        featureToggleManager._url = 'http://fake-url'
        featureToggleManager._static = null
    })

    test('should fetch features and save to kv', async () => {
        const mockFeatures = { feature: { defaultValue: true } }
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ features: mockFeatures }),
        })

        const result = await featureToggleManager.fetchFeatures()

        expect(result).toEqual(mockFeatures)
        expect(kvStorageMock.set).toHaveBeenCalledWith(KV_FEATURES_KEY, JSON.stringify(mockFeatures))
        expect(kvStorageMock.set).toHaveBeenCalledWith(KV_FEATURES_UPDATE_KEY, 'true', 'EX', FEATURES_EXPIRED_IN_SECONDS)
    })

    test('should fallback to cache if fetch throws error', async () => {
        kvStorageMock.get.mockImplementation((key) => {
            if (key === KV_FEATURES_KEY) return JSON.stringify({ cached: { defaultValue: false } })
            return null
        })
        
        fetch.mockRejectedValue(new Error('timeout'))

        const result = await featureToggleManager.fetchFeatures()

        expect(result).toEqual({ cached: { defaultValue: false } })
        expect(kvStorageMock.set).toHaveBeenCalledWith(KV_FEATURES_RECENTLY_ERROR_FLAG_KEY, 'true', 'EX', FEATURES_RECENTLY_ERROR_FLAG_EXPIRE_IN_SECONDS)
    })

    test('should return static config if set', async () => {
        featureToggleManager._url = null
        featureToggleManager._static = { bar: { defaultValue: 123 } }

        const result = await featureToggleManager.fetchFeatures()
        expect(result).toEqual({ bar: { defaultValue: 123 } })
    })

    test('should return cache if features-update flag is set', async () => {
        kvStorageMock.get.mockImplementation((key) => {
            if (key === KV_FEATURES_UPDATE_KEY) return 'true'
            if (key === KV_FEATURES_KEY) return JSON.stringify({ cached: { defaultValue: true } })
            return null
        })

        const result = await featureToggleManager.fetchFeatures()

        expect(result).toEqual({ cached: { defaultValue: true } })
        expect(fetch).not.toHaveBeenCalled()
    })

    test('should return {} if cache contains broken JSON', async () => {
        kvStorageMock.get.mockImplementation((key) => {
            if (key === KV_FEATURES_KEY) return 'broken-json'
            return null
        })

        const result = await featureToggleManager._getFeaturesFromCache()
        expect(result).toEqual({})
    })

    test('should fallback to cache if fetch returns http error', async () => {
        kvStorageMock.get.mockImplementation((key) => {
            if (key === KV_FEATURES_KEY) return JSON.stringify({ cached: { defaultValue: false } })
            return null
        })
    
        fetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            json: async () => ({}), 
        })
    
        const result = await featureToggleManager.fetchFeatures()
    
        expect(result).toEqual({ cached: { defaultValue: false } })
        expect(kvStorageMock.set).toHaveBeenCalledWith(
            KV_FEATURES_RECENTLY_ERROR_FLAG_KEY,
            'true',
            'EX',
            FEATURES_RECENTLY_ERROR_FLAG_EXPIRE_IN_SECONDS
        )
    })    
})
