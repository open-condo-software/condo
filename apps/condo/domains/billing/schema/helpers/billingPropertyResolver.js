const { get, isNil, isEmpty } = require('lodash')

const {
    createInstance: createAddressServiceClientInstance,
} = require('@open-condo/clients/address-service-client')


const { AddressTransform, AddressParser } = require('@condo/domains/billing/schema/helpers/addressTransform')
const { BillingAccount, BillingProperty, BillingReceipt } = require('@condo/domains/billing/utils/serverSchema')
const { Property } = require('@condo/domains/property/utils/serverSchema')

const { findPropertyByOrganizationAndAddress } = require('./propertyFinder')

// This is a percent of matched tokens while searching through the organization's properties
const PROPERTY_SCORE_TO_PASS = 95

// constants
const dvAndSender = { dv: 1, sender: { dv: 1, fingerprint: 'billing-property-resolver' } }

class ResolveError extends Error {
    constructor (code, message) {
        super(message)
        this.code = code
    }
}

class BillingPropertyResolver {

    /**
     *
     * @param summary - an address summary @see this.getSearchSummary
     * @returns {string|null}
     */
    getBillingPropertyKey (summary) {
        const getNotEmpty = (value) => {
            if (isNil(value)) {
                return value
            } else if (!isEmpty(value.trim())) {
                return value.trim()
            }

            return null
        }
        return getNotEmpty(get(summary, 'normalizedAddress')) || getNotEmpty(get(summary, 'address')) || null
    }

    /**
     * Prepare address transformer to work with provided rule set
     * @param context - keystone server context
     * @param tin - organization tin
     * @param organizationId - organization id
     * @param billingIntegrationOrganizationContextId - billing integration organization context id
     * @param addressTransformRules - address transform rules
     * @param mockedItem - address service mocked item (for test purposes only)
     * @returns {Promise<{errorMessage: (string|undefined), error: (string|null)}>}
     */
    async init (context, tin, organizationId, billingIntegrationOrganizationContextId, addressTransformRules, mockedItem) {
        this.context = context
        this.tin = tin
        this.organizationId = organizationId
        this.billingIntegrationOrganizationContextId = billingIntegrationOrganizationContextId
        this.addressService = createAddressServiceClientInstance(mockedItem)
        this.addressTransformer = new AddressTransform()
        this.parser = new AddressParser()
        this.addressCache = {}
        this.organizationProperties = await Property.getAll(context, {
            organization: { id: organizationId },
            deletedAt: null,
        })

        return this.addressTransformer.init(addressTransformRules)
    }

    /**
     * Do address transformations and parse
     * @param address
     * @returns {{parsed: boolean, address: (string|undefined), unitName: (string|undefined), unitType: (string|undefined)}}
     */
    parseAddress (address) {
        if (isNil(address) || isEmpty(address.trim())) {
            return { parsed: false }
        }
        const transformedAddress = this.transformer.apply(address)
        return {
            parsed: true,
            ...this.parser.parse(transformedAddress),
        }
    }

    /**
     * Parse fias
     * @param fias - FIAS housing id
     * @returns {{parsed: boolean, isFias: boolean, unitType: (string|undefined), unitName: (string|undefined), address: (string|undefined)}}
     */
    parseFias (fias) {
        if (isNil(fias) || isEmpty(fias.trim())) {
            return { parsed: false, isFias: true }
        }

        const { address, unitName, unitType } = this.parser.parse(`fiasId:${fias}`)

        return {
            parsed: true,
            isFias: true,
            unitName,
            unitType,
            address,
        }
    }

    /**
     * Choose unitType & unitName from parsed data
     * @param parsedFias - parsed fias
     * @param parsedAddress - transformed & parsed address
     * @param providedUnitType - provided unit type
     * @param providedUnitName - provided unit name
     * @returns {{unitType: string, unitName: string}}
     * @throws ResolveError<{code: string}>
     */
    chooseUnitParts (parsedFias, parsedAddress, providedUnitType, providedUnitName) {
        let unitType, unitName = null

        // firstly try to get unit data from parsedFias
        if (parsedFias.parsed) {
            unitType = parsedFias.unitType
            unitName = parsedFias.unitName
        }

        // in case if we have address information parsed
        if (parsedAddress.parsed) {
            // in order if fias data is empty or unitType is standard one
            if (isNil(unitType) || isEmpty(unitType) || unitType === 'flat') {
                unitType = parsedAddress.unitType
            }

            if (isNil(unitName) || isEmpty(unitName)) {
                unitName = parsedAddress.unitName
            }
        }

        // in case if parsed data doesn't provide either unitType or unitName
        // then try to get it from provided data
        if (isEmpty(unitType)) {
            unitType = providedUnitType
        }
        if (isEmpty(unitName)) {
            unitName = providedUnitName
        }

        // in case if data is still missing - return an error
        if (isEmpty(unitName)) {
            throw new ResolveError(
                'ADDRESS_NOT_RESOLVED_UNIT_NAME',
                `Can not resolve unit name for address: ${get(parsedAddress, 'address')} (fiasId: ${get(parsedFias, 'fias')})`,
            )
        }
        if (isEmpty(unitType)) {
            throw new ResolveError(
                'ADDRESS_NOT_RESOLVED_UNIT_TYPE',
                `Can not resolve unit type for address: ${get(parsedAddress, 'address')} (fiasId: ${get(parsedFias, 'fias')})`,
            )
        }

        return { unitName, unitType }
    }

    getCacheKey (address) {
        return !isEmpty(address) ? `${this.tin}_${address}` : null
    }

    /**
     * Propagate addresses in any omit in address cache
     * @param parsedAddress - parsed address
     */
    async propagateAddressToCache (parsedAddress) {
        const key = this.getCacheKey(parsedAddress.address)

        // check if address wasn't populated for a key before
        if (!isNil(key) && parsedAddress.parsed && !(Object.keys(this.addressCache).indexOf(key) > -1)) {
            // address is parsed and not exists in the cache
            const searchResults = await this.addressService.search(parsedAddress.address, { 'helpers.tin': this.tin })

            if (!isNil(searchResults)) {
                this.addressCache[key] = searchResults

                // and iterate over address sources in order to fill similar addresses
                const addressSources = get(searchResults, 'addressSources') || []
                addressSources
                    .map(item => this.getCacheKey(item))
                    .filter(itemKey => !isNil(itemKey))
                    .filter(itemKey => isNil(this.addressCache[itemKey]))
                    .forEach(itemKey => {
                        this.addressCache[itemKey] = searchResults
                    })
            } else {
                // in case if addressService returns null - we have to prevent to search by this key in future
                this.addressCache[key] = null
            }
        }
    }

    /**
     * Get normalized address and fias
     * @param parsedAddress - parsed address or fias
     * @returns {{address: string|null, addressKey: string|null, normalizedAddress: string|null, fias: string|null}}
     */
    getAddressConditionValues (parsedAddress) {
        // 3 cases expected here:
        //      1. address are cached (no matter if this is a fias or not)
        //      2. address not normalized (not a fias case)
        //      3. address not normalized (fias case)
        const key = this.getCacheKey(parsedAddress.address)
        const searchResult = this.addressCache[key]

        let address = null, addressKey = null, normalizedAddress = null, fias = null

        if (!isNil(searchResult)) {
            address = parsedAddress.isFias ? null : parsedAddress.address
            addressKey = get(searchResult, 'addressKey')
            normalizedAddress = get(searchResult, 'address')
            fias = get(searchResult, ['addressMeta', 'data', 'house_fias_id'])
        } else if (!parsedAddress.isFias) {
            address = parsedAddress.address
        } else if (parsedAddress.isFias) {
            fias = parsedAddress.address.replace('fiasId:', '')
        }

        return { address, addressKey, normalizedAddress, fias }
    }

    /**
     * Search billing property by parsed values
     * @param conditionValues - @see getAddressConditionValues
     * @returns {Promise<BillingProperty|null>}
     */
    async searchBillingProperty (conditionValues) {
        const { address, addressKey, normalizedAddress, fias } = conditionValues

        // let's assemble a query to BillingProperty
        const conditions = []
        if (!isEmpty(addressKey)) {
            conditions.push({ addressKey })
        }
        if (!isEmpty(normalizedAddress)) {
            conditions.push({ address: normalizedAddress })
        } else if (!isEmpty(address)) {
            conditions.push({ address })
        }

        if (!isEmpty(fias)) {
            conditions.push({ globalId: fias })
        }
        const where = {
            AND: [{ OR: conditions }, {
                deletedAt: null,
                context: { id: this.billingIntegrationOrganizationContextId },
            }],
        }
        const result = await BillingProperty.getAll(this.context, where, { first: 1 })
        return result.length > 0 ? result[0] : null
    }

    /**
     * Check if billing property registered in organization
     * @param billingProperty - a billing property
     * @returns {Promise<boolean>}
     */
    async isPropertyRegistrationInOrganization (billingProperty) {
        const relatedPropertyId = get(billingProperty, ['property', 'id'])

        if (isEmpty(relatedPropertyId)) {
            return false
        }

        return this.organizationProperties.filter(property => property.id === relatedPropertyId).length > 0
    }

    /**
     * Get all property clearing data together
     * @param parsedAddress
     * @returns {Promise<{address: (string|null), addressKey: (string|null), normalizedAddress: (string|null), registeredInOrg: boolean, fias: (string|null), billingProperty: (BillingProperty|null)}>}
     */
    async getSearchSummary (parsedAddress) {
        const conditionValues = this.getAddressConditionValues(parsedAddress)
        const billingProperty = await this.searchBillingProperty(conditionValues)
        const registeredInOrg = await this.isPropertyRegistrationInOrganization(billingProperty)

        return {
            ...conditionValues,
            billingProperty,
            registeredInOrg,
        }
    }

    /**
     * Create a notification about registration suspicious billing property
     * @param summary - @see getSearchSummary
     * @returns {Promise<void>}
     */
    async createBillingProblem (summary) {
        // todo
    }

    /**
     * Get billing property by search of organizations properties
     * @param address - address
     * @returns {Promise<BillingProperty|null|undefined>}
     */
    async getOrganizationBillingPropertySuggestion (address) {
        if (isEmpty(address)) {
            return null
        }

        const [foundOrganizationProperties, score] = await findPropertyByOrganizationAndAddress(
            this.context, this.organizationId, address,
        )

        if (score > PROPERTY_SCORE_TO_PASS && foundOrganizationProperties.length === 1) {
            // we can not search by billingProperty.property since it is a virtual field
            // only way is to take addressKey/address from foundProperty
            // and try to find a billingProperty by those values
            const { address, addressKey } = foundOrganizationProperties[0]
            const conditions = []

            if (!isEmpty(address)) {
                conditions.push({ address })
            }

            if (!isEmpty(addressKey)) {
                conditions.push({ addressKey })
            }

            const [foundBillingProperty] = await BillingProperty.getAll(this.context, {
                AND: {
                    OR: conditions,
                    context: { id: this.billingIntegrationOrganizationContextId },
                    deletedAt: null,
                },
            })

            return foundBillingProperty
        }
    }

    /**
     *
     * @param fiasSummary - a fias summary @see this.getSearchSummary
     * @param addressSummary - an address summary @see this.getSearchSummary
     * @param addressMeta - integration provided address meta
     * @returns {Promise<BillingProperty>}
     */
    async createBillingProperty (fiasSummary, addressSummary, addressMeta) {
        const billingPropertyParams = {
            ...dvAndSender,
            globalId: get(fiasSummary, 'fias'),
            address: get(addressSummary, 'normalizedAddress') || get(addressSummary, 'address'),
            normalizedAddress: get(addressSummary, 'normalizedAddress'),
            raw: { dv: 1 },
            importId: this.getBillingPropertyKey(addressSummary),
            meta: { dv: 1, ...addressMeta },
            context: { connect: { id: this.billingIntegrationOrganizationContextId } },
        }

        return await BillingProperty.create(this.context, billingPropertyParams)
    }

    /**
     * Resolve BillingProperty model by provided address. Either retrieve exists one property or create new one
     * @param address - address string
     * @param addressMeta - an optional object, can hold fias field (housing fias)
     * @param providedUnitType - provided unit type
     * @param providedUnitName - provided unit name
     * @returns {Promise<{ error: (string), errorMessage: (string)} | { billingProperty: (BillingProperty), unitType: string, unitName: string}>}
     */
    async resolve (address, addressMeta, providedUnitType, providedUnitName) {
        try {
            // parse data
            const parsedFias = this.parseFias(get(addressMeta, 'fias'))
            const parsedAddress = this.parseAddress(address)

            // choose unitName, unitType
            const {
                unitType,
                unitName,
            } = this.chooseUnitParts(parsedFias, parsedAddress, providedUnitType, providedUnitName)

            // propagate addresses into cache
            await this.propagateAddressToCache(parsedFias)
            await this.propagateAddressToCache(parsedAddress)

            // case: one of found billing property is good enough
            // retrieve summary and respond if it is good enough
            const fiasSummary = await this.getSearchSummary(parsedFias)
            if (fiasSummary.registeredInOrg) {
                return { billingProperty: fiasSummary.billingProperty, unitType, unitName }
            }

            const addressSummary = await this.getSearchSummary(parsedAddress)
            if (addressSummary.registeredInOrg) {
                return { billingProperty: addressSummary.billingProperty, unitType, unitName }
            }

            // case: found only billing properties not in the organization
            if (!isNil(fiasSummary.billingProperty)) {
                await this.createBillingProblem(fiasSummary)
                return { billingProperty: fiasSummary.billingProperty, unitType, unitName }
            }
            if (!isNil(addressSummary.billingProperty)) {
                await this.createBillingProblem(addressSummary)
                return { billingProperty: addressSummary.billingProperty, unitType, unitName }
            }

            // case: try to search them in organization pxroperties
            let foundProperty = await this.getOrganizationBillingPropertySuggestion(addressSummary.normalizedAddress)
                || await this.getOrganizationBillingPropertySuggestion(addressSummary.address)
            if (!isNil(foundProperty)) {
                return { billingProperty: foundProperty, unitType, unitName }
            }

            // case: no property can be found - let's create one
            const billingProperty = await this.createBillingProperty(fiasSummary, addressSummary, addressMeta)
            return { billingProperty, unitType, unitName }
        } catch (e) {
            const error = e.code || 'ADDRESS_NOT_RECOGNIZED_VALUE'
            const errorMessage = e.message

            return { error, errorMessage }
        }
    }
}

module.exports = {
    BillingPropertyResolver,
}