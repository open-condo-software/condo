const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')
const { isNil } = require('lodash')

const {
    catchErrorFrom, setFakeClientMode,
} = require('@open-condo/keystone/test.utils')

const { AddressTransform, AddressParser } = require('@condo/domains/billing/schema/helpers/addressTransform')
const {
    makeContextWithOrganizationAndIntegrationAsAdmin,
    createTestBillingProperty,
    createTestBillingIntegrationOrganizationContext,
} = require('@condo/domains/billing/utils/testSchema')
const {
    createTestProperty,
} = require('@condo/domains/property/utils/testSchema')
const { buildFakeAddressAndMeta } = require('@condo/domains/property/utils/testSchema/factories')

const { BillingPropertyResolver } = require('./billingPropertyResolver')

const { keystone } = index

setFakeClientMode(index)

const createTestPropertyPair = async (admin, billingContext, organization) => {
    const { address, addressMeta } = buildFakeAddressAndMeta()
    const globalId = addressMeta.data.house_fias_id
    const [property] = await createTestProperty(admin, organization, { address, addressMeta })
    const [billingProperty] = await createTestBillingProperty(admin, billingContext, { address, addressMeta, globalId })

    return {
        billingProperty,
        property,
    }
}

describe('BillingPropertyResolver tests', () => {

    let adminContext,
        admin,
        billingIntegrationContext,
        anotherBillingIntegrationContextForSameOrganization,
        organization,
        resolver,
        getResolver,
        tin,
        properties,
        noPairProperty

    beforeAll(async () => {
        adminContext = keystone.createContext({ skipAccessControl: true })
        const {
            admin: adminClient,
            context: billingContext,
            integration,
            organization: org,
        } = await makeContextWithOrganizationAndIntegrationAsAdmin()
        admin = adminClient
        billingIntegrationContext = billingContext
        organization = org
        tin = organization.tin
        const [secondContext] = await createTestBillingIntegrationOrganizationContext(
            admin,
            organization, integration, {}
        )
        anotherBillingIntegrationContextForSameOrganization = secondContext
        properties = [
            await createTestPropertyPair(admin, billingIntegrationContext, organization),
            await createTestPropertyPair(admin, anotherBillingIntegrationContextForSameOrganization, organization),
        ]

        const [property] = await createTestProperty(admin, organization)
        noPairProperty = property

        // init resolver at the end since it cache data at init stage
        resolver = new BillingPropertyResolver()
        await resolver.init(
            adminContext,
            billingContext.id,
            {},
        )

        getResolver = async (rules = {}, addressServiceSearchMock = async () => null, providedOrg, providedContext) => {
            const chosenContext = isNil(providedContext) ? billingIntegrationContext : providedContext
            // init resolver at the end since it cache data at init stage
            resolver = new BillingPropertyResolver()
            await resolver.init(
                adminContext,
                chosenContext.id,
                rules,
            )

            resolver.addressService.search = addressServiceSearchMock
            return resolver
        }
    })

    describe('BillingPropertyResolver.getBillingPropertyKey tests', () => {
        const address = faker.address.streetAddress(true)
        const normalizedAddress = faker.address.streetAddress(true)

        it('returns normalizedAddress', async () => {
            expect(resolver.getBillingPropertyKey({ address, normalizedAddress })).toEqual(normalizedAddress)
            expect(resolver.getBillingPropertyKey({ address: ' ', normalizedAddress })).toEqual(normalizedAddress)
            expect(resolver.getBillingPropertyKey({ address: null, normalizedAddress })).toEqual(normalizedAddress)
            expect(resolver.getBillingPropertyKey({ normalizedAddress })).toEqual(normalizedAddress)
        })

        it('returns address', async () => {
            expect(resolver.getBillingPropertyKey({ address, normalizedAddress: '' })).toEqual(address)
            expect(resolver.getBillingPropertyKey({ address, normalizedAddress: null })).toEqual(address)
            expect(resolver.getBillingPropertyKey({ address })).toEqual(address)
        })

        it('returns null', async () => {
            expect(resolver.getBillingPropertyKey({ address: '', normalizedAddress: '' })).toBeNull()
            expect(resolver.getBillingPropertyKey({ address: null, normalizedAddress: '' })).toBeNull()
            expect(resolver.getBillingPropertyKey({ normalizedAddress: '' })).toBeNull()
            expect(resolver.getBillingPropertyKey({ normalizedAddress: '  ' })).toBeNull()
            expect(resolver.getBillingPropertyKey({ address: '', normalizedAddress: null })).toBeNull()
            expect(resolver.getBillingPropertyKey({ address: '' })).toBeNull()
            expect(resolver.getBillingPropertyKey({ address: '  ' })).toBeNull()
            expect(resolver.getBillingPropertyKey({ address: null, normalizedAddress: null })).toBeNull()
            expect(resolver.getBillingPropertyKey({ address: null })).toBeNull()
            expect(resolver.getBillingPropertyKey({ normalizedAddress: null })).toBeNull()
            expect(resolver.getBillingPropertyKey({})).toBeNull()
            expect(resolver.getBillingPropertyKey(null)).toBeNull()
            expect(resolver.getBillingPropertyKey('')).toBeNull()
            expect(resolver.getBillingPropertyKey()).toBeNull()
        })

    })

    describe('BillingPropertyResolver.init tests', () => {
        it('regular case', async () => {
            const resolver = new BillingPropertyResolver()
            const contextAddressTransform = { 'fl.': 'flat' }
            const {
                admin,
                context,
                organization,
            } = await makeContextWithOrganizationAndIntegrationAsAdmin(
                {}, {}, {
                    settings: { dv: 1, addressTransform: contextAddressTransform },
                }
            )

            // constant
            const tin = organization.tin
            const organizationId = organization.id
            const billingIntegrationOrganizationContextId = context.id
            const addressTransformRules = { one: 'rule' }
            const rules = { ...addressTransformRules, ...contextAddressTransform }
            const properties = [
                await createTestPropertyPair(admin, billingIntegrationContext, organization),
            ]

            await resolver.init(
                adminContext,
                billingIntegrationOrganizationContextId,
                addressTransformRules,
            )

            expect(resolver).toMatchObject({
                tin, organizationId, billingIntegrationOrganizationContextId,
            })

            expect(resolver).toHaveProperty('context')
            expect(resolver).toHaveProperty('addressService')
            expect(resolver).toHaveProperty('addressTransformer')
            expect(resolver.addressTransformer.replaces).toMatchObject(rules)
            expect(resolver).toHaveProperty('parser')
            expect(resolver).toHaveProperty('addressCache')
            expect(resolver).toHaveProperty('billingIntegrationOrganizationContext')
        })
    })

    describe('BillingPropertyResolver.parseAddress tests', () => {
        it('returns parsed: false', async () => {
            expect(resolver.parseAddress()).toMatchObject({ parsed: false })
            expect(resolver.parseAddress(null)).toMatchObject({ parsed: false })
            expect(resolver.parseAddress('')).toMatchObject({ parsed: false })
        })

        it('returns parsed: true no transformation rules', async () => {
            expect(resolver.parseAddress('пер.Малый Козихинский, д.7, м/м 3,4 (1 ур.)'))
                .toMatchObject({
                    parsed: true,
                    address: 'пер.Малый Козихинский, д.7',
                    unitType: 'parking',
                    unitName: '3,4 (1 ур.)',
                    originalInput: 'пер.Малый Козихинский, д.7, м/м 3,4 (1 ур.)',
                })
            expect(resolver.parseAddress('ул.Щорса,103,212'))
                .toMatchObject({
                    parsed: true,
                    address: 'ул.Щорса, 103',
                    unitType: 'flat',
                    unitName: '212',
                    originalInput: 'ул.Щорса,103,212',
                })
        })

        it('returns parsed: true with transformation rules', async () => {
            const resolver = new BillingPropertyResolver()
            resolver.parser = new AddressParser()
            resolver.addressTransformer = new AddressTransform()
            resolver.addressTransformer.init({
                'ул.Революции 1905 года': 'г. Новороссийск, ул.Революции 1905 года',
            })

            expect(resolver.parseAddress('ул.Революции 1905 года, д.37, кв.1001'))
                .toMatchObject({
                    parsed: true,
                    address: 'г. Новороссийск, ул.Революции 1905 года, д.37',
                    unitType: 'flat',
                    unitName: '1001',
                    originalInput: 'г. Новороссийск, ул.Революции 1905 года, д.37, кв.1001',
                })
        })
    })

    describe('BillingPropertyResolver.parseFias tests', () => {
        it('returns parsed: false', async () => {
            expect(resolver.parseFias()).toMatchObject({ parsed: false, isFias: true })
            expect(resolver.parseFias(null)).toMatchObject({ parsed: false, isFias: true })
            expect(resolver.parseFias('')).toMatchObject({ parsed: false, isFias: true })
        })

        it('returns parsed: true no transformation rules', async () => {
            expect(resolver.parseFias('b746e6bd-e02b-4987-bb1c-bb9dd808f909'))
                .toMatchObject({
                    parsed: true,
                    isFias: true,
                    address: 'fiasId:b746e6bd-e02b-4987-bb1c-bb9dd808f909',
                    unitType: 'flat',
                    unitName: '',
                })
            expect(resolver.parseFias('b746e6bd-e02b-4987-bb1c-bb9dd808f909, кв. 1'))
                .toMatchObject({
                    parsed: true,
                    isFias: true,
                    address: 'fiasId:b746e6bd-e02b-4987-bb1c-bb9dd808f909',
                    unitType: 'flat',
                    unitName: '1',
                })
        })
    })

    describe('BillingPropertyResolver.chooseUnitParts tests', () => {
        const getParsedFias = (params = {}) => ({
            parsed: true,
            isFias: true,
            address: 'fiasId:b746e6bd-e02b-4987-bb1c-bb9dd808f909, кладовка 1',
            unitType: 'warehouse',
            unitName: '1',
            ...params,
        })
        const getParsedAddress = (params = {}) => ({
            parsed: true,
            address: 'пер.Малый Козихинский, д.7, парковка 5',
            unitType: 'parking',
            unitName: '5',
            ...params,
        })
        const getNotParsed = (params = {}) => ({ parsed: false, ...params })

        it('fias cases', async () => {
            const chosenByFias = { unitType: 'warehouse', unitName: '1' }

            // address parsed & not provided unitType/unitName
            expect(resolver.chooseUnitParts(
                getParsedFias(),
                getParsedAddress()
            )).toMatchObject(chosenByFias)

            // address not parsed & not provided unitType/unitName
            expect(resolver.chooseUnitParts(
                getParsedFias(),
                getNotParsed()
            )).toMatchObject(chosenByFias)
        })

        it('address cases', async () => {
            const chosenByAddress = { unitType: 'parking', unitName: '5' }

            // fias parsed, but unit type is flat & not provided unitType/unitName
            expect(resolver.chooseUnitParts(
                getParsedFias({ unitType: 'flat', unitName: '5' }),
                getParsedAddress()
            )).toMatchObject(chosenByAddress)

            // fias parsed, but empty unitType & not provided unitType/unitName
            expect(resolver.chooseUnitParts(
                getParsedFias({ unitType: '', unitName: '5' }),
                getParsedAddress()
            )).toMatchObject(chosenByAddress)

            // fias parsed, but empty unitName & not provided unitType/unitName
            expect(resolver.chooseUnitParts(
                getParsedFias({ unitType: '', unitName: '' }),
                getParsedAddress()
            )).toMatchObject(chosenByAddress)

            // fias not parsed & not provided unitType/unitName
            expect(resolver.chooseUnitParts(
                getNotParsed(),
                getParsedAddress()
            )).toMatchObject(chosenByAddress)
        })

        it('provided unit parts cases', async () => {
            const chosenByAddress = { unitType: 'flat', unitName: '6' }

            // fias and address not parsed, but unitType is empty for all
            expect(resolver.chooseUnitParts(
                getParsedFias({ unitType: '', unitName: '5' }),
                getParsedAddress({ unitType: '', unitName: '5' }),
                'flat',
                '6'
            )).toMatchObject(chosenByAddress)

            // fias and address not parsed, but unitName is empty for all
            expect(resolver.chooseUnitParts(
                getParsedFias({ unitType: '', unitName: '' }),
                getParsedAddress({ unitType: '', unitName: '' }),
                'flat',
                '6'
            )).toMatchObject(chosenByAddress)

            // fias and address parsed
            expect(resolver.chooseUnitParts(
                getNotParsed(),
                getNotParsed(),
                'flat',
                '6'
            )).toMatchObject(chosenByAddress)
        })

        it('can not extract unit parts cases', async () => {
            // fias and address parsed, but empty & unit name is not provided
            await catchErrorFrom(async () => {
                resolver.chooseUnitParts(
                    getParsedFias({ unitType: '', unitName: '' }),
                    getParsedAddress({ unitType: '', unitName: '' }),
                    'flat',
                    null
                )
            }, (caught) => {
                expect(caught).toMatchObject({
                    code: 'ADDRESS_NOT_RESOLVED_UNIT_NAME',
                })
            })

            // fias and address not parsed & unit name is not provided
            await catchErrorFrom(async () => {
                resolver.chooseUnitParts(
                    getNotParsed(),
                    getNotParsed(),
                    'flat',
                    null
                )
            }, (caught) => {
                expect(caught).toMatchObject({
                    code: 'ADDRESS_NOT_RESOLVED_UNIT_NAME',
                })
            })

            // fias and address not parsed & unit name is empty
            await catchErrorFrom(async () => {
                resolver.chooseUnitParts(
                    getNotParsed(),
                    getNotParsed(),
                    'flat',
                    ''
                )
            }, (caught) => {
                expect(caught).toMatchObject({
                    code: 'ADDRESS_NOT_RESOLVED_UNIT_NAME',
                })
            })

            // fias and address parsed, but empty & unit name is not provided
            await catchErrorFrom(async () => {
                resolver.chooseUnitParts(
                    getParsedFias({ unitType: '', unitName: '' }),
                    getParsedAddress({ unitType: '', unitName: '' }),
                    null,
                    '6'
                )
            }, (caught) => {
                expect(caught).toMatchObject({
                    code: 'ADDRESS_NOT_RESOLVED_UNIT_TYPE',
                })
            })

            // fias and address not parsed & unit type is not provided
            await catchErrorFrom(async () => {
                resolver.chooseUnitParts(
                    getNotParsed(),
                    getNotParsed(),
                    null,
                    '6'
                )
            }, (caught) => {
                expect(caught).toMatchObject({
                    code: 'ADDRESS_NOT_RESOLVED_UNIT_TYPE',
                })
            })

            // fias and address not parsed & unit type is empty
            await catchErrorFrom(async () => {
                resolver.chooseUnitParts(
                    getNotParsed(),
                    getNotParsed(),
                    '',
                    '6'
                )
            }, (caught) => {
                expect(caught).toMatchObject({
                    code: 'ADDRESS_NOT_RESOLVED_UNIT_TYPE',
                })
            })
        })
    })

    describe('BillingPropertyResolver.getCacheKey tests', () => {
        it('returns cache key', async () => {
            const address = faker.address.streetAddress(true)

            expect(resolver.getCacheKey(address)).toEqual(`${tin}_${address}`)
            expect(resolver.getCacheKey(null)).toBeNull()
            expect(resolver.getCacheKey('')).toBeNull()
            expect(resolver.getCacheKey()).toBeNull()
        })
    })

    describe('BillingPropertyResolver.propagateAddressToCache tests', () => {
        it('empty propagate cases', async () => {
            const resolver = new BillingPropertyResolver()
            const address = faker.address.streetAddress(true)
            resolver.tin = tin
            let addressServiceCallCount = 0
            resolver.addressService = {
                search: async () => {
                    addressServiceCallCount += 1
                    return null
                },
            }
            resolver.addressCache = {}

            // not even call address service
            await resolver.propagateAddressToCache()
            await resolver.propagateAddressToCache(null)
            await resolver.propagateAddressToCache('')
            expect(Object.keys(resolver.addressCache)).toHaveLength(0)
            expect(addressServiceCallCount).toEqual(0)

            // address service returns empty value for a key
            await resolver.propagateAddressToCache(address)
            expect(Object.keys(resolver.addressCache)).toHaveLength(1)
            expect(resolver.addressCache[resolver.getCacheKey(address)]).toBeNull()
            expect(addressServiceCallCount).toEqual(1)

            // prevent to address service search for the same address twice
            await resolver.propagateAddressToCache(address)
            expect(Object.keys(resolver.addressCache)).toHaveLength(1)
            expect(resolver.addressCache[resolver.getCacheKey(address)]).toBeNull()
            expect(addressServiceCallCount).toEqual(1)
        })

        it('propagate for a given address', async () => {
            const tin = organization.tin
            const resolver = new BillingPropertyResolver()
            const address = faker.address.streetAddress(true)
            resolver.tin = tin
            let addressServiceCallCount = 0
            resolver.addressService = {
                search: async (address) => {
                    addressServiceCallCount += 1
                    return { address }
                },
            }
            resolver.addressCache = {}

            // address service returns value for a key
            await resolver.propagateAddressToCache(address)
            expect(Object.keys(resolver.addressCache)).toHaveLength(1)
            expect(resolver.addressCache[resolver.getCacheKey(address)]).toMatchObject({ address })
            expect(addressServiceCallCount).toEqual(1)
        })

        it('propagate for a given address and address sources', async () => {
            const tin = organization.tin
            const resolver = new BillingPropertyResolver()
            const address = faker.address.streetAddress(true)
            const address2 = faker.address.streetAddress(true)
            const addressServiceSearchResult = { address, addressSources: [address, address2] }
            resolver.tin = tin
            let addressServiceCallCount = 0
            resolver.addressService = {
                search: async (address) => {
                    addressServiceCallCount += 1
                    return addressServiceSearchResult
                },
            }
            resolver.addressCache = {}

            // address service returns value for a key
            await resolver.propagateAddressToCache(address)
            expect(Object.keys(resolver.addressCache)).toHaveLength(2)
            expect(resolver.addressCache[resolver.getCacheKey(address)]).toMatchObject(addressServiceSearchResult)
            expect(resolver.addressCache[resolver.getCacheKey(address2)]).toMatchObject(addressServiceSearchResult)
            expect(addressServiceCallCount).toEqual(1)
        })
    })

    describe('BillingPropertyResolver.getAddressConditionValues tests', () => {
        it('Cached address with all meta', async () => {
            const tin = organization.tin
            const resolver = new BillingPropertyResolver()
            const address = faker.address.streetAddress(true)
            const normalizedAddress = faker.address.streetAddress(true)
            const addressKey = faker.datatype.uuid()
            const fias = faker.datatype.uuid()
            resolver.tin = tin
            resolver.addressCache = {
                [resolver.getCacheKey(address)]: {
                    address: normalizedAddress,
                    addressKey,
                    addressMeta: { data: { house_fias_id: fias } },
                },
            }

            // act & assert
            expect(resolver.getAddressConditionValues({ parsed: true, address })).toMatchObject({
                address: normalizedAddress,
                addressKey,
                normalizedAddress,
                fias,
            })
        })

        it('Cached fias with all meta', async () => {
            const tin = organization.tin
            const resolver = new BillingPropertyResolver()
            const normalizedAddress = faker.address.streetAddress(true)
            const addressKey = faker.datatype.uuid()
            const fias = faker.datatype.uuid()
            const fiasAddress = 'fiasId:' + fias
            resolver.tin = tin
            resolver.addressCache = {
                [resolver.getCacheKey(fiasAddress)]: {
                    address: normalizedAddress,
                    addressKey,
                    addressMeta: { data: { house_fias_id: fias } },
                },
            }

            // act & assert
            expect(resolver.getAddressConditionValues({
                parsed: true,
                isFias: true,
                address: fiasAddress,
            })).toMatchObject({
                address: null,
                addressKey,
                normalizedAddress,
                fias,
            })
        })

        it('Cached address without fias', async () => {
            const tin = organization.tin
            const resolver = new BillingPropertyResolver()
            const address = faker.address.streetAddress(true)
            const normalizedAddress = faker.address.streetAddress(true)
            const addressKey = faker.datatype.uuid()
            resolver.tin = tin
            resolver.addressCache = {
                [resolver.getCacheKey(address)]: { address: normalizedAddress, addressKey, addressMeta: { data: {} } },
            }

            // act & assert
            expect(resolver.getAddressConditionValues({ address })).toMatchObject({
                address: normalizedAddress,
                addressKey,
                normalizedAddress,
            })
        })

        it('Cached original input', async () => {
            const tin = organization.tin
            const resolver = new BillingPropertyResolver()
            const address = faker.address.streetAddress(true)
            const originalInput = faker.address.streetAddress(true)
            const addressKey = faker.datatype.uuid()
            resolver.tin = tin
            resolver.addressCache = {
                [resolver.getCacheKey(originalInput)]: { address: originalInput, addressKey, addressMeta: { data: {} } },
            }

            // act & assert
            expect(resolver.getAddressConditionValues({
                address, originalInput,
            })).toMatchObject({
                address: originalInput,
                addressKey,
                normalizedAddress: originalInput,
                originalInput,
            })
        })

        it('Not cached fias', async () => {
            const tin = organization.tin
            const resolver = new BillingPropertyResolver()
            const fias = faker.datatype.uuid()
            resolver.tin = tin
            resolver.addressCache = {}

            // act & assert
            expect(resolver.getAddressConditionValues({
                parsed: true,
                isFias: true,
                address: `fiasId:${fias}`,
            })).toMatchObject({
                fias,
            })
        })

        it('Not cached address', async () => {
            const tin = organization.tin
            const resolver = new BillingPropertyResolver()
            resolver.tin = tin
            resolver.addressCache = {}
            const address = faker.address.streetAddress(true)

            // act & assert
            expect(resolver.getAddressConditionValues({ parsed: true, address })).toMatchObject({
                address,
            })
        })
    })

    describe('BillingPropertyResolver.searchBillingProperty tests', () => {

        it('Address with all meta', async () => {
            const { property, billingProperty } = properties[0]
            const address = property.address
            const normalizedAddress = property.address
            const addressKey = property.addressKey
            const fias = property.addressMeta.data.house_fias_id

            const conditions = {
                address,
                addressKey,
                normalizedAddress,
                fias,
            }

            const foundProperty = await resolver.searchBillingProperty(conditions)
            expect(foundProperty).toBeDefined()
            expect(foundProperty).toHaveProperty('id', billingProperty.id)
        })

        it('Address with all meta except normalizedAddress', async () => {
            const { property, billingProperty } = properties[0]
            const address = property.address
            const addressKey = property.addressKey
            const fias = property.addressMeta.data.house_fias_id

            const conditions = {
                address,
                addressKey,
                fias,
            }

            const foundProperty = await resolver.searchBillingProperty(conditions)
            expect(foundProperty).toBeDefined()
            expect(foundProperty).toHaveProperty('id', billingProperty.id)
        })

        it('Address with all meta except address', async () => {
            const { property, billingProperty } = properties[0]
            const normalizedAddress = property.address
            const addressKey = property.addressKey
            const fias = property.addressMeta.data.house_fias_id

            const conditions = {
                normalizedAddress,
                addressKey,
                fias,
            }

            const foundProperty = await resolver.searchBillingProperty(conditions)
            expect(foundProperty).toBeDefined()
            expect(foundProperty).toHaveProperty('id', billingProperty.id)
        })

        it('Address with all meta except addresses', async () => {
            const { property, billingProperty } = properties[0]
            const addressKey = property.addressKey
            const fias = property.addressMeta.data.house_fias_id

            const conditions = {
                addressKey,
                fias,
            }

            const foundProperty = await resolver.searchBillingProperty(conditions)
            expect(foundProperty).toBeDefined()
            expect(foundProperty).toHaveProperty('id', billingProperty.id)
        })

        it('Address with all meta except addressKey', async () => {
            const { property, billingProperty } = properties[0]
            const address = property.address
            const normalizedAddress = property.address
            const fias = property.addressMeta.data.house_fias_id

            const conditions = {
                address,
                normalizedAddress,
                fias,
            }

            const foundProperty = await resolver.searchBillingProperty(conditions)
            expect(foundProperty).toBeDefined()
            expect(foundProperty).toHaveProperty('id', billingProperty.id)
        })

        it('Address with all meta except addressKey, address', async () => {
            const { property, billingProperty } = properties[0]
            const normalizedAddress = property.address
            const fias = billingProperty.globalId

            const conditions = {
                normalizedAddress,
                fias,
            }

            const foundProperty = await resolver.searchBillingProperty(conditions)
            expect(foundProperty).toBeDefined()
            expect(foundProperty).toHaveProperty('id', billingProperty.id)
        })

        it('Address with all meta except addressKey, normalizedAddress', async () => {
            const { property, billingProperty } = properties[0]
            const address = property.address
            const fias = property.addressMeta.data.house_fias_id

            const conditions = {
                address,
                fias,
            }

            const foundProperty = await resolver.searchBillingProperty(conditions)
            expect(foundProperty).toBeDefined()
            expect(foundProperty).toHaveProperty('id', billingProperty.id)
        })

        it('Only addresses', async () => {
            const { property, billingProperty } = properties[0]
            const address = property.address
            const normalizedAddress = property.address

            const conditions = {
                address,
                normalizedAddress,
            }

            const foundProperty = await resolver.searchBillingProperty(conditions)
            expect(foundProperty).toBeDefined()
            expect(foundProperty).toHaveProperty('id', billingProperty.id)
        })

        it('Only address', async () => {
            const { property, billingProperty } = properties[0]
            const address = property.address

            const conditions = {
                address,
            }

            const foundProperty = await resolver.searchBillingProperty(conditions)
            expect(foundProperty).toBeDefined()
            expect(foundProperty).toHaveProperty('id', billingProperty.id)
        })

        it('Only normalizedAddress', async () => {
            const { property, billingProperty } = properties[0]
            const normalizedAddress = property.address

            const conditions = {
                normalizedAddress,
            }

            const foundProperty = await resolver.searchBillingProperty(conditions)
            expect(foundProperty).toBeDefined()
            expect(foundProperty).toHaveProperty('id', billingProperty.id)
        })

        it('Only fias', async () => {
            const { property, billingProperty } = properties[0]
            const fias = property.addressMeta.data.house_fias_id

            const conditions = {
                fias,
            }

            const foundProperty = await resolver.searchBillingProperty(conditions)
            expect(foundProperty).toBeDefined()
            expect(foundProperty).toHaveProperty('id', billingProperty.id)
        })

        it('Not found', async () => {
            const conditions = {
                fias: faker.datatype.uuid(),
            }

            const foundProperty = await resolver.searchBillingProperty(conditions)
            expect(foundProperty).toBeNull()
        })
    })

    describe('BillingPropertyResolver.isPropertyRegistrationInOrganization tests', () => {
        it('registered case', async () => {
            expect(
                await resolver.isPropertyRegistrationInOrganization(properties[0].billingProperty)
            ).toBeTruthy()
        })

        it('registered: another billing context case', async () => {
            const { billingProperty } = properties[1]
            const registered = await resolver.isPropertyRegistrationInOrganization(billingProperty)
            expect(registered).toBeTruthy()
        })

        it('not registered cases', async () => {
            expect(
                await resolver.isPropertyRegistrationInOrganization({ property: { id: faker.datatype.uuid() } })
            ).not.toBeTruthy()
            expect(
                await resolver.isPropertyRegistrationInOrganization({ property: { id: null } })
            ).not.toBeTruthy()
            expect(
                await resolver.isPropertyRegistrationInOrganization({ property: null })
            ).not.toBeTruthy()
            expect(
                await resolver.isPropertyRegistrationInOrganization({})
            ).not.toBeTruthy()
            expect(
                await resolver.isPropertyRegistrationInOrganization(null)
            ).not.toBeTruthy()
        })
    })

    describe('BillingPropertyResolver.getSearchSummary tests', () => {
        it('regular case', async () => {
            const tin = organization.tin
            const resolver = new BillingPropertyResolver()

            // properties mock
            const { billingProperty, property } = properties[0]
            resolver.searchBillingProperty = async () => (billingProperty)

            const { address, normalizedAddress, addressKey, globalId: fias } = billingProperty
            await resolver.init(
                adminContext,
                billingIntegrationContext.id,
                {},
            )
            resolver.addressCache = {
                [resolver.getCacheKey(address)]: {
                    address: normalizedAddress,
                    addressKey,
                    addressMeta: { data: { house_fias_id: fias } },
                },
            }

            const result = await resolver.getSearchSummary({ address })
            expect(result).toMatchObject({
                address,
                addressKey,
                normalizedAddress,
                fias,
                billingProperty,
                registeredInOrg: true,
            })
        })
    })

    describe('BillingPropertyResolver.getOrganizationBillingPropertySuggestion tests', () => {
        it('Null cases', async () => {
            expect(await resolver.getOrganizationBillingPropertySuggestion('')).toBeNull()
            expect(await resolver.getOrganizationBillingPropertySuggestion(null)).toBeNull()
            expect(await resolver.getOrganizationBillingPropertySuggestion(undefined)).toBeNull()
            expect(await resolver.getOrganizationBillingPropertySuggestion()).toBeNull()
        })

        it('Address has a little difference', async () => {
            const { property, billingProperty } = properties[0]
            const address = property.address + ' a'

            const { property: foundProperty, score } = await resolver.getOrganizationBillingPropertySuggestion(address)
            expect(foundProperty).toBeDefined()
            expect(foundProperty).toHaveProperty('id', billingProperty.id)
            expect(score).toBeDefined()
        })

        it('Address has too much difference', async () => {
            const { property } = properties[0]
            const address = property.address + property.address

            const result = await resolver.getOrganizationBillingPropertySuggestion(address)
            expect(result).not.toBeDefined()
        })

        it('Organization property exists but billing property are missing', async () => {
            const address = noPairProperty.address

            const { property: foundProperty, score } = await resolver.getOrganizationBillingPropertySuggestion(address)
            expect(foundProperty).not.toBeDefined()
            expect(score).toBeDefined()
        })
    })

    describe('BillingPropertyResolver.createBillingProperty tests', () => {
        it('Regular case', async () => {
            const originalInput = faker.address.streetAddress(true)
            const address = faker.address.streetAddress(true)
            const normalizedAddress = faker.address.streetAddress(true)
            const fias = faker.datatype.uuid()

            await resolver.propagateAddressToCache(address)
            await resolver.propagateAddressToCache(normalizedAddress)

            const fiasSummary = { fias }
            const addressSummary = { normalizedAddress, address, originalInput }
            const integrationMeta = { fias, integrationSpecificKey: faker.datatype.uuid() }

            const newProperty = await resolver.createBillingProperty(fiasSummary, addressSummary, integrationMeta)

            expect(newProperty).toBeDefined()
            expect(newProperty).toMatchObject({
                globalId: fias,
                address: normalizedAddress,
                importId: normalizedAddress,
                meta: { dv: 1, ...integrationMeta },
                context: { id: billingIntegrationContext.id },
            })
        })

        it('No normalizedAddress case', async () => {
            const originalInput = faker.address.streetAddress(true)
            const address = faker.address.streetAddress(true)
            const fias = faker.datatype.uuid()

            await resolver.propagateAddressToCache(address)

            const fiasSummary = { fias }
            const addressSummary = { address, originalInput }
            const integrationMeta = { fias, integrationSpecificKey: faker.datatype.uuid() }

            const newProperty = await resolver.createBillingProperty(fiasSummary, addressSummary, integrationMeta)

            expect(newProperty).toBeDefined()
            expect(newProperty).toMatchObject({
                globalId: fias,
                address,
                importId: address,
                meta: { dv: 1, ...integrationMeta },
                context: { id: billingIntegrationContext.id },
            })
        })

        it('No address case', async () => {
            const originalInput = faker.address.streetAddress(true)
            const normalizedAddress = faker.address.streetAddress(true)
            const fias = faker.datatype.uuid()

            await resolver.propagateAddressToCache(normalizedAddress)

            const fiasSummary = { fias }
            const addressSummary = { normalizedAddress, originalInput }
            const integrationMeta = { fias, integrationSpecificKey: faker.datatype.uuid() }

            const newProperty = await resolver.createBillingProperty(fiasSummary, addressSummary, integrationMeta)

            expect(newProperty).toBeDefined()
            expect(newProperty).toMatchObject({
                globalId: fias,
                address: normalizedAddress,
                importId: normalizedAddress,
                meta: { dv: 1, ...integrationMeta },
                context: { id: billingIntegrationContext.id },
            })
        })

        it('Original input has high priority', async () => {
            const originalInput = faker.address.streetAddress(true)
            const normalizedAddress = faker.address.streetAddress(true)
            const address = faker.address.streetAddress(true)
            const fias = faker.datatype.uuid()

            await resolver.propagateAddressToCache(address)
            await resolver.propagateAddressToCache(normalizedAddress)
            await resolver.propagateAddressToCache(originalInput)

            const fiasSummary = { fias }
            const addressSummary = { address, normalizedAddress, originalInput }
            const integrationMeta = { fias, integrationSpecificKey: faker.datatype.uuid() }

            const newProperty = await resolver.createBillingProperty(fiasSummary, addressSummary, integrationMeta)

            expect(newProperty).toBeDefined()
            expect(newProperty).toMatchObject({
                globalId: fias,
                address: originalInput,
                importId: normalizedAddress,
                meta: { dv: 1, ...integrationMeta },
                context: { id: billingIntegrationContext.id },
            })
        })

        it('No cached items fallback to original input', async () => {
            const originalInput = faker.address.streetAddress(true)
            const normalizedAddress = faker.address.streetAddress(true)
            const address = faker.address.streetAddress(true)
            const fias = faker.datatype.uuid()

            const fiasSummary = { fias }
            const addressSummary = { address, normalizedAddress, originalInput }
            const integrationMeta = { fias, integrationSpecificKey: faker.datatype.uuid() }

            const newProperty = await resolver.createBillingProperty(fiasSummary, addressSummary, integrationMeta)

            expect(newProperty).toBeDefined()
            expect(newProperty).toMatchObject({
                globalId: fias,
                address: originalInput,
                importId: normalizedAddress,
                meta: { dv: 1, ...integrationMeta },
                context: { id: billingIntegrationContext.id },
            })
        })
    })

    describe('BillingPropertyResolver.getResolveFlowParams tests', () => {
        it('Regular case', async () => {
            const params = await resolver.getResolveFlowParams()

            expect(params).toBeDefined()
            expect(params).toMatchObject({
                resolveOnlyByOrganizationProperties: false,
            })
        })

        it('Has configured extra settings for property resolve flow', async () => {
            const resolver = new BillingPropertyResolver()
            const {
                context,
                organization,
            } = await makeContextWithOrganizationAndIntegrationAsAdmin(
                {}, {}, {
                    settings: { dv: 1, billingPropertyResolver: { resolveOnlyByOrganizationProperties: true } },
                }
            )

            // constant
            const tin = organization.tin
            const billingIntegrationOrganizationContextId = context.id

            await resolver.init(
                adminContext,
                billingIntegrationOrganizationContextId,
                {},
            )

            const params = await resolver.getResolveFlowParams()

            expect(params).toBeDefined()
            expect(params).toMatchObject({
                resolveOnlyByOrganizationProperties: true,
            })
        })
    })

    describe('BillingPropertyResolver.resolveByOrganizationProperties tests', () => {
        it('Address is null case', async () => {
            const { property, billingProperty } = properties[0]
            const address = null
            const normalizedAddress = property.address
            const originalInput = property.address + ' кв. 1'

            const result = await resolver.resolveByOrganizationProperties({
                address, normalizedAddress, originalInput,
            })
            expect(result).toBeDefined()
            expect(result).toHaveProperty('id', billingProperty.id)
        })

        it('NormalizedAddress is null case', async () => {
            const { property, billingProperty } = properties[0]
            const address = property.address
            const normalizedAddress = null
            const originalInput = property.address + ' кв. 1'

            const result = await resolver.resolveByOrganizationProperties({
                address, normalizedAddress, originalInput,
            })
            expect(result).toBeDefined()
            expect(result).toHaveProperty('id', billingProperty.id)
        })

        it('OriginalInput is null case', async () => {
            const { property, billingProperty } = properties[0]
            const address = property.address
            const normalizedAddress = property.address
            const originalInput = null

            const result = await resolver.resolveByOrganizationProperties({
                address, normalizedAddress, originalInput,
            })
            expect(result).toBeDefined()
            expect(result).toHaveProperty('id', billingProperty.id)
        })

        it('All address is null case', async () => {
            const address = null
            const normalizedAddress = null
            const originalInput = null

            await catchErrorFrom(async () => {
                await resolver.resolveByOrganizationProperties({
                    address, normalizedAddress, originalInput,
                })
            }, (caught) => {
                expect(caught).toMatchObject({
                    code: 'ADDRESS_NOT_RECOGNIZED_VALUE',
                })
            })
        })

        it('OriginalInput without unit parts', async () => {
            const { property, billingProperty } = properties[0]
            const address = faker.address.streetAddress(false)
            const normalizedAddress = faker.address.streetAddress(false)
            const originalInput = property.address

            const result = await resolver.resolveByOrganizationProperties({
                address, normalizedAddress, originalInput,
            })
            expect(result).toBeDefined()
            expect(result).toHaveProperty('id', billingProperty.id)
        })
    })

    describe('BillingPropertyResolver.resolve tests', () => {
        let generateFullAddress

        beforeAll(async () => {
            generateFullAddress = (address, unitType = 'flat', unitTypeHumanReadable = 'кв.', unitName = '1') => {
                const street = isNil(address) ? faker.address.streetAddress(false) : address
                return {
                    unitType,
                    unitTypeHumanReadable,
                    unitName,
                    address: `${street}, ${unitTypeHumanReadable} ${unitName}`,
                }
            }
        })

        describe('No transform rules, addressService returns nothing', () => {
            let resolver

            beforeAll(async () => {
                resolver = await getResolver()
            })

            it('Resolve by fias case', async () => {
                const { property, billingProperty } = properties[0]
                const { unitType, unitName, address } = generateFullAddress()
                const fias = property.addressMeta.data.house_fias_id

                const resolved = await resolver.resolve(address, { fias }, unitType, unitName)
                expect(resolved).toBeDefined()
                expect(resolved).toHaveProperty('billingProperty.id', billingProperty.id)
                expect(resolved).toHaveProperty('unitType', unitType)
                expect(resolved).toHaveProperty('unitName', unitName)
            })

            it('Resolve by fias with all unit name case', async () => {
                const { property, billingProperty } = properties[0]
                const { unitType, unitName, address } = generateFullAddress()
                const fias = `${property.addressMeta.data.house_fias_id}, ${unitName}`

                const resolved = await resolver.resolve(address, { fias }, unitType, unitName)
                expect(resolved).toBeDefined()
                expect(resolved).toHaveProperty('billingProperty.id', billingProperty.id)
                expect(resolved).toHaveProperty('unitType', unitType)
                expect(resolved).toHaveProperty('unitName', unitName)
            })

            it('Resolve by fias with all unit parts case', async () => {
                const { property, billingProperty } = properties[0]
                const { unitType, unitTypeHumanReadable, unitName, address } = generateFullAddress()
                const fias = `${property.addressMeta.data.house_fias_id}, ${unitTypeHumanReadable} ${unitName}`

                const resolved = await resolver.resolve(address, { fias }, unitType, unitName)
                expect(resolved).toBeDefined()
                expect(resolved).toHaveProperty('billingProperty.id', billingProperty.id)
                expect(resolved).toHaveProperty('unitType', unitType)
                expect(resolved).toHaveProperty('unitName', unitName)
            })

            it('Resolve by address case', async () => {
                const { property, billingProperty } = properties[0]
                const { unitType, unitName, address } = generateFullAddress(property.address)

                const resolved = await resolver.resolve(address, {}, unitType, unitName)
                expect(resolved).toBeDefined()
                expect(resolved).toHaveProperty('billingProperty.id', billingProperty.id)
                expect(resolved).toHaveProperty('unitType', unitType)
                expect(resolved).toHaveProperty('unitName', unitName)
            })

            it('Resolve by original input case', async () => {
                const { property, billingProperty } = properties[0]
                const { unitType, unitName } = generateFullAddress(property.address)

                const resolved = await resolver.resolve(property.address, {}, unitType, unitName)
                expect(resolved).toBeDefined()
                expect(resolved).toHaveProperty('billingProperty.id', billingProperty.id)
                expect(resolved).toHaveProperty('unitType', unitType)
                expect(resolved).toHaveProperty('unitName', unitName)
            })

            it('Resolve by fias in another org case', async () => {
                const {
                    admin,
                    context: billingIntegrationContext,
                    organization,
                } = await makeContextWithOrganizationAndIntegrationAsAdmin()

                const resolver = await getResolver(
                    {}, async () => null, organization, billingIntegrationContext,
                )

                const {
                    property,
                    billingProperty,
                } = await createTestPropertyPair(admin, billingIntegrationContext, organization)

                const { unitType, unitName, address } = generateFullAddress()
                const fias = property.addressMeta.data.house_fias_id

                const resolved = await resolver.resolve(address, { fias }, unitType, unitName)
                expect(resolved).toBeDefined()
                expect(resolved).toHaveProperty('billingProperty.id', billingProperty.id)
                expect(resolved).toHaveProperty('unitType', unitType)
                expect(resolved).toHaveProperty('unitName', unitName)
            })

            it('Resolve by address in another org case', async () => {
                const {
                    admin,
                    context: billingIntegrationContext,
                    organization,
                } = await makeContextWithOrganizationAndIntegrationAsAdmin()

                const resolver = await getResolver(
                    {}, async () => null, organization, billingIntegrationContext,
                )

                const {
                    property,
                    billingProperty,
                } = await createTestPropertyPair(admin, billingIntegrationContext, organization)
                const { unitType, unitName, address } = generateFullAddress(property.address)

                const resolved = await resolver.resolve(address, {}, unitType, unitName)
                expect(resolved).toBeDefined()
                expect(resolved).toHaveProperty('billingProperty.id', billingProperty.id)
                expect(resolved).toHaveProperty('unitType', unitType)
                expect(resolved).toHaveProperty('unitName', unitName)
            })

            it('Not found case', async () => {
                const { unitType, unitName, address } = generateFullAddress()
                const fias = faker.datatype.uuid()

                const resolved = await resolver.resolve(address, { fias }, unitType, unitName)
                expect(resolved).toBeDefined()
                expect(resolved).toHaveProperty('billingProperty.id')
                expect(resolved).toHaveProperty('billingProperty.globalId', fias)
                expect(resolved).toHaveProperty('unitType', unitType)
                expect(resolved).toHaveProperty('unitName', unitName)
            })

            it('Resolve by params: resolveOnlyByOrganizationProperties', async () => {
                const {
                    context: billingIntegrationContext,
                    organization,
                } = await makeContextWithOrganizationAndIntegrationAsAdmin(
                    {}, {}, {
                        settings: { dv: 1, billingPropertyResolver: { resolveOnlyByOrganizationProperties: true } },
                    }
                )

                const resolver = await getResolver(
                    {}, async () => null, organization, billingIntegrationContext,
                )

                // create properties
                const properties = [
                    await createTestPropertyPair(admin, billingIntegrationContext, organization),
                    await createTestPropertyPair(admin, billingIntegrationContext, organization),
                    await createTestPropertyPair(admin, billingIntegrationContext, organization),
                ]

                const { property, billingProperty } = properties[2]
                const { unitType, unitName, address: fullAddress } = generateFullAddress(property.address)

                // search address a little different that an original address
                const address = fullAddress + ' a big difference in stored address and provided one'

                const resolved = await resolver.resolve(address, {}, unitType, unitName)
                expect(resolved).toBeDefined()
                expect(resolved).toHaveProperty('billingProperty.id', billingProperty.id)
                expect(resolved).toHaveProperty('unitType', unitType)
                expect(resolved).toHaveProperty('unitName', unitName)
            })

            it('Resolve by params: resolveOnlyByOrganizationProperties and original input has no unit parts', async () => {
                const {
                    context: billingIntegrationContext,
                    organization,
                } = await makeContextWithOrganizationAndIntegrationAsAdmin(
                    {}, {}, {
                        settings: { dv: 1, billingPropertyResolver: { resolveOnlyByOrganizationProperties: true } },
                    }
                )

                const resolver = await getResolver(
                    {}, async () => null, organization, billingIntegrationContext,
                )

                // create properties
                const properties = [
                    await createTestPropertyPair(admin, billingIntegrationContext, organization),
                    await createTestPropertyPair(admin, billingIntegrationContext, organization),
                    await createTestPropertyPair(admin, billingIntegrationContext, organization),
                ]

                const { property, billingProperty } = properties[2]
                const { unitType, unitName } = generateFullAddress(property.address)

                const resolved = await resolver.resolve(property.address, {}, unitType, unitName)
                expect(resolved).toBeDefined()
                expect(resolved).toHaveProperty('billingProperty.id', billingProperty.id)
                expect(resolved).toHaveProperty('unitType', unitType)
                expect(resolved).toHaveProperty('unitName', unitName)
            })
        })

        describe('Replace transform rules, addressService returns nothing', () => {
            let resolver, prefix = 'Integration specific address prefix:'

            beforeAll(async () => {
                resolver = await getResolver({
                    [prefix]: '',
                })
            })

            it('Resolve by address case', async () => {
                const { property, billingProperty } = properties[0]
                const { unitType, unitName, address } = generateFullAddress(property.address)

                const inputAddress = prefix + address
                const resolved = await resolver.resolve(inputAddress, {}, unitType, unitName)
                expect(resolved).toBeDefined()
                expect(resolved).toHaveProperty('billingProperty.id', billingProperty.id)
                expect(resolved).toHaveProperty('unitType', unitType)
                expect(resolved).toHaveProperty('unitName', unitName)
            })
        })

        describe('RegExp transform rules, addressService returns nothing', () => {
            let resolver, prefix = '4'

            beforeAll(async () => {
                resolver = await getResolver({
                    ['r^\\d(.*?)$']: '$1',
                })
            })

            it('Resolve by address case', async () => {
                const { property, billingProperty } = properties[0]
                const { unitType, unitName, address } = generateFullAddress(property.address)

                const inputAddress = prefix + address
                const resolved = await resolver.resolve(inputAddress, {}, unitType, unitName)
                expect(resolved).toBeDefined()
                expect(resolved).toHaveProperty('billingProperty.id', billingProperty.id)
                expect(resolved).toHaveProperty('unitType', unitType)
                expect(resolved).toHaveProperty('unitName', unitName)
            })
        })

        describe('No transform rules, addressService returns data', () => {
            it('Resolve by fias case', async () => {
                const { property, billingProperty } = properties[0]
                const { unitType, unitName, address } = generateFullAddress()
                const fias = property.addressMeta.data.house_fias_id

                const resolver = await getResolver({}, async (value) => ({
                    addressSources: [address, `fiasId:${fias}`],
                    addressKey: property.addressKey,
                    address,
                    addressMeta: { data: { house_fias_id: fias } },
                }))
                const resolved = await resolver.resolve(address, { fias }, unitType, unitName)
                expect(resolved).toBeDefined()
                expect(resolved).toHaveProperty('billingProperty.id', billingProperty.id)
                expect(resolved).toHaveProperty('unitType', unitType)
                expect(resolved).toHaveProperty('unitName', unitName)
                expect(Object.keys(resolver.addressCache)).toHaveLength(3)
            })

            it('Resolve by address case', async () => {
                const { property, billingProperty } = properties[0]
                const { unitType, unitName, address } = generateFullAddress(property.address)

                const resolver = await getResolver({}, async () => ({
                    addressSources: [address],
                    addressKey: property.addressKey,
                    address,
                    addressMeta: { data: { } },
                }))
                const resolved = await resolver.resolve(address, {}, unitType, unitName)
                expect(resolved).toBeDefined()
                expect(resolved).toHaveProperty('billingProperty.id', billingProperty.id)
                expect(resolved).toHaveProperty('unitType', unitType)
                expect(resolved).toHaveProperty('unitName', unitName)
            })

            it('Resolve by normalized address case', async () => {
                const { property, billingProperty } = properties[0]
                const { unitType, unitName, address } = generateFullAddress(property.address)

                const resolver = await getResolver({}, async () => ({
                    addressSources: [address],
                    addressKey: property.addressKey,
                    address,
                    addressMeta: { data: { } },
                }))
                const notNormalizedAddress = '343453, ' + property.address
                const resolved = await resolver.resolve(notNormalizedAddress, {}, unitType, unitName)
                expect(resolved).toBeDefined()
                expect(resolved).toHaveProperty('billingProperty.id', billingProperty.id)
                expect(resolved).toHaveProperty('unitType', unitType)
                expect(resolved).toHaveProperty('unitName', unitName)
            })
        })

        describe('Real life regular flow cases', () => {
            describe('Regular flow cases', () => {
                it('Regular case: both org and billing properties are exists', async () => {
                    const resolver = await getResolver()
                    const address = 'ул.Колотилова, д.80'
                    const providedAddress = address + ', кв.4'
                    const providedUnitType = 'flat'
                    const providedUnitName = '4'
                    const [caseProperty] = await createTestProperty(admin, organization, {
                        address,
                    })
                    const [caseBillingProperty] = await createTestBillingProperty(admin, billingIntegrationContext, {
                        address,
                    })
                    resolver.addressService.search = async (s) => address

                    const resolved = await resolver.resolve(providedAddress, {}, providedUnitType, providedUnitName)
                    expect(resolved).toBeDefined()
                    expect(resolved).toHaveProperty('billingProperty.id', caseBillingProperty.id)
                    expect(resolved).toHaveProperty('unitType', providedUnitType)
                    expect(resolved).toHaveProperty('unitName', providedUnitName)
                })

                it('Regular case: billing property are exists', async () => {
                    const resolver = await getResolver()
                    const address = 'ул.Колотилова, д.81'
                    const providedAddress = address + ', кв.4'
                    const providedUnitType = 'flat'
                    const providedUnitName = '4'

                    const [caseBillingProperty] = await createTestBillingProperty(admin, billingIntegrationContext, {
                        address,
                    })
                    resolver.addressService.search = async (s) => address

                    const resolved = await resolver.resolve(providedAddress, {}, providedUnitType, providedUnitName)
                    expect(resolved).toBeDefined()
                    expect(resolved).toHaveProperty('billingProperty.id', caseBillingProperty.id)
                    expect(resolved).toHaveProperty('unitType', providedUnitType)
                    expect(resolved).toHaveProperty('unitName', providedUnitName)
                })

                it('Regular case: no property are exists', async () => {
                    const resolver = await getResolver()
                    const address = 'ул.Колотилова, д.82'
                    const providedAddress = address + ', кв.4'
                    const providedUnitType = 'flat'
                    const providedUnitName = '4'

                    resolver.addressService.search = async (s) => address

                    const resolved = await resolver.resolve(providedAddress, {}, providedUnitType, providedUnitName)
                    expect(resolved).toBeDefined()
                    expect(resolved).toHaveProperty('billingProperty.id')
                    expect(resolved).toHaveProperty('unitType', providedUnitType)
                    expect(resolved).toHaveProperty('unitName', providedUnitName)
                })

                it('Regular case: no property are exists and no address service response', async () => {
                    const resolver = await getResolver()
                    const address = 'ул.Колотилова, д.83'
                    const providedAddress = address + ', кв.4'
                    const providedUnitType = 'flat'
                    const providedUnitName = '4'

                    resolver.addressService.search = async (s) => null

                    const resolved = await resolver.resolve(providedAddress, {}, providedUnitType, providedUnitName)
                    expect(resolved).toBeDefined()
                    expect(resolved).toHaveProperty('billingProperty.id')
                    expect(resolved).toHaveProperty('unitType', providedUnitType)
                    expect(resolved).toHaveProperty('unitName', providedUnitName)
                })
            })

            describe('ResolveOnlyByOrganizationProperties + addressTransform cases', () => {
                let resolver, billingIntegrationContext, organization

                beforeAll(async () => {
                    const {
                        context: billingContext,
                        organization: org,
                    } = await makeContextWithOrganizationAndIntegrationAsAdmin(
                        {}, {}, {
                            settings: {
                                dv: 1,
                                billingPropertyResolver: { resolveOnlyByOrganizationProperties: true },
                                addressTransform: {
                                    'r^(.*,)\\s*$': '$1 кв. 1',
                                },
                            },
                        }
                    )
                    organization = org
                    billingIntegrationContext = billingContext

                    resolver = await getResolver(
                        {}, async () => null, organization, billingIntegrationContext,
                    )
                })

                it('Provided address has comma at the end', async () => {
                    const address = 'ул.Михаила Дорохова, д.135'
                    const providedAddress = address + ',     '
                    const providedUnitType = 'flat'
                    const providedUnitName = ''
                    const [caseProperty] = await createTestProperty(admin, organization, {
                        address,
                    })
                    const [caseBillingProperty] = await createTestBillingProperty(admin, billingIntegrationContext, {
                        address,
                    })

                    const resolved = await resolver.resolve(providedAddress, {}, providedUnitType, providedUnitName)
                    expect(resolved).toBeDefined()
                    expect(resolved).toHaveProperty('billingProperty.id', caseBillingProperty.id)
                    expect(resolved).toHaveProperty('unitType', providedUnitType)
                    expect(resolved).toHaveProperty('unitName', '1')
                })

                it('Provided regular address', async () => {
                    const address = 'ул.Михаила Дорохова, д.136'
                    const providedAddress = address + ', мм.5'
                    const providedUnitType = 'parking'
                    const providedUnitName = '5'
                    const [caseProperty] = await createTestProperty(admin, organization, {
                        address,
                    })
                    const [caseBillingProperty] = await createTestBillingProperty(admin, billingIntegrationContext, {
                        address,
                    })

                    const resolved = await resolver.resolve(providedAddress, {}, providedUnitType, providedUnitName)
                    expect(resolved).toBeDefined()
                    expect(resolved).toHaveProperty('billingProperty.id', caseBillingProperty.id)
                    expect(resolved).toHaveProperty('unitType', providedUnitType)
                    expect(resolved).toHaveProperty('unitName', providedUnitName)
                })
            })
        })
    })
})