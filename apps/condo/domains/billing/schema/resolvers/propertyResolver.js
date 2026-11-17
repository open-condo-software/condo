const { createInstance } = require('@open-condo/clients/address-service-client')
const { AddressFromStringParser } = require('@open-condo/clients/address-service-client/utils/parseAddressesFromString')
const { itemsQuery } = require('@open-condo/keystone/schema')

const {
    ERRORS,
    NO_PROPERTY_IN_ORGANIZATION,
    ADDRESS_SERVICE_NORMALIZE_CHUNK_SIZE,
} = require('@condo/domains/billing/constants/registerBillingReceiptService')
const {
    chunkArray,
    createStageContext,
    forEachSequential,
    isObjectEmpty,
} = require('@condo/domains/billing/schema/resolvers/resolver')
const { isValidFias, normalizePropertyGlobalId } = require('@condo/domains/billing/schema/resolvers/utils')
const { BillingProperty } = require('@condo/domains/billing/utils/serverSchema')
const { UUID_REGEXP } = require('@condo/domains/common/constants/regexps')
const { FLAT_UNIT_TYPE: DEFAULT_UNIT_TYPE, UNIT_TYPES } = require('@condo/domains/property/constants/common')

function getAddressFromReceipt (receipt, { parser }) {
    let {
        address: addressInput,
        addressMeta: {
            globalId = '',
            unitName: unitNameFromMeta,
            unitType: unitTypeFromMeta,
        } = {},
    } = receipt
    const unitNameInput = unitNameFromMeta || ''
    const unitTypeInput = unitTypeFromMeta || ''
    const addresses = []
    const unitNames = [unitNameInput]
    let unitTypes = []

    if (unitTypeInput) {
        if (UNIT_TYPES.includes(unitTypeInput)) {
            unitTypes.push(unitTypeInput)
        } else {
            const { unitType: parsedUnitType } = parser.parseUnit(`${unitTypeInput} ${unitNameInput}`)
            unitTypes.push(parsedUnitType)
        }
    }
    if (isValidFias(addressInput)) {
        globalId = addressInput
        addressInput = ''
    }
    if (globalId && isValidFias(globalId)) {
        if (globalId.includes(',')) {
            const { unitName, unitType, address } = parser.parse(globalId)
            if (!unitNameInput) unitNames.push(unitName)
            if (!unitTypeInput) unitTypes.push(unitType)
            addresses.push(`fiasId:${address.toLowerCase()}`)
        } else {
            addresses.push(`fiasId:${globalId.toLowerCase()}`)
        }
    }
    if (addressInput) {
        if (unitNameInput && unitTypeInput) {
            addresses.push(addressInput)
        } else {
            const { unitName, unitType, address } = parser.parse(addressInput)
            if (!unitNameInput) unitNames.push(unitName)
            if (!unitTypeInput) unitTypes.push(unitType)
            addresses.push(address)
        }
    }
    if (unitTypes.length > 1) {
        const specificUnitType = unitTypes.find(unitType => unitType !== DEFAULT_UNIT_TYPE)
        if (specificUnitType) unitTypes = [specificUnitType]
    }
    return {
        addresses: addresses.filter(Boolean),
        unitName: unitNames.find(Boolean) || '',
        unitType: unitTypes.find(Boolean) || '',
    }
}

async function normalizeChunk (properties, { addressService, tin }) {
    const result = await addressService.bulkSearch({ items: properties, helpers: { tin } })
    const normalizedAddresses = Object.fromEntries(properties.map(address => ([address, {
        address: ERRORS.ADDRESS_NOT_RECOGNIZED_VALUE,
        addressKey: null,
    }])))
    for (const address of Object.keys(result.map)) {
        try {
            const { data: { addressKey } } = result.map[address]
            normalizedAddresses[address] = {
                address: result.addresses[addressKey].address,
                addressKey,
            }
        } catch {
            normalizedAddresses[address] = {
                address: ERRORS.ADDRESS_NOT_RECOGNIZED_VALUE,
                addressKey: null,
            }
        }
    }
    return normalizedAddresses
}

async function loadOrganizationAddressKeys (receiptIndex, organizationId) {
    if (!organizationId) return new Set()
    const addressKeys = [...new Set(Object.values(receiptIndex).flatMap(receipt => (
        Object.keys(receipt.addressResolve.properties)
    )))]
    if (!addressKeys.length) return new Set()

    const properties = await itemsQuery('Property', {
        where: {
            addressKey_in: addressKeys,
            organization: { id: organizationId },
            deletedAt: null,
        },
    })
    return new Set(properties.map(({ addressKey }) => addressKey))
}

function choosePropertyAddress (propertiesIndex, organizationAddressKeys) {
    const properties = Object.entries(propertiesIndex).map(([addressKey, address]) => ({ addressKey, address }))
    if (!properties.length) return { error: ERRORS.ADDRESS_NOT_RECOGNIZED_VALUE }

    const organizationProperty = properties.find(({ addressKey }) => organizationAddressKeys.has(addressKey))
    return organizationProperty || { ...properties[0], problem: NO_PROPERTY_IN_ORGANIZATION }
}

async function normalizeAddresses (receiptIndex, runtime) {
    const toNormalize = new Set()
    for (const [index, receipt] of Object.entries(receiptIndex)) {
        const { addresses, unitName, unitType } = getAddressFromReceipt(receipt, runtime)
        receiptIndex[index].addressResolve = { unitName, unitType, addresses }
        addresses.forEach(address => toNormalize.add(address))
    }

    let normalizeResult = {}
    await forEachSequential(chunkArray([...toNormalize], ADDRESS_SERVICE_NORMALIZE_CHUNK_SIZE), async addressChunk => {
        normalizeResult = {
            ...normalizeResult,
            ...await normalizeChunk(addressChunk, runtime),
        }
    })
    for (const receipt of Object.values(receiptIndex)) {
        const properties = {}
        for (const address of receipt.addressResolve.addresses) {
            const { address: normalizedAddress, addressKey } = normalizeResult[address]
            if (addressKey) properties[addressKey] = normalizedAddress
        }
        receipt.addressResolve.properties = properties
    }

    const organizationAddressKeys = await loadOrganizationAddressKeys(receiptIndex, runtime.organizationId)
    for (const receipt of Object.values(receiptIndex)) {
        receipt.addressResolve.propertyAddress = choosePropertyAddress(
            receipt.addressResolve.properties,
            organizationAddressKeys,
        )
    }
}

function addressFieldValue (address, addressKey) {
    return UUID_REGEXP.test(addressKey) ? `key:${addressKey}` : address
}

async function resolveProperties (receiptIndex, { billingContext, context }) {
    const stage = createStageContext({ name: 'property', context })
    const runtime = {
        addressService: createInstance(),
        organizationId: billingContext.organization?.id,
        parser: new AddressFromStringParser(),
        tin: billingContext.organization?.tin,
    }
    await normalizeAddresses(receiptIndex, runtime)

    const addressKeys = [...new Set(Object.values(receiptIndex)
        .map(receipt => receipt.addressResolve.propertyAddress.addressKey)
        .filter(Boolean))]
    const existingProperties = addressKeys.length ? await itemsQuery('BillingProperty', {
        where: {
            addressKey_in: addressKeys,
            context: { id: billingContext.id },
            deletedAt: null,
        },
        sortBy: ['createdAt_ASC', 'id_ASC'],
    }) : []
    const propertiesByAddressKey = new Map()
    for (const property of existingProperties) {
        if (!propertiesByAddressKey.has(property.addressKey)) {
            propertiesByAddressKey.set(property.addressKey, property)
        }
    }

    const updated = new Set()
    await forEachSequential(Object.entries(receiptIndex), async ([index, receipt]) => {
        const { propertyAddress, addresses } = receipt.addressResolve
        const { addressKey, address, error, problem } = propertyAddress
        if (error) {
            receiptIndex[index].error = stage.error(error, index, null, { address: receipt.address })
            return
        }
        if (problem) {
            receiptIndex[index].problems.push({ problem, params: { addresses } })
        }

        const propertyGlobalId = normalizePropertyGlobalId(receipt.addressMeta?.globalId || '')
        const existingProperty = propertiesByAddressKey.get(addressKey)
        if (existingProperty) {
            receiptIndex[index].property = existingProperty.id
            if (updated.has(existingProperty.id)) return

            const updateInput = stage.buildUpdateInput({ globalId: propertyGlobalId }, existingProperty)
            let isSaved = true
            if (isObjectEmpty(updateInput)) {
                stage.markUntouched()
            } else {
                try {
                    // Duplicate addresses must observe the first update in this batch.
                    await BillingProperty.update(context, existingProperty.id, updateInput)
                    stage.markUpdated()
                } catch (originalError) {
                    isSaved = false
                    receiptIndex[index].error = stage.error(ERRORS.PROPERTY_SAVE_FAILED, index, originalError, { address: receipt.address })
                }
            }
            if (isSaved) updated.add(existingProperty.id)
            return
        }

        try {
            // Cache the created property before processing another receipt with the same address.
            const newProperty = await BillingProperty.create(context, stage.buildCreateInput({
                context: billingContext.id,
                address: addressFieldValue(address, addressKey),
                globalId: propertyGlobalId,
            }, ['context']))
            stage.markCreated()
            receiptIndex[index].property = newProperty.id
            propertiesByAddressKey.set(addressKey, newProperty)
            updated.add(newProperty.id)
        } catch (originalError) {
            receiptIndex[index].error = stage.error(ERRORS.PROPERTY_SAVE_FAILED, index, originalError, { address: receipt.address })
        }
    })
    return stage.result(receiptIndex)
}

module.exports = {
    getAddressFromReceipt,
    resolveProperties,
}
