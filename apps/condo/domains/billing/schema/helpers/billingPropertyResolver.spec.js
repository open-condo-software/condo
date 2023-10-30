const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')
const { get, isNil, isEmpty } = require('lodash')

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
        tin,
        properties,
        noPairProperty

    beforeAll(async () => {
        tin = '12345789'
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
            tin,
            organization.id,
            billingContext.id,
            {},
        )

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
            const {
                admin,
                context,
                organization,
            } = await makeContextWithOrganizationAndIntegrationAsAdmin()

            // constant
            const tin = '12345789'
            const organizationId = organization.id
            const billingIntegrationOrganizationContextId = context.id
            const addressTransformRules = { one: 'rule' }
            const properties = [
                await createTestPropertyPair(admin, billingIntegrationContext, organization),
            ]

            await resolver.init(
                adminContext,
                tin,
                organizationId,
                billingIntegrationOrganizationContextId,
                addressTransformRules,
            )

            expect(resolver).toMatchObject({
                tin, organizationId, billingIntegrationOrganizationContextId,
            })

            expect(resolver).toHaveProperty('context')
            expect(resolver).toHaveProperty('addressService')
            expect(resolver).toHaveProperty('addressTransformer')
            expect(resolver.addressTransformer.replaces).toMatchObject(addressTransformRules)
            expect(resolver).toHaveProperty('parser')
            expect(resolver).toHaveProperty('addressCache')
            expect(resolver).toHaveProperty('organizationProperties')
            expect(resolver.organizationProperties).toHaveLength(properties.length)
            expect(resolver.organizationProperties.map(prop => prop.id))
                .toMatchObject(properties.map(pair => pair.property.id))
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
                })
            expect(resolver.parseAddress('ул.Щорса,103,212'))
                .toMatchObject({
                    parsed: true,
                    address: 'ул.Щорса, 103',
                    unitType: 'flat',
                    unitName: '212',
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
            await resolver.propagateAddressToCache({})
            await resolver.propagateAddressToCache({ address: null })
            await resolver.propagateAddressToCache({ address: '' })
            await resolver.propagateAddressToCache({ parsed: false, address })
            expect(Object.keys(resolver.addressCache)).toHaveLength(0)
            expect(addressServiceCallCount).toEqual(0)

            // address service returns empty value for a key
            await resolver.propagateAddressToCache({ parsed: true, address })
            expect(Object.keys(resolver.addressCache)).toHaveLength(1)
            expect(resolver.addressCache[resolver.getCacheKey(address)]).toBeNull()
            expect(addressServiceCallCount).toEqual(1)

            // prevent to address service search for the same address twice
            await resolver.propagateAddressToCache({ parsed: true, address })
            expect(Object.keys(resolver.addressCache)).toHaveLength(1)
            expect(resolver.addressCache[resolver.getCacheKey(address)]).toBeNull()
            expect(addressServiceCallCount).toEqual(1)
        })

        it('propagate for a given address', async () => {
            const tin = '12345789'
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
            await resolver.propagateAddressToCache({ parsed: true, address })
            expect(Object.keys(resolver.addressCache)).toHaveLength(1)
            expect(resolver.addressCache[resolver.getCacheKey(address)]).toMatchObject({ address })
            expect(addressServiceCallCount).toEqual(1)
        })

        it('propagate for a given address and address sources', async () => {
            const tin = '12345789'
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
            await resolver.propagateAddressToCache({ parsed: true, address })
            expect(Object.keys(resolver.addressCache)).toHaveLength(2)
            expect(resolver.addressCache[resolver.getCacheKey(address)]).toMatchObject(addressServiceSearchResult)
            expect(resolver.addressCache[resolver.getCacheKey(address2)]).toMatchObject(addressServiceSearchResult)
            expect(addressServiceCallCount).toEqual(1)
        })
    })

    describe('BillingPropertyResolver.getAddressConditionValues tests', () => {
        it('Cached address with all meta', async () => {
            const tin = '12345789'
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
                address,
                addressKey,
                normalizedAddress,
                fias,
            })
        })

        it('Cached fias with all meta', async () => {
            const tin = '12345789'
            const resolver = new BillingPropertyResolver()
            const address = faker.address.streetAddress(true)
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
            const tin = '12345789'
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
                address,
                addressKey,
                normalizedAddress,
            })
        })

        it('Not cached fias', async () => {
            const tin = '12345789'
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
            const tin = '12345789'
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

        it('Another billing context case', async () => {
            const { property, billingProperty } = properties[1]
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
            const resolver = new BillingPropertyResolver()
            const propertyId = faker.datatype.uuid()
            resolver.organizationProperties = [
                { id: propertyId },
                { id: faker.datatype.uuid() },
                { id: faker.datatype.uuid() },
            ]

            expect(
                await resolver.isPropertyRegistrationInOrganization({ property: { id: propertyId } })
            ).toBeTruthy()
        })

        it('registered: another billing context case', async () => {
            const { billingProperty } = properties[1]
            const registered = await resolver.isPropertyRegistrationInOrganization(billingProperty)
            expect(registered).toBeTruthy()
        })

        it('not registered cases', async () => {
            const resolver = new BillingPropertyResolver()
            const propertyId = faker.datatype.uuid()
            resolver.organizationProperties = [
                { id: propertyId },
                { id: faker.datatype.uuid() },
                { id: faker.datatype.uuid() },
            ]

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
            const tin = '12345789'
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

            // properties mock
            const propertyId = faker.datatype.uuid()
            resolver.organizationProperties = [
                { id: propertyId },
                { id: faker.datatype.uuid() },
                { id: faker.datatype.uuid() },
            ]
            const billingProperty = { property: { id: propertyId } }
            resolver.searchBillingProperty = async () => (billingProperty)

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

            const foundProperty = await resolver.getOrganizationBillingPropertySuggestion(address)
            expect(foundProperty).toBeDefined()
            expect(foundProperty).toHaveProperty('id', billingProperty.id)
        })

        it('Address has to much difference', async () => {
            const { property } = properties[0]
            const address = property.address + property.address

            const foundProperty = await resolver.getOrganizationBillingPropertySuggestion(address)
            expect(foundProperty).not.toBeDefined()
        })

        it('Organization property exists but billing property are missing', async () => {
            const address = noPairProperty.address

            expect(
                resolver.organizationProperties.find(prop => prop.id === noPairProperty.id)
            ).toBeDefined()

            const foundProperty = await resolver.getOrganizationBillingPropertySuggestion(address)
            expect(foundProperty).not.toBeDefined()
        })
    })

    describe('BillingPropertyResolver.createBillingProperty tests', () => {
        it('Regular case', async () => {
            const address = faker.address.streetAddress(true)
            const normalizedAddress = faker.address.streetAddress(true)
            const fias = faker.datatype.uuid()

            const fiasSummary = { fias }
            const addressSummary = { normalizedAddress, address }
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
            const address = faker.address.streetAddress(true)
            const fias = faker.datatype.uuid()

            const fiasSummary = { fias }
            const addressSummary = { address }
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
            const normalizedAddress = faker.address.streetAddress(true)
            const fias = faker.datatype.uuid()

            const fiasSummary = { fias }
            const addressSummary = { normalizedAddress }
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
    })

    describe('BillingPropertyResolver.resolve tests', () => {
        let getResolver, generateFullAddress

        beforeAll(async () => {
            generateFullAddress = (address, unitType = 'flat', unitTypeHumanReadable = 'кв.', unitName = '1') => {
                const street = isNil(address) ? faker.address.streetAddress(false) : address
                return {
                    unitType,
                    unitName,
                    address: `${street}, ${unitTypeHumanReadable} ${unitName}`,
                }
            }
            getResolver = async (rules = {}, addressServiceSearchMock = async () => null, providedOrg, providedContext) => {
                const chosenOrg = isNil(providedOrg) ? organization : providedOrg
                const chosenContext = isNil(providedContext) ? billingIntegrationContext : providedContext
                // init resolver at the end since it cache data at init stage
                resolver = new BillingPropertyResolver()
                await resolver.init(
                    adminContext,
                    tin,
                    chosenOrg.id,
                    chosenContext.id,
                    rules,
                )

                resolver.addressService.search = addressServiceSearchMock
                return resolver
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
            })

            it('Resolve by address case', async () => {
                const { property, billingProperty } = properties[0]
                const { unitType, unitName, address } = generateFullAddress(property.address)

                const resolved = await resolver.resolve(address, {}, unitType, unitName)
                expect(resolved).toBeDefined()
                expect(resolved).toHaveProperty('billingProperty.id', billingProperty.id)
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
            })

            it('Resolve by organization properties case', async () => {
                const { property, billingProperty } = properties[0]
                const { unitType, unitName } = generateFullAddress()

                // search address a little different that an original address
                const address = property.address + ' d'

                const resolved = await resolver.resolve(address, {}, unitType, unitName)
                expect(resolved).toBeDefined()
                expect(resolved).toHaveProperty('billingProperty.id', billingProperty.id)
            })

            it('Not found case', async () => {
                const { unitType, unitName, address } = generateFullAddress()
                const fias = faker.datatype.uuid()

                const resolved = await resolver.resolve(address, { fias }, unitType, unitName)
                expect(resolved).toBeDefined()
                expect(resolved).toHaveProperty('billingProperty.id')
                expect(resolved).toHaveProperty('billingProperty.globalId', fias)
            })
        })
    })
})