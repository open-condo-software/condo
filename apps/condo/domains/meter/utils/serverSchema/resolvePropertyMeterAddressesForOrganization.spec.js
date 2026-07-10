jest.mock('@open-condo/keystone/schema', () => ({
    find: jest.fn(),
}))

const { find } = require('@open-condo/keystone/schema')

const { NO_PROPERTY_IN_ORGANIZATION } = require('@condo/domains/billing/constants/registerBillingReceiptService')

const { resolvePropertyMeterAddressesForOrganization } = require('./resolvePropertyMeterAddressesForOrganization')

describe('resolvePropertyMeterAddressesForOrganization', () => {
    afterEach(() => {
        jest.clearAllMocks()
    })

    test('normalizes raw import addresses directly and matches organization property by addressKey', async () => {
        const address = 'г Иваново, мкр Московский, д 14А к 1'
        const addressService = {
            bulkSearch: jest.fn().mockResolvedValue({
                map: {
                    [address]: {
                        data: {
                            addressKey: 'address-key-1',
                        },
                    },
                },
                addresses: {
                    'address-key-1': {
                        address,
                    },
                },
            }),
        }
        find.mockResolvedValue([
            { id: 'property-1', address, addressKey: 'address-key-1' },
        ])

        const result = await resolvePropertyMeterAddressesForOrganization({
            organizationId: 'organization-1',
            tin: '1234567890',
            readings: [{ address }],
            addressService,
        })

        expect(addressService.bulkSearch).toHaveBeenCalledWith({
            items: [address],
            helpers: { tin: '1234567890' },
        })
        expect(find).toHaveBeenCalledWith('Property', {
            organization: { id: 'organization-1' },
            deletedAt: null,
            addressKey_in: ['address-key-1'],
        })
        expect(result.resolvedAddresses[address].addressResolve).toEqual({
            addresses: [address],
            properties: { 'address-key-1': address },
            propertyAddress: {
                address,
                addressKey: 'address-key-1',
            },
        })
    })

    test('returns organization mismatch problem when address is recognized but property does not belong to organization', async () => {
        const address = 'г Иваново, мкр Московский, д 14А к 1'
        const addressService = {
            bulkSearch: jest.fn().mockResolvedValue({
                map: {
                    [address]: {
                        data: {
                            addressKey: 'address-key-1',
                        },
                    },
                },
                addresses: {
                    'address-key-1': {
                        address,
                    },
                },
            }),
        }
        find.mockResolvedValue([])

        const result = await resolvePropertyMeterAddressesForOrganization({
            organizationId: 'organization-1',
            tin: '1234567890',
            readings: [{ address }],
            addressService,
        })

        expect(result.resolvedAddresses[address].addressResolve.propertyAddress).toEqual({
            address,
            addressKey: 'address-key-1',
            problem: NO_PROPERTY_IN_ORGANIZATION,
        })
    })
})
