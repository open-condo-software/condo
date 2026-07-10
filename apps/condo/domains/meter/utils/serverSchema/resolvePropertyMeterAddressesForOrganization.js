const chunk = require('lodash/chunk')
const get = require('lodash/get')

const { createInstance } = require('@open-condo/clients/address-service-client')
const { find } = require('@open-condo/keystone/schema')

const {
    ADDRESS_SERVICE_NORMALIZE_CHUNK_SIZE,
    ERRORS,
    NO_PROPERTY_IN_ORGANIZATION,
} = require('@condo/domains/billing/constants/registerBillingReceiptService')

async function normalizeAddresses (addresses, tin, addressService) {
    const normalizedAddresses = {}
    const helpers = tin ? { tin } : undefined
    const addressChunks = chunk(addresses, ADDRESS_SERVICE_NORMALIZE_CHUNK_SIZE)

    for (const addressChunk of addressChunks) {
        const result = await addressService.bulkSearch({
            items: addressChunk,
            helpers,
        })

        for (const address of addressChunk) {
            const addressKey = get(result, ['map', address, 'data', 'addressKey'])
            const normalizedAddress = get(result, ['addresses', addressKey, 'address'])

            if (addressKey && normalizedAddress) {
                normalizedAddresses[address] = {
                    address: normalizedAddress,
                    addressKey,
                }
            } else {
                normalizedAddresses[address] = {
                    address: ERRORS.ADDRESS_NOT_RECOGNIZED_VALUE,
                    addressKey: null,
                }
            }
        }
    }

    return normalizedAddresses
}

async function resolvePropertyMeterAddressesForOrganization ({
    organizationId,
    tin,
    readings,
    addressService = createInstance(),
}) {
    const uniqueAddresses = [...new Set(readings.map(({ address }) => address).filter(Boolean))]
    const normalizedAddresses = await normalizeAddresses(uniqueAddresses, tin, addressService)
    const addressKeys = [...new Set(
        Object.values(normalizedAddresses)
            .map(({ addressKey }) => addressKey)
            .filter(Boolean)
    )]

    const properties = addressKeys.length > 0
        ? await find('Property', {
            organization: { id: organizationId },
            deletedAt: null,
            addressKey_in: addressKeys,
        })
        : []

    const organizationPropertyAddressKeys = new Set(properties.map(({ addressKey }) => addressKey))

    const resolvedAddresses = readings.reduce((index, reading) => {
        const normalizedAddress = normalizedAddresses[reading.address]
        const propertyAddress = !normalizedAddress || !normalizedAddress.addressKey
            ? { error: ERRORS.ADDRESS_NOT_RECOGNIZED_VALUE }
            : organizationPropertyAddressKeys.has(normalizedAddress.addressKey)
                ? {
                    address: normalizedAddress.address,
                    addressKey: normalizedAddress.addressKey,
                }
                : {
                    address: normalizedAddress.address,
                    addressKey: normalizedAddress.addressKey,
                    problem: NO_PROPERTY_IN_ORGANIZATION,
                }

        index[reading.address] = {
            address: reading.address,
            addressResolve: {
                addresses: [reading.address],
                properties: normalizedAddress && normalizedAddress.addressKey
                    ? { [normalizedAddress.addressKey]: normalizedAddress.address }
                    : {},
                propertyAddress,
            },
        }

        return index
    }, {})

    return {
        resolvedAddresses,
        properties,
    }
}

module.exports = {
    resolvePropertyMeterAddressesForOrganization,
}
