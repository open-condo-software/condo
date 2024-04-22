const { isEmpty, get, chunk } = require('lodash')

const { createInstance } = require('@open-condo/clients/address-service-client')
const { AddressFromStringParser } = require('@open-condo/clients/address-service-client/utils/parseAddressesFromString')
const { generateGqlQueries } = require('@open-condo/codegen/generate.gql')
const { generateServerUtils } = require('@open-condo/codegen/generate.server.utils')
const conf = require('@open-condo/config')
const { find } = require('@open-condo/keystone/schema')

const {
    ERRORS,
    NO_PROPERTY_IN_ORGANIZATION,
    ADDRESS_SERVICE_NORMALIZE_CHUNK_SIZE,
} = require('@condo/domains/billing/constants/registerBillingReceiptService')
const { Resolver } = require('@condo/domains/billing/schema/resolvers/resolver')
const { isValidFias, normalizePropertyGlobalId } = require('@condo/domains/billing/schema/resolvers/utils')
const { UUID_REGEXP } = require('@condo/domains/common/constants/regexps')
const { FLAT_UNIT_TYPE : DEFAULT_UNIT_TYPE, UNIT_TYPES } = require('@condo/domains/property/constants/common')

const BILLING_PROPERTY_FIELDS = '{ id importId globalId address addressKey }'
const BillingPropertyGQL = generateGqlQueries('BillingProperty', BILLING_PROPERTY_FIELDS)
const BillingPropertyApi = generateServerUtils(BillingPropertyGQL)


class PropertyResolver extends Resolver {

    constructor ({ billingContext, context }) {
        super(billingContext, context, { name: 'property' })
        this.organizationProperties = []
        this.properties = []
        this.transform = new AddressTransform()
        this.propertyFinder = new PropertyFinder()
        this.parser = new AddressFromStringParser()
        this.tin = get(billingContext, 'organization.tin')
        this.transform.init(get(billingContext, 'settings.addressTransform', {}))
        this.isCottageVillage = !!(get(billingContext, 'settings.isCottageVillage'))
        this.addressService = createInstance()
    }

    async init () {
        const organizationProperties = await find('Property', { organization: { id: get(this.billingContext, 'organization.id') }, deletedAt: null })
        this.organizationProperties = Object.fromEntries(organizationProperties.map(({ addressKey, address }) => ([addressKey, address])))
        this.properties = await find('BillingProperty', { context: { id: this.billingContext.id }, deletedAt: null })
        this.propertyFinder.init(organizationProperties)
    }

    getAddressFromReceipt (receipt) {
        let {
            address: addressInput,
            addressMeta: {
                globalId = '',
                unitName: unitNameFromMeta,
                unitType: unitTypeFromMeta,
            } = {},
        } = receipt
        if (this.isCottageVillage) {
            let { unitName: unitNameFromAddress, unitType: unitTypeFromAddress, address: houseFromAddress } = this.parser.parse(addressInput)
            return { addresses: [houseFromAddress], unitType: unitTypeFromAddress, unitName: unitNameFromAddress }
        }
        // support for deprecated params
        const unitNameInput = unitNameFromMeta || ''
        const unitTypeInput = unitTypeFromMeta || ''
        const addresses = []
        const unitNames = [unitNameInput]
        let unitTypes = []
        if (unitTypeInput) {
            if (UNIT_TYPES.includes(unitTypeInput)) {
                unitTypes.push(unitTypeInput)
            } else {
                const { unitType: parsedUnitType } = this.parser.parseUnit(`${unitTypeInput} ${unitNameInput}`)
                unitTypes.push(parsedUnitType)
            }
        }
        if (isValidFias(addressInput)) {
            globalId = addressInput
            addressInput = ''
        }
        if (globalId && isValidFias(globalId)) {
            const transformedGlobalId = this.transform.apply(globalId)
            if (transformedGlobalId.indexOf(',') !== -1) {
                const { unitName: unitNameFromFias, unitType: unitTypeFromFias, address: houseFromFias } = this.parser.parse(transformedGlobalId)
                unitNames.push(unitNameFromFias)
                unitTypes.push(unitTypeFromFias)
                addresses.push(`fiasId:${houseFromFias.toLowerCase()}`)
            } else {
                addresses.push(`fiasId:${transformedGlobalId.toLowerCase()}`)
            }
        }
        if (addressInput) {
            const transformedAddressInput = this.transform.apply(addressInput)
            if (unitNameInput && unitTypeInput) {
                addresses.push(transformedAddressInput)
            } else {
                let { unitName: unitNameFromAddress, unitType: unitTypeFromAddress, address: houseFromAddress } = this.parser.parse(transformedAddressInput)
                unitNames.push(unitNameFromAddress)
                unitTypes.push(unitTypeFromAddress)
                addresses.push(houseFromAddress)
            }
        }
        if (unitTypes.length > 1) {
            const specificUnitType = unitTypes.find(unitType => unitType !== DEFAULT_UNIT_TYPE)
            if (specificUnitType) {
                unitTypes = [specificUnitType]
            }
        }
        return { addresses, unitName: get(unitNames.filter(Boolean), '[0]', ''), unitType: get(unitTypes.filter(Boolean), '[0]', '') }
    }

    async normalizeChunk (properties) {
        const result = await this.addressService.bulkSearch({
            items: properties,
            helpers: { tin: this.tin },
        })
        const normalizedAddresses = {}
        for (const address of Object.keys(result.map)) {
            try {
                const { data: { addressKey } } = result.map[address]
                const { address: propertyAddress } = result['addresses'][addressKey]
                normalizedAddresses[address] = {
                    address: propertyAddress,
                    addressKey: addressKey,
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

    async normalizeAddresses (receiptIndex) {
        if (this.isCottageVillage) {
            return this.findMatchingAddressFromOrganization(receiptIndex)
        }
        const toNormalize = new Set()
        for (const [index, receipt] of Object.entries(receiptIndex)) {
            const { addresses, unitName, unitType } = this.getAddressFromReceipt(receipt)
            receiptIndex[index].addressResolve = { unitName, unitType, addresses }
            addresses.forEach(toNormalize.add, toNormalize)
        }
        let normalizeResult = {}
        const chunks = chunk([...toNormalize], ADDRESS_SERVICE_NORMALIZE_CHUNK_SIZE)
        for (const chunk of chunks) {
            const chunkResult = await this.normalizeChunk(chunk)
            normalizeResult = { ...normalizeResult, ...chunkResult }
        }
        for (const [index, receipt] of Object.entries(receiptIndex)) {
            receiptIndex[index].addressResolve.properties = {}
            const { addresses } = receipt.addressResolve
            for (const address of addresses) {
                const { address: normalizedAddress, addressKey } = normalizeResult[address]
                if (addressKey) {
                    receiptIndex[index].addressResolve.properties[addressKey] = normalizedAddress
                }
            }
            receiptIndex[index].addressResolve.propertyAddress = this.choosePropertyAddress(receipt.addressResolve.properties)
        }
        return receiptIndex
    }

    choosePropertyAddress (propertiesIndex) {
        const properties = Object.entries(propertiesIndex).map(([addressKey, address]) => ({ addressKey, address }))
        if (properties.length === 0) {
            return { error: ERRORS.ADDRESS_NOT_RECOGNIZED_VALUE }
        }
        const matchingToOrganizationProperty = properties.find(({ addressKey }) => Reflect.has(this.organizationProperties, addressKey ))
        if (matchingToOrganizationProperty) {
            return matchingToOrganizationProperty
        }
        return { ...get(properties, '[0]'), problem: NO_PROPERTY_IN_ORGANIZATION }
    }

    findMatchingAddressFromOrganization (receiptIndex) {
        for (const [index, receipt] of Object.entries(receiptIndex)) {
            const { addresses, unitName, unitType } = this.getAddressFromReceipt(receipt)
            const [receiptAddress] = addresses
            const { address, addressKey } = this.propertyFinder.findPropertyByOrganizationAndAddress(receiptAddress)
            receiptIndex[index].addressResolve = { unitName, unitType, addresses, propertyAddress: { address, addressKey } }
        }
        return receiptIndex
    }
    
    addressFieldValue (address, addressKey) {
        // In the tests we create addressKey as a md5 hash of address
        if (UUID_REGEXP.test(addressKey)) {
            return `key:${addressKey}`
        }
        return address
    }

    async processReceipts (receiptIndex) {
        const updated = new Set()
        await this.normalizeAddresses(receiptIndex)
        for (const [index, receipt] of Object.entries(receiptIndex)) {
            const { propertyAddress, addresses } = receipt.addressResolve
            const { addressKey: resultAddressKey, address, error, problem  } = propertyAddress
            if (error) {
                receiptIndex[index].error = error
                continue
            }
            if (problem) {
                receiptIndex[index].problems.push({ problem, params: { addresses } })
            }
            const { importId: importIdInput = '', globalId = '' } = get(receipt, 'addressMeta') || {}
            const propertyGlobalId = normalizePropertyGlobalId(globalId)
            let existingProperty
            if (importIdInput) {
                existingProperty = this.properties.find(({ importId }) => importId === importIdInput)
            }
            if (!existingProperty) {
                existingProperty = this.properties.find(({ addressKey }) => resultAddressKey === addressKey)
            }
            if (existingProperty) {
                receiptIndex[index].property = existingProperty.id
                if (!updated.has(existingProperty.id)) {
                    const updateInput = this.buildUpdateInput({
                        importId: importIdInput,
                        globalId: propertyGlobalId,
                        address: resultAddressKey !== existingProperty.addressKey ? this.addressFieldValue(address, resultAddressKey) : null,
                    }, existingProperty)
                    if (!isEmpty(updateInput)) {
                        try {
                            const updatedBillingProperty = await BillingPropertyApi.update(this.context, existingProperty.id, updateInput)
                            const indexToUpdate = this.properties.findIndex(({ id }) => id === existingProperty.id)
                            this.properties.splice(indexToUpdate, 1, updatedBillingProperty)
                        } catch (error) {
                            receiptIndex[index].error = this.error(ERRORS.PROPERTY_SAVE_FAILED, index, error)
                        }
                    }
                    updated.add(existingProperty.id)
                }
            } else {
                try {
                    const newProperty = await BillingPropertyApi.create(this.context, this.buildCreateInput({
                        context: this.billingContext.id,
                        address: this.addressFieldValue(address, resultAddressKey),
                        importId: importIdInput,
                        globalId: propertyGlobalId,
                    }, ['context']))
                    this.properties.push(newProperty)
                    receiptIndex[index].property = newProperty.id
                    updated.add(newProperty.id)
                } catch (error) {
                    receiptIndex[index].error = this.error(ERRORS.PROPERTY_SAVE_FAILED, index, error)
                }
            }

        }
        return this.result(receiptIndex)
    }

}

class AddressTransform {

    regExps = {}
    replaces = {}

    init (config) {
        try {
            for (const [search, replace] of Object.entries(config)) {
                if (search.startsWith('r')) {
                    this.regExps[search.slice(1)] = replace
                } else {
                    this.replaces[search] = replace
                }
            }
        } catch {
            // logging miss-configuration
        }
    }

    apply (input) {
        if (typeof input !== 'string') {
            return input.trim()
        }
        for (const regFrom of Object.keys(this.regExps)) {
            if (this.regExps.hasOwnProperty(regFrom)) {
                const regTo = this.regExps[regFrom]
                input = input.trim().replace(new RegExp(regFrom, 'g'), regTo)
            }
        }

        for (const from of Object.keys(this.replaces)) {
            if (this.replaces.hasOwnProperty(from)) {
                input = input.trim().split(from).join(this.replaces[from])
            }
        }

        return input
            .replaceAll(/\s+/g, ' ')
            .trim()
    }

}


class PropertyFinder {

    constructor () {
        this.organizationProperties = []
    }

    init (organizationProperties) {
        this.organizationProperties = organizationProperties.map(property => ({
            ...property,
            tokens: this.getTokensFromAddress(property.address),
        }))
    }

    getTokensFromAddress (addressStr) {
        const SYMBOLS_TO_REMOVE_REGEXP = /[!@#$%^&*)(+=_:"'`[\]]/g
        const SPLITTERS_REGEXP = /[,;.\s-/]/
        const IS_DIGITS_ONLY_REGEXP = /^\d+$/
        return addressStr
            .toLowerCase()
            .replace(/[ёë]/g, 'е')
            .replace(SYMBOLS_TO_REMOVE_REGEXP, '')
            .replace(/\s+/g, ' ')
            .split(SPLITTERS_REGEXP)
            .filter(Boolean)
            .filter((x) => x.length > 1 || IS_DIGITS_ONLY_REGEXP.test(x))
    }

    orderedIntersection (arr1, arr2) {
        const result = []
        const _arr2 = Array.from(arr2)
        for (const str1 of arr1) {
            if (_arr2.includes(str1)) {
                result.push(str1)
                _arr2.splice(0, _arr2.indexOf(str1) + 1)
            }
        }
        return result
    }

    findPropertyByOrganizationAndAddress (address) {
        const targetTokens = this.getTokensFromAddress(address)
        let maxScore = 0
        let theMostProbableProperties = []
        for (const property of this.organizationProperties) {
            const intersection = this.orderedIntersection(targetTokens, property.tokens)
            const score = intersection.length
            if (score >= maxScore) {
                if (score === maxScore) {
                    theMostProbableProperties.push(property)
                } else {
                    theMostProbableProperties = [property]
                    maxScore = score
                }
            }
        }
        return theMostProbableProperties[0]
    }

}

module.exports = {
    AddressTransform,
    PropertyFinder,
    PropertyResolver,
}
