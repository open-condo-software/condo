const { get, isNil, isEmpty } = require('lodash')

const {
    createInstance: createAddressServiceClientInstance,
} = require('@open-condo/clients/address-service-client')
const { getLogger } = require('@open-condo/keystone/logging')

const { AddressTransform, AddressParser } = require('@condo/domains/billing/schema/helpers/addressTransform')
const {
    BillingProperty,
    BillingAccount,
    BillingIntegrationOrganizationContext,
} = require('@condo/domains/billing/utils/serverSchema')
const { Property } = require('@condo/domains/property/utils/serverSchema')

const { findPropertyByOrganizationAndAddress } = require('./propertyFinder')

// This is a percent of matched tokens while searching through the organization's properties
const PROPERTY_SCORE_TO_PASS = 95

// constants
const fingerprint = 'billing-property-resolver'
const dvAndSender = { dv: 1, sender: { dv: 1, fingerprint } }
const logger = getLogger(fingerprint)

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
     * @param billingIntegrationOrganizationContextId - billing integration organization context id
     * @param addressTransformRules - address transform rules
     * @param mockedItem - address service mocked item (for test purposes only)
     * @returns {Promise<{errorMessage: (string|undefined), error: (string|null)}>}
     */
    async init (context, billingIntegrationOrganizationContextId, addressTransformRules, mockedItem = null) {
        this.context = context
        this.billingIntegrationOrganizationContextId = billingIntegrationOrganizationContextId
        this.billingIntegrationOrganizationContext = await BillingIntegrationOrganizationContext.getOne(
            context,
            { id: billingIntegrationOrganizationContextId }
        )
        this.organizationId = this.billingIntegrationOrganizationContext.organization.id
        this.tin = this.billingIntegrationOrganizationContext.organization.tin
        this.addressService = createAddressServiceClientInstance(mockedItem)
        this.addressTransformer = new AddressTransform()
        this.parser = new AddressParser()
        this.addressCache = {}

        // address transformRules from both input/context
        const inputRules = addressTransformRules || {}
        const contextRules = get(this.billingIntegrationOrganizationContext, 'settings.addressTransform', {})
        const rules = { ...contextRules, ...inputRules }

        return this.addressTransformer.init(rules)
    }

    /**
     * Do address transformations and parse
     * @param address
     * @returns {{parsed: boolean, address: (string|undefined), unitName: (string|undefined), unitType: (string|undefined), originalInput: (string|null)}}
     */
    parseAddress (address) {
        if (isNil(address) || isEmpty(address.trim())) {
            return { parsed: false }
        }
        const transformedAddress = this.addressTransformer.apply(address)
        return {
            parsed: true,
            originalInput: transformedAddress,
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
            originalInput: fias,
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
        let unitType = providedUnitType, unitName = providedUnitName

        // firstly try to get unit data from parsedFias
        if (parsedFias.parsed ) {
            if (isEmpty(unitType) && !isEmpty(parsedFias.unitType)) {
                unitType = parsedFias.unitType
            }
            if (isEmpty(unitName) && !isEmpty(parsedFias.unitName)) {
                unitName = parsedFias.unitName
            }
        }

        // in case if we have address information parsed
        if (parsedAddress.parsed) {
            // in order if fias data is empty or unitType is standard one
            if (!isEmpty(parsedAddress.unitType) && (isEmpty(unitType) || unitType === 'flat')) {
                unitType = parsedAddress.unitType
            }

            if (!isEmpty(parsedAddress.unitName) && isEmpty(unitName)) {
                unitName = parsedAddress.unitName
            }
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
     * @param address - address to normalize
     */
    async propagateAddressToCache (address) {
        const key = this.getCacheKey(address)

        // check if address wasn't populated for a key before
        if (!isNil(key) && !isEmpty(address) && !(Object.keys(this.addressCache).indexOf(key) > -1)) {
            // address is parsed and not exists in the cache
            const searchResults = await this.addressService.search(address, { 'helpers.tin': this.tin })

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
        //      1. address are cached (no matter if this is a fias, parsed address or original input)
        //      2. original input address are cached
        //      3. address not normalized (not a fias case)
        //      4. address not normalized (fias case)
        const searchResult = this.addressCache[this.getCacheKey(parsedAddress.address)]
            || this.addressCache[this.getCacheKey(parsedAddress.originalInput)]

        let address = null, addressKey = null, normalizedAddress = null, fias = null

        if (!isNil(searchResult)) {
            address = parsedAddress.isFias ? null : get(searchResult, 'address') || parsedAddress.address
            addressKey = get(searchResult, 'addressKey')
            normalizedAddress = get(searchResult, 'address')
            fias = parsedAddress.parsed && parsedAddress.isFias
                ? parsedAddress.address.replace('fiasId:', '')
                : get(searchResult, ['addressMeta', 'data', 'house_fias_id'])
        } else if (parsedAddress.parsed && !parsedAddress.isFias) {
            address = parsedAddress.address
        } else if (parsedAddress.parsed && parsedAddress.isFias) {
            fias = parsedAddress.address.replace('fiasId:', '')
        }

        return { address, addressKey, normalizedAddress, fias, originalInput: parsedAddress.originalInput }
    }

    /**
     * Search billing property by parsed values
     * @param conditionValues - @see getAddressConditionValues
     * @returns {Promise<BillingProperty|null>}
     */
    async searchBillingProperty (conditionValues) {
        const { address, addressKey, normalizedAddress, fias, originalInput } = conditionValues

        // let's assemble a query to BillingProperty
        const conditions = []
        if (!isEmpty(addressKey)) {
            conditions.push({ addressKey })
        }

        if (!isEmpty(originalInput)) {
            conditions.push({ address: originalInput })
        }

        if (!isEmpty(normalizedAddress)) {
            conditions.push({ address: normalizedAddress })
        }

        if (!isEmpty(address)) {
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

        const count = await Property.count(this.context, {
            id: relatedPropertyId,
            organization: { id: this.organizationId }, deletedAt: null }
        )
        return count > 0
    }

    /**
     * Get all property clearing data together
     * @param parsedAddress
     * @returns {Promise<{address: (string|null), addressKey: (string|null), normalizedAddress: (string|null), originalInput: (string|null), registeredInOrg: boolean, fias: (string|null), billingProperty: (BillingProperty|null)}>}
     */
    async getSearchSummary (parsedAddress) {
        const conditionValues = this.getAddressConditionValues(parsedAddress)
        const billingProperty = await this.searchBillingProperty(conditionValues)
        const registeredInOrg = await this.isPropertyRegistrationInOrganization(billingProperty)

        return {
            ...conditionValues,
            originalInput: parsedAddress.originalInput,
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
        logger.warn({ msg: 'BillingPropertyResolver resolved property not from current organization', ...summary })
    }

    /**
     * Get billing property by search of organizations properties
     * @param address - address
     * @param scoreToPass - minimal score to accept a result
     * @returns {Promise<{property: BillingProperty|null|undefined, score: number}>}
     */
    async getOrganizationBillingPropertySuggestion (address, scoreToPass = PROPERTY_SCORE_TO_PASS) {
        if (isEmpty(address)) {
            return null
        }

        const [foundOrganizationProperties, score] = await findPropertyByOrganizationAndAddress(
            this.context, this.organizationId, address,
        )

        if (score > scoreToPass && foundOrganizationProperties.length === 1) {
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

            return { property: foundBillingProperty, score }
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
        const address = get(addressSummary, 'normalizedAddress')
            || get(addressSummary, 'address')
            || get(addressSummary, 'originalInput')
        const billingPropertyParams = {
            ...dvAndSender,
            globalId: get(fiasSummary, 'fias'),
            address,
            normalizedAddress: get(addressSummary, 'normalizedAddress'),
            raw: { dv: 1, address: addressSummary.originalInput },
            importId: this.getBillingPropertyKey(addressSummary),
            meta: { dv: 1, ...addressMeta },
            context: { connect: { id: this.billingIntegrationOrganizationContextId } },
        }

        return await BillingProperty.create(this.context, billingPropertyParams)
    }

    /**
     * Enrich resolved billingProperty with unitName/unitType
     * @param billingProperty - resolved billing property
     * @param parsedFias - parsed fias address
     * @param parsedAddress - parsed address
     * @param providedUnitType - provided unit type
     * @param providedUnitName - provided unit name
     * @returns {Promise<{ billingProperty: (BillingProperty), unitType: string, unitName: string}>}
     */
    async packToResult (billingProperty, parsedFias, parsedAddress, providedUnitType, providedUnitName) {
        // choose unitName, unitType from address or provided data
        const {
            unitType,
            unitName,
        } = this.chooseUnitParts(parsedFias, parsedAddress, providedUnitType, providedUnitName)

        return { billingProperty, unitType, unitName }
    }

    /**
     * Get params for properties resolve flow
     * @returns {Promise<{resolveOnlyByOrganizationProperties: boolean}>}
     */
    async getResolveFlowParams () {
        const resolveOnlyByOrganizationProperties = get(
            this.billingIntegrationOrganizationContext,
            'settings.billingPropertyResolver.resolveOnlyByOrganizationProperties',
            false
        )

        return {
            resolveOnlyByOrganizationProperties,
        }
    }

    async resolveByOrganizationProperties ({ originalInput, address, normalizedAddress }) {
        const originalInputResult = await this.getOrganizationBillingPropertySuggestion(originalInput, 1)
        const addressResult = await this.getOrganizationBillingPropertySuggestion(address, 1)
        const normalizedAddressResult = await this.getOrganizationBillingPropertySuggestion(normalizedAddress, 1)

        if (isNil(addressResult) && isNil(normalizedAddressResult) && isNil(originalInputResult)) {
            throw new ResolveError('ADDRESS_NOT_RECOGNIZED_VALUE', 'Can not resolve property by organization registered properties')
        }

        let property = null
        let maxScore = 0

        const results = [originalInputResult, addressResult, normalizedAddressResult]

        results.filter(result => !isNil(result)).forEach(result => {
            const score = get(result, 'score', 0)
            if (score >= maxScore) {
                property = result.property
                maxScore = score
            }
        })

        return property
    }

    /**
     * Resolve BillingProperty model by provided address. Either retrieve exists one property or create new one
     * @param address - address string. Can include unitType/unitName or not
     * @param addressMeta - an optional object, can hold fias field (housing fias)
     * @param providedUnitType - provided unit type
     * @param providedUnitName - provided unit name
     * @returns {Promise<{ error: (string), errorMessage: (string)} | { billingProperty: (BillingProperty), unitType: string, unitName: string}>}
     */
    async resolve (address, addressMeta, providedUnitType, providedUnitName) {
        try {
            const flowParams = await this.getResolveFlowParams()

            // parse data
            const parsedFias = this.parseFias(get(addressMeta, 'fias'))
            const parsedAddress = this.parseAddress(address)

            // propagate addresses into cache
            await this.propagateAddressToCache(address)
            await this.propagateAddressToCache(parsedFias.address)
            await this.propagateAddressToCache(parsedAddress.address)

            // case: billing integration organization context has flat to resolve by created properties
            if (flowParams.resolveOnlyByOrganizationProperties) {
                const addressConditionValues = this.getAddressConditionValues(parsedAddress)
                return await this.packToResult(
                    await this.resolveByOrganizationProperties(addressConditionValues), parsedFias, parsedAddress,
                    providedUnitType, providedUnitName,
                )
            }

            // case: one of found billing property is good enough
            // retrieve summary and respond if it is good enough
            const fiasSummary = await this.getSearchSummary(parsedFias)
            if (fiasSummary.registeredInOrg) {
                return await this.packToResult(
                    fiasSummary.billingProperty, parsedFias, parsedAddress,
                    providedUnitType, providedUnitName,
                )
            }

            const addressSummary = await this.getSearchSummary(parsedAddress)
            if (addressSummary.registeredInOrg) {
                return await this.packToResult(
                    addressSummary.billingProperty, parsedFias, parsedAddress,
                    providedUnitType, providedUnitName,
                )
            }

            // case: found only billing properties not in the organization
            if (!isNil(fiasSummary.billingProperty)) {
                await this.createBillingProblem(fiasSummary)
                return await this.packToResult(
                    fiasSummary.billingProperty, parsedFias, parsedAddress,
                    providedUnitType, providedUnitName,
                )
            }
            if (!isNil(addressSummary.billingProperty)) {
                await this.createBillingProblem(addressSummary)
                return await this.packToResult(
                    addressSummary.billingProperty, parsedFias, parsedAddress,
                    providedUnitType, providedUnitName,
                )
            }

            // case: no property can be found - let's create one
            const billingProperty = await this.createBillingProperty(fiasSummary, addressSummary, addressMeta)

            return await this.packToResult(
                billingProperty, parsedFias, parsedAddress,
                providedUnitType, providedUnitName,
            )
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