const { find } = require('@open-condo/keystone/schema')

const { AddressHeuristic } = require('@address-service/domains/address/utils/serverSchema')
const { AddressIdentityConflict, createOrUpdateAddressWithSource } = require('@address-service/domains/common/utils/services/search/searchServiceUtils')

jest.mock('@open-condo/keystone/schema', () => ({ find: jest.fn() }))
jest.mock('@address-service/domains/address/utils/serverSchema', () => ({ AddressHeuristic: { create: jest.fn() } }))

const GUID = 'a06eb7a2-18e4-4d0d-8193-6c1cddcc1274'
const SAVED = { id: 'f231be1b-6920-4c62-904f-6de216a3975b', meta: { data: { house_fias_id: GUID } } }
const SOURCE = 'г тула, ул ленина, д 12'
const HEURISTIC = { type: 'fias_id', value: GUID, reliability: 95 }

describe('bulk normalization persistence', () => {
    const context = {}
    let address, addressSource, findByGuid

    function persist () {
        const data = { key: `fias_id:${GUID}`, meta: { provider: { name: 'dadata' } } }
        return createOrUpdateAddressWithSource(
            context, address, addressSource, data, null, { dv: 1, sender: { dv: 1 } }, [HEURISTIC],
            { strictFias: { guid: GUID, findByGuid, getStoredGuid: model => model.meta.data.house_fias_id, sources: [SOURCE] } },
        )
    }

    beforeEach(() => {
        jest.resetAllMocks()
        address = { create: jest.fn().mockResolvedValue(SAVED) }
        addressSource = { create: jest.fn(), update: jest.fn() }
        findByGuid = jest.fn().mockResolvedValue([SAVED])
        find.mockResolvedValue([])
        AddressHeuristic.create.mockResolvedValue({})
    })

    test('reuses a concurrent Address and resumes alias creation', async () => {
        findByGuid.mockResolvedValueOnce([])
        address.create.mockRejectedValueOnce(new Error('duplicate Address key'))
        const result = await persist()
        expect(result).toBe(SAVED)
        expect(AddressHeuristic.create).toHaveBeenCalledTimes(1)
        expect(addressSource.create).toHaveBeenCalledWith(context, expect.objectContaining({
            source: SOURCE,
            address: { connect: { id: SAVED.id } },
        }))
    })

    test('leaves an alias bound to its existing house', async () => {
        find.mockImplementation((schema) => Promise.resolve(schema === 'AddressSource' ? [{ address: 'other' }] : []))
        await expect(persist()).rejects.toBeInstanceOf(AddressIdentityConflict)
        expect(addressSource.create).not.toHaveBeenCalled()
        expect(addressSource.update).not.toHaveBeenCalled()
    })

    test('rejects competing existing identities before making any write', async () => {
        findByGuid.mockResolvedValue([SAVED, { ...SAVED, id: 'other' }])
        await expect(persist()).rejects.toBeInstanceOf(AddressIdentityConflict)
        expect(address.create).not.toHaveBeenCalled()
        expect(AddressHeuristic.create).not.toHaveBeenCalled()
        expect(addressSource.create).not.toHaveBeenCalled()
    })
})
