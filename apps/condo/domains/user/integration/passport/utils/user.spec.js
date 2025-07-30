jest.mock('@open-condo/config', () => {
    const conf = jest.requireActual('@open-condo/config')

    const getter = (_, name) => {
        if (name === 'PASSPORT_CONFIG') {
            return JSON.stringify([
                {
                    name: 'github',
                    strategy: 'github',
                    options: {
                        clientID: '12345678',
                        clientSecret: 'some-fake-client-secret',
                    },
                },
            ])
        }
        return conf[name]
    }

    return new Proxy(conf, { get: getter, set: jest.fn() })
})

const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const { getById, getByCondition, getSchemaCtx } = require('@open-condo/keystone/schema')
const {
    setFakeClientMode,
    expectToThrowRawGQLError,
} = require('@open-condo/keystone/test.utils')

const { STAFF, RESIDENT, SERVICE } = require('@condo/domains/user/constants/common')
const { User, UserRightsSet } = require('@condo/domains/user/utils/serverSchema')
const { createTestEmail, createTestPhone } = require('@condo/domains/user/utils/testSchema')

const { syncUser } = require('./user')

const DV_SENDER = {
    dv: 1,
    sender: { dv: 1, fingerprint: faker.random.alphaNumeric(12) },
}

function createMockRequest ({
    method = 'GET',
    headers = {},
    query = {},
    params = {},
} = {}) {
    return {
        method,
        headers,
        query,
        params,
    }
}

function createTestOIDCProfile ({
    sub,
    name,
    phone_number,
    phone_number_verified,
    email,
    email_verified,
} = {}) {
    const profile = {
        sub: typeof sub !== 'undefined' ? sub : faker.datatype.uuid(),
        name: name || faker.name.fullName(),
        phone_number: phone_number || createTestPhone(),
        phone_number_verified: typeof phone_number_verified === 'boolean' ? phone_number_verified : Math.random() > 0.5,
        email: email || createTestEmail(),
        email_verified: typeof email_verified === 'boolean' ? email_verified : Math.random() > 0.5,
    }

    if (phone_number_verified === null) {
        delete profile.phone_number_verified
    }
    if (email_verified === null) {
        delete profile.email_verified
    }
    if (email === false) {
        delete profile.email_verified
        delete profile.email
    }
    if (phone_number === false) {
        delete profile.phone_number_verified
        delete profile.phone_number
    }

    return profile
}

function getRandomUserType () {
    return Math.random() > 0.5 ? STAFF : RESIDENT
}

function generateProviderInfo ({ trustPhone, trustEmail } = {}) {
    return {
        name: 'github',
        trustPhone: typeof trustPhone !== 'undefined' ? trustPhone : true,
        trustEmail: typeof trustEmail !== 'undefined' ? trustEmail : true,
    }
}

function _generateCombinations (options) {
    const keys = Object.keys(options)
    const total = Object.values(options).map(variants => variants.length).reduce((acc, cur) => acc * cur, 1)

    const combinations = []

    for (let i = 0; i < total; i++) {
        let left = i
        let spaceSize = total
        const combination = {}

        for (const key of keys) {
            const optionSize = spaceSize / options[key].length
            const option = Math.floor(left / optionSize)
            combination[key] = options[key][option]
            spaceSize = optionSize
            left -= option * optionSize
        }

        combinations.push(combination)
    }

    return combinations
}


describe('User utils', () => {
    setFakeClientMode(index, { excludeApps: ['NextApp'] })

    let serverContext
    beforeAll(async () => {
        const { keystone } = getSchemaCtx('User')
        serverContext = await keystone.createContext({ skipAccessControl: true })
    })

    describe('syncUser', () => {
        describe('Must validate input data', () => {
            describe('userType', () => {
                describe('must accept allowed user types', () => {
                    test.each([STAFF, RESIDENT])('%p', async (userType) => {
                        const { id } = await syncUser(
                            createMockRequest(),
                            createTestOIDCProfile(),
                            userType,
                            generateProviderInfo()
                        )
                        const user = await getById('User', id)
                        expect(user).toHaveProperty('type', userType)
                    })
                })
                describe('must not accept invalid / restricted user types',  () => {
                    test.each([SERVICE, undefined, null, faker.random.alpha(12)])('%p', async (userType) => {
                        await expectToThrowRawGQLError(async () => {
                            await syncUser(
                                createMockRequest(),
                                createTestOIDCProfile(),
                                userType,
                                generateProviderInfo()
                            )
                        }, {
                            code: 'BAD_USER_INPUT',
                            type: 'INVALID_USER_TYPE',
                        })
                    })
                })
            })
            describe('providerInfo', () => {
                describe('must accept valid provider info with name / trustPhone / trustEmail', () => {
                    test.each(_generateCombinations({
                        name: ['github'],
                        trustEmail: [true, false],
                        trustPhone: [true, false],
                    }).map(combination => [JSON.stringify(combination), combination]))('%p', async (_, providerInfo) => {
                        const profile = createTestOIDCProfile()
                        const userType = getRandomUserType()
                        const { id } = await syncUser(
                            createMockRequest(),
                            profile,
                            userType,
                            providerInfo,
                        )
                        const identity = await getByCondition('UserExternalIdentity', {
                            user: { id },
                            identityId: profile.sub,
                            identityType: providerInfo.name,
                            userType,
                        })
                        expect(identity).toBeDefined()
                    })
                })
                describe('must not accept invalid provider configs', () => {
                    test.each([
                        ['no trustEmail', { name: 'github', trustPhone: true }, 'at trustEmail'],
                        ['no trustPhone', { name: 'github', trustEmail: true }, 'at trustPhone'],
                        ['no name', { trustPhone: true, trustEmail: true }, 'at name'],
                        ['invalid types', { name: 'github', trustPhone: 'true', trustEmail: 'true' }, 'expected boolean, received string'],
                    ])('%p', async (_, providerInfo, messageContaining) => {
                        await expectToThrowRawGQLError(async () => {
                            await syncUser(
                                createMockRequest(),
                                createTestOIDCProfile(),
                                getRandomUserType(),
                                providerInfo,
                            )
                        }, {
                            code: 'INTERNAL_ERROR',
                            type: 'INVALID_IDENTITY_PROVIDER_INFO',
                        }, [
                            expect.objectContaining({
                                message: expect.stringContaining(messageContaining),
                            }),
                        ])
                    })
                })
            })
            describe('fieldMapping', () => {
                describe('must accept valid provider info with name / trustPhone / trustEmail', () => {
                    test.each(_generateCombinations({
                        id: ['identifier', undefined],
                        name: ['first_name', undefined],
                        phone: ['user_phone', undefined],
                        isPhoneVerified: ['phone_verified', undefined],
                        email: ['primary_email', undefined],
                        isEmailVerified: ['verified', undefined],
                    }).map(fieldMapping => {
                        const oidcProfile = createTestOIDCProfile()
                        const condoToOIDC = {
                            id: 'sub',
                            name: 'name',
                            phone: 'phone_number',
                            isPhoneVerified: 'phone_number_verified',
                            email: 'email',
                            isEmailVerified: 'email_verified',
                        }
                        const customProfile = {}
                        for (const [condoField, oidcField] of Object.entries(condoToOIDC)) {
                            if (fieldMapping[condoField]) {
                                customProfile[fieldMapping[condoField]] = oidcProfile[oidcField]
                            } else {
                                customProfile[oidcField] = oidcProfile[oidcField]
                                delete fieldMapping[condoField]
                            }
                        }

                        return [JSON.stringify(fieldMapping), fieldMapping, customProfile]
                    }))('%p', async (_, fieldMapping, userProfile) => {
                        const { id } = await syncUser(
                            createMockRequest(),
                            userProfile,
                            getRandomUserType(),
                            generateProviderInfo(),
                            fieldMapping,
                        )
                        expect(id).toBeDefined()
                    })
                })
                describe('must not accept invalid fieldMapping', () => {
                    test.each([
                        ['invalid field', { age: 'person_age' }, 'Unrecognized key: "age"'],
                        ['non-string type', { id: 2 }, 'Invalid input: expected string, received number'],
                    ])('%p', async (_, fieldMapping, messageContaining) => {
                        await expectToThrowRawGQLError(async () => {
                            await syncUser(
                                createMockRequest(),
                                createTestOIDCProfile(),
                                getRandomUserType(),
                                generateProviderInfo(),
                                fieldMapping,
                            )
                        }, {
                            code: 'INTERNAL_ERROR',
                            type: 'INVALID_FIELD_MAPPING',
                        }, [
                            expect.objectContaining({
                                message: expect.stringContaining(messageContaining),
                            }),
                        ])
                    })
                })
            })
        })
        describe('Must convert provider shape to condo format', () => {
            describe('Must support different IDs formats', () => {
                test.each([
                    ['uuid (any strings)', faker.datatype.uuid()],
                    ['autoincrement int (non-negative integers)', faker.datatype.number({ min: 0, max: 1000000000 })],
                ])('%p', async (_, sub) => {
                    const profile = createTestOIDCProfile({ sub })
                    const providerInfo = generateProviderInfo()
                    const userType = getRandomUserType()

                    const { id } = await syncUser(
                        createMockRequest(),
                        profile,
                        userType,
                        providerInfo,
                    )
                    const identity = await getByCondition('UserExternalIdentity', {
                        user: { id },
                        identityId: String(profile.sub),
                        identityType: providerInfo.name,
                        userType,
                    })
                    expect(identity).toBeDefined()
                })
            })
            describe('Must not support invalid IDs', () => {
                test.each([
                    ['non-integer numbers', faker.datatype.number({ min: 0, max: 100000, precision: 0.01 })],
                    ['negative integers', -faker.datatype.number({ min: 1, max: 1000000000 })],
                ])('%p', async (_, sub) => {
                    await expectToThrowRawGQLError(async () => {
                        await syncUser(
                            createMockRequest(),
                            createTestOIDCProfile({ sub }),
                            getRandomUserType(),
                            generateProviderInfo(),
                        )
                    }, {
                        code: 'INTERNAL_ERROR',
                        type: 'INVALID_USER_DATA',
                    }, [
                        expect.objectContaining({
                            message: expect.stringContaining('at id'),
                        }),
                    ])
                })
            })
            test('Must treat phones / emails as verified if provider does not provide separate verification status', async () => {
                const profile = createTestOIDCProfile({ email_verified: null, phone_number_verified: null })
                expect(profile).not.toHaveProperty('email_verified')
                expect(profile).not.toHaveProperty('phone_number_verified')

                const { id } = await syncUser(
                    createMockRequest(),
                    profile,
                    getRandomUserType(),
                    generateProviderInfo(),
                )
                const user = await getById('User', id)
                expect(user).toHaveProperty('isPhoneVerified', true)
                expect(user).toHaveProperty('isExternalPhoneVerified', true)
                expect(user).toHaveProperty('isEmailVerified', true)
                expect(user).toHaveProperty('isExternalEmailVerified', true)
            })
            test('conversion test', async () => {
                const fields = {
                    id: [faker.random.alphaNumeric(12), faker.datatype.uuid()],
                    name: [faker.random.alphaNumeric(12), faker.internet.userName()],
                    phone: [faker.random.alphaNumeric(12), createTestPhone()],
                    isPhoneVerified: [faker.random.alphaNumeric(12), Math.random() > 0.5],
                    email: [faker.random.alphaNumeric(12), createTestEmail()],
                    isEmailVerified: [faker.random.alphaNumeric(12), Math.random() > 0.5],
                }
                const profile = {}
                const fieldMapping = {}
                const providerInfo = generateProviderInfo()
                const userType = getRandomUserType()

                for (const [condoFieldPath, [profileFieldPath, profileFieldValue]] of Object.entries(fields)) {
                    profile[profileFieldPath] = profileFieldValue
                    fieldMapping[condoFieldPath] = profileFieldPath
                }

                const { id } = await syncUser(
                    createMockRequest(),
                    profile,
                    userType,
                    providerInfo,
                    fieldMapping,
                )
                const user = await getById('User', id)
                expect(user).toHaveProperty('phone', fields.phone[1])
                expect(user).toHaveProperty('email', fields.email[1])
                expect(user).toHaveProperty('isPhoneVerified', fields.isPhoneVerified[1])
                expect(user).toHaveProperty('isEmailVerified', fields.isEmailVerified[1])
                expect(user).toHaveProperty('externalPhone', fields.phone[1])
                expect(user).toHaveProperty('externalEmail', fields.email[1])
                expect(user).toHaveProperty('isExternalPhoneVerified', fields.isPhoneVerified[1])
                expect(user).toHaveProperty('isExternalEmailVerified', fields.isEmailVerified[1])
                const identity = await getByCondition('UserExternalIdentity', {
                    user: { id },
                    identityId: fields.id[1],
                    identityType: providerInfo.name,
                    userType,
                })
                expect(identity).toBeDefined()
            })
        })
        describe('Must find existing identities', () => {
            test('Must return linked user even if its data changed', async () => {
                const profile = createTestOIDCProfile({ email: false })
                expect(profile).not.toHaveProperty('email')
                expect(profile).not.toHaveProperty('email_verified')
                const userType =  getRandomUserType()
                const providerInfo = generateProviderInfo()
                const { id: createdUserId } = await syncUser(
                    createMockRequest(),
                    profile,
                    userType,
                    providerInfo,
                )
                expect(createdUserId).toBeDefined()
                const user = await getById('User', createdUserId)
                expect(user).toHaveProperty('phone', profile.phone_number)
                const { phone } = await User.update(serverContext, createdUserId, {
                    ...DV_SENDER,
                    phone: null,
                    isPhoneVerified: false,
                }, 'phone')
                expect(phone).toBe(null)

                const { id: loggedUserId } = await syncUser(
                    createMockRequest(),
                    profile,
                    userType,
                    providerInfo,
                )

                expect(loggedUserId).toEqual(createdUserId)
            })
            test('Must throw error if linked user is deleted', async () => {
                const profile = createTestOIDCProfile()
                const userType =  getRandomUserType()
                const providerInfo = generateProviderInfo()
                const { id: createdUserId } = await syncUser(
                    createMockRequest(),
                    profile,
                    userType,
                    providerInfo,
                )
                expect(createdUserId).toBeDefined()
                const { deletedAt } = await User.update(serverContext, createdUserId, {
                    ...DV_SENDER,
                    deletedAt: dayjs().toISOString(),
                }, 'deletedAt')
                expect(deletedAt).not.toBe(null)

                await expectToThrowRawGQLError(async () => {
                    await syncUser(
                        createMockRequest(),
                        profile,
                        userType,
                        providerInfo,
                    )
                }, {
                    code: 'BAD_USER_INPUT',
                    type: 'EXTERNAL_IDENTITY_BLOCKED',
                })
            })
        })
        describe('Must link to existing user', () => {
            describe('by matching phone and userType if phone is verified on both sides, we trust provider and user is not super user', () => {
                let rightsId
                beforeAll(async () => {
                    const { id } = await UserRightsSet.create(serverContext, {
                        ...DV_SENDER,
                        name: faker.lorem.words(3),
                    })
                    rightsId = id
                })
                test.each(_generateCombinations({
                    condoUserType: [STAFF, RESIDENT],
                    syncUserType: [STAFF, RESIDENT],
                    condoUserAccess: ['admin', 'support', 'rightsSet', 'user'],
                    trustPhone: [true, false],
                    matchingPhone: [true, false],
                    isPhoneVerifiedByProvider: [true, false],
                    isPhoneVerifiedByCondo: [true, false],
                }).map(combination => [JSON.stringify(combination), combination]))('%p', async (_, combination) => {
                    const condoPhone = createTestPhone()
                    const providerPhone = createTestPhone()
                    expect(providerPhone).not.toEqual(condoPhone)
                    const condoUserData = {
                        ...DV_SENDER,
                        phone: condoPhone,
                        isPhoneVerified: combination.isPhoneVerifiedByCondo,
                        type: combination.condoUserType,
                    }
                    if (combination.condoUserAccess === 'admin') {
                        condoUserData.isAdmin = true
                    } else if (combination.condoUserAccess === 'support') {
                        condoUserData.isSupport = true
                    } else if (combination.condoUserAccess === 'rightsSet') {
                        condoUserData.rightsSet = { connect: { id: rightsId } }
                    }
                    const condoUser = await User.create(serverContext, condoUserData, 'id')
                    expect(condoUser).toHaveProperty('id')

                    const profile = createTestOIDCProfile({
                        phone_number_verified: combination.isPhoneVerifiedByProvider,
                        phone_number: combination.matchingPhone ? condoPhone : providerPhone,
                        email: false,
                    })
                    const providerInfo = generateProviderInfo({ trustPhone: combination.trustPhone })

                    const { id } = await syncUser(
                        createMockRequest(),
                        profile,
                        combination.syncUserType,
                        providerInfo,
                    )
                    expect(id).toBeDefined()
                    expect(condoUser.id === id).toEqual(
                        combination.matchingPhone &&
                        combination.isPhoneVerifiedByProvider &&
                        combination.isPhoneVerifiedByCondo &&
                        combination.condoUserAccess === 'user' &&
                        combination.trustPhone === true &&
                        combination.condoUserType === combination.syncUserType
                    )
                })
            })
            describe('by matching email and userType if email is verified on both sides, we trust provider and user is not super user', () => {
                let rightsId
                beforeAll(async () => {
                    const { id } = await UserRightsSet.create(serverContext, {
                        ...DV_SENDER,
                        name: faker.lorem.words(3),
                    })
                    rightsId = id
                })
                test.each(_generateCombinations({
                    condoUserType: [STAFF, RESIDENT],
                    syncUserType: [STAFF, RESIDENT],
                    condoUserAccess: ['admin', 'support', 'rightsSet', 'user'],
                    trustEmail: [true, false],
                    matchingEmail: [true, false],
                    isEmailVerifiedByProvider: [true, false],
                    isEmailVerifiedByCondo: [true, false],
                }).map(combination => [JSON.stringify(combination), combination]))('%p', async (_, combination) => {
                    const condoEmail = createTestEmail()
                    const providerEmail = createTestEmail()
                    expect(providerEmail).not.toEqual(condoEmail)
                    const condoUserData = {
                        ...DV_SENDER,
                        email: condoEmail,
                        isEmailVerified: combination.isEmailVerifiedByCondo,
                        type: combination.condoUserType,
                    }
                    if (combination.condoUserAccess === 'admin') {
                        condoUserData.isAdmin = true
                    } else if (combination.condoUserAccess === 'support') {
                        condoUserData.isSupport = true
                    } else if (combination.condoUserAccess === 'rightsSet') {
                        condoUserData.rightsSet = { connect: { id: rightsId } }
                    }
                    const condoUser = await User.create(serverContext, condoUserData, 'id')
                    expect(condoUser).toHaveProperty('id')

                    const profile = createTestOIDCProfile({
                        email_verified: combination.isEmailVerifiedByProvider,
                        email: combination.matchingEmail ? condoEmail : providerEmail,
                        phone_number: false,
                    })
                    const providerInfo = generateProviderInfo({ trustEmail: combination.trustEmail })

                    const { id } = await syncUser(
                        createMockRequest(),
                        profile,
                        combination.syncUserType,
                        providerInfo,
                    )
                    expect(id).toBeDefined()
                    expect(condoUser.id === id).toEqual(
                        combination.matchingEmail &&
                        combination.isEmailVerifiedByProvider &&
                        combination.isEmailVerifiedByCondo &&
                        combination.condoUserAccess === 'user' &&
                        combination.trustEmail === true &&
                        combination.condoUserType === combination.syncUserType
                    )
                })
            })
            test('Must prioritize phone over email for matching', async () => {
                const userType = getRandomUserType()
                const phone = createTestPhone()
                const email = createTestEmail()

                const phoneUser = await User.create(serverContext, {
                    ...DV_SENDER,
                    phone,
                    isPhoneVerified: true,
                    type: userType,
                })
                expect(phoneUser).toHaveProperty('id')
                const emailUser = await User.create(serverContext, {
                    ...DV_SENDER,
                    email,
                    isEmailVerified: true,
                    type: userType,
                })
                expect(emailUser).toHaveProperty('id')
                expect(phoneUser.id).not.toEqual(emailUser.id)

                const profile = createTestOIDCProfile({
                    phone_number: phone,
                    phone_number_verified: true,
                    email: email,
                    email_verified: true,
                })
                expect(profile).toHaveProperty('phone_number', phone)
                expect(profile).toHaveProperty('phone_number_verified', true)
                expect(profile).toHaveProperty('email', email)
                expect(profile).toHaveProperty('email_verified', true)

                const { id } = await syncUser(
                    createMockRequest(),
                    profile,
                    userType,
                    generateProviderInfo(),
                )

                expect(id).toEqual(phoneUser.id)
            })
        })
    })
})