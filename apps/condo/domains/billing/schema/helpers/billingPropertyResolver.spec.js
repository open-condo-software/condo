// const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')

const {
    catchErrorFrom,
} = require('@open-condo/keystone/test.utils')

const { AddressTransform, AddressParser } = require('@condo/domains/billing/schema/helpers/addressTransform')


const { BillingPropertyResolver } = require('./billingPropertyResolver')
//
// const { keystone } = index
//
// setFakeClientMode(index)

describe('BillingPropertyResolver tests', () => {
    describe('BillingPropertyResolver.getBillingPropertyKey tests', () => {
        const resolver = new BillingPropertyResolver()
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

    describe('BillingPropertyResolver.parseAddress tests', () => {
        it('returns parsed: false', async () => {
            const resolver = new BillingPropertyResolver()

            expect(resolver.parseAddress()).toMatchObject({ parsed: false })
            expect(resolver.parseAddress(null)).toMatchObject({ parsed: false })
            expect(resolver.parseAddress('')).toMatchObject({ parsed: false })
        })

        it('returns parsed: true no transformation rules', async () => {
            const resolver = new BillingPropertyResolver()
            resolver.parser = new AddressParser()
            resolver.transformer = new AddressTransform()
            resolver.transformer.init({})

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
            resolver.transformer = new AddressTransform()
            resolver.transformer.init({
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
            const resolver = new BillingPropertyResolver()

            expect(resolver.parseFias()).toMatchObject({ parsed: false, isFias: true })
            expect(resolver.parseFias(null)).toMatchObject({ parsed: false, isFias: true })
            expect(resolver.parseFias('')).toMatchObject({ parsed: false, isFias: true })
        })

        it('returns parsed: true no transformation rules', async () => {
            const resolver = new BillingPropertyResolver()
            resolver.parser = new AddressParser()
            resolver.transformer = new AddressTransform()
            resolver.transformer.init({})

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
            const resolver = new BillingPropertyResolver()
            const chosenByFias = { unitType: 'warehouse', unitName: '1' }

            // address parsed & not provided unitType/unitName
            expect(resolver.chooseUnitParts(
                getParsedFias(),
                getParsedAddress()
            )).toMatchObject(chosenByFias)

            // address parsed and provide unitType/unitName
            expect(resolver.chooseUnitParts(
                getParsedFias(),
                getParsedAddress(),
                'flat',
                '6'
            )).toMatchObject(chosenByFias)


            // address not parsed & not provided unitType/unitName
            expect(resolver.chooseUnitParts(
                getParsedFias(),
                getNotParsed()
            )).toMatchObject(chosenByFias)

            // address not parsed and provide unitType/unitName
            expect(resolver.chooseUnitParts(
                getParsedFias(),
                getNotParsed(),
                'flat',
                '6'
            )).toMatchObject(chosenByFias)
        })

        it('address cases', async () => {
            const resolver = new BillingPropertyResolver()
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

            // fias not parsed and provided unitType/unitName
            expect(resolver.chooseUnitParts(
                getNotParsed(),
                getParsedAddress(),
                'flat',
                '6'
            )).toMatchObject(chosenByAddress)
        })

        it('provided unit parts cases', async () => {
            const resolver = new BillingPropertyResolver()
            const chosenByAddress = { unitType: 'flat', unitName: '6' }

            // fias and address not parsed, but unitType is empty for all
            expect(resolver.chooseUnitParts(
                getParsedFias({ unitType: '', unitName: '5' }),
                getParsedAddress({ unitType: '', unitName: '5' }),
                'flat',
                '6'
            )).toMatchObject({ unitType: 'flat', unitName: '5' })

            // fias and address not parsed, but unitName is empty for all
            expect(resolver.chooseUnitParts(
                getParsedFias({ unitType: '', unitName: '' }),
                getParsedAddress({ unitType: '', unitName: '' }),
                'flat',
                '6'
            )).toMatchObject({ unitType: 'flat', unitName: '6' })

            // fias and address not parsed
            expect(resolver.chooseUnitParts(
                getNotParsed(),
                getNotParsed(),
                'flat',
                '6'
            )).toMatchObject(chosenByAddress)
        })

        it('can not extract unit parts cases', async () => {
            const resolver = new BillingPropertyResolver()
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
            const tin = '12345789'
            const resolver = new BillingPropertyResolver()
            const address = faker.address.streetAddress(true)
            resolver.tin = tin

            expect(resolver.getCacheKey(address)).toEqual(`${tin}_${address}`)
            expect(resolver.getCacheKey(null)).toBeNull()
            expect(resolver.getCacheKey('')).toBeNull()
            expect(resolver.getCacheKey()).toBeNull()
        })
    })

    describe('BillingPropertyResolver.propagateAddressToCache tests', () => {
        it('empty propagate cases', async () => {
            const tin = '12345789'
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
            const addressServiceSearchResult = { address, addressSources: [ address, address2 ] }
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
                [resolver.getCacheKey(address)]: { address: normalizedAddress, addressKey, addressMeta: { data: { house_fias_id: fias } } },
            }

            // act & assert
            expect(resolver.getAddressConditionValues({ address })).toMatchObject({
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
                [resolver.getCacheKey(fiasAddress)]: { address: normalizedAddress, addressKey, addressMeta: { data: { house_fias_id: fias } } },
            }

            // act & assert
            expect(resolver.getAddressConditionValues({ isFias: true, address: fiasAddress })).toMatchObject({
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
                [resolver.getCacheKey(address)]: { address: normalizedAddress, addressKey, addressMeta: { data: { } } },
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
            expect(resolver.getAddressConditionValues({ isFias: true, address: `fiasId:${fias}` })).toMatchObject({
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
            expect(resolver.getAddressConditionValues({ address })).toMatchObject({
                address,
            })
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
                [resolver.getCacheKey(address)]: { address: normalizedAddress, addressKey, addressMeta: { data: { house_fias_id: fias } } },
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
})