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

const { GQLError } = require('@open-condo/keystone/errors')
const { getById, getByCondition, getSchemaCtx } = require('@open-condo/keystone/schema')
const {
    setFakeClientMode,
    expectToThrowRawGQLError,
} = require('@open-condo/keystone/test.utils')

const { STAFF, RESIDENT, SERVICE } = require('@condo/domains/user/constants/common')
const { User, UserRightsSet } = require('@condo/domains/user/utils/serverSchema')
const { createTestEmail, createTestPhone } = require('@condo/domains/user/utils/testSchema')

const { syncUser, captureUserType, ensureUserType } = require('./user')

const DV_SENDER = {
    dv: 1,
    sender: { dv: 1, fingerprint: faker.random.alphaNumeric(12) },
}

function createMockRequest ({
    method = 'GET',
    headers = {},
    query = {},
    params = { provider: generateProviderInfo().name },
    session = {},
} = {}) {
    return {
        method,
        headers,
        query,
        params,
        session,
    }
}

function createMockResponse () {
    return {}
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

function expectExpressNextCallWithGQLError (next, errorFields) {
    expect(next).toBeCalledTimes(1)
    const callArgs = next.mock.calls[0]
    expect(callArgs).toHaveLength(1)
    const firstArg = callArgs[0]
    expect(firstArg).toBeInstanceOf(GQLError)
    expect(firstArg).toEqual(expect.objectContaining({
        name: 'GQLError',
        extensions: expect.objectContaining(errorFields),
    }))
}

function expectExpressNextHandlerCall (next) {
    expect(next).toBeCalledTimes(1)
    expect(next.mock.calls[0]).toHaveLength(0)
}

describe('User utils', () => {
    setFakeClientMode(index, { excludeApps: ['NextApp'] })

    let serverContext
    beforeAll(async () => {
        jest.resetModules()
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
        describe('Must fill fields on user creation', () => {
            test('external fields and meta must be filled', async () => {
                const rawProfile = {
                    ...createTestOIDCProfile(),
                    extraField: 'extraValue',
                }
                const providerInfo = generateProviderInfo()
                const userType = getRandomUserType()

                const { id } = await syncUser(
                    createMockRequest(),
                    rawProfile,
                    userType,
                    providerInfo,
                )
                expect(id).toBeDefined()

                const user = await getById('User', id)
                expect(user).toEqual(expect.objectContaining({
                    type: userType,
                    name: rawProfile.name,
                    externalPhone: rawProfile.phone_number,
                    isExternalPhoneVerified: rawProfile.phone_number_verified,
                    externalEmail: rawProfile.email,
                    isExternalEmailVerified: rawProfile.email_verified,
                    externalSystemName: providerInfo.name,
                    meta: {
                        [providerInfo.name]: rawProfile,
                    },
                }))
            })
            describe('isExternalPhoneVerified / isExternalEmailVerified', () => {
                test('must not depends on trustEmail / trustPhone, since its status of verification of provider', async () => {
                    const providerInfo = generateProviderInfo({
                        trustEmail: false,
                        trustPhone: false,
                    })
                    expect(providerInfo).toHaveProperty('trustEmail', false)
                    expect(providerInfo).toHaveProperty('trustPhone', false)

                    const profile = createTestOIDCProfile({
                        email_verified: true,
                        phone_number_verified: true,
                    })
                    expect(profile).toHaveProperty('phone_number_verified', true)
                    expect(profile).toHaveProperty('email_verified', true)

                    const { id } = await syncUser(
                        createMockRequest(),
                        profile,
                        getRandomUserType(),
                        providerInfo,
                    )
                    expect(id).toBeDefined()

                    const user = await getById('User', id)
                    expect(user).toHaveProperty('externalPhone', profile.phone_number)
                    expect(user).toHaveProperty('isExternalPhoneVerified', true)
                    expect(user).toHaveProperty('externalEmail', profile.email)
                    expect(user).toHaveProperty('isExternalEmailVerified', true)
                })
                test('must be set to "false" if phone / email is null', async () => {
                    const profile = {
                        sub: faker.datatype.uuid(),
                        phone_number_verified: true,
                        email_verified: true,
                    }

                    const { id } = await syncUser(
                        createMockRequest(),
                        profile,
                        getRandomUserType(),
                        generateProviderInfo()
                    )
                    expect(id).toBeDefined()

                    const user = await getById('User', id)
                    expect(user).toHaveProperty('externalPhone', null)
                    expect(user).toHaveProperty('isExternalPhoneVerified', false)
                    expect(user).toHaveProperty('externalEmail', null)
                    expect(user).toHaveProperty('isExternalEmailVerified', false)
                })
            })
            describe('phone / email related fields', () => {
                test('Must be filled if no conflicts and provider is trusted', async () => {
                    const profile = createTestOIDCProfile({
                        email_verified: true,
                        phone_number_verified: true,
                    })
                    expect(profile).toHaveProperty('phone_number_verified', true)
                    expect(profile).toHaveProperty('email_verified', true)

                    const provider = generateProviderInfo({ trustPhone: true, trustEmail: true })

                    const { id } = await syncUser(
                        createMockRequest(),
                        profile,
                        getRandomUserType(),
                        provider,
                    )
                    expect(id).toBeDefined()

                    const user = await getById('User', id)
                    expect(user).toHaveProperty('phone', profile.phone_number)
                    expect(user).toHaveProperty('isPhoneVerified', true)
                    expect(user).toHaveProperty('email', profile.email)
                    expect(user).toHaveProperty('isEmailVerified', true)
                })
                describe('Must be also filled on conflict with non-verified email / phone. Conflicting user must also lose their unverified phone / email (while saving in meta) to avoid constraints',  () => {
                    test.each(_generateCombinations({
                        phone_number_verified: [true, false],
                        email_verified: [true, false],
                    }).map(combination => [combination.phone_number_verified, combination.email_verified]))('phone_number_verified: %p, email_verified: %p', async (phone_number_verified, email_verified) => {
                        const phone = createTestPhone()
                        const email = createTestEmail()
                        const userType = getRandomUserType()

                        const duplicatedByPhoneUser = await User.create(serverContext, {
                            ...DV_SENDER,
                            phone,
                            isPhoneVerified: false,
                            type: userType,
                        }, 'id phone isPhoneVerified')
                        expect(duplicatedByPhoneUser).toHaveProperty('id')

                        const duplicatedByEmailUser = await User.create(serverContext, {
                            ...DV_SENDER,
                            email,
                            isEmailVerified: false,
                            type: userType,
                        }, 'id email isEmailVerified')
                        expect(duplicatedByEmailUser).toHaveProperty('id')

                        const provider = generateProviderInfo({ trustPhone: true, trustEmail: true })

                        const profile = createTestOIDCProfile({
                            phone_number: phone,
                            phone_number_verified,
                            email,
                            email_verified,
                        })

                        const { id } = await syncUser(
                            createMockRequest(),
                            profile,
                            userType,
                            provider,
                        )
                        expect(id).toBeDefined()
                        expect(id).not.toEqual(duplicatedByPhoneUser.id)
                        expect(id).not.toEqual(duplicatedByEmailUser.id)

                        const user = await getById('User', id)
                        expect(user).toEqual(expect.objectContaining({
                            phone: profile.phone_number,
                            isPhoneVerified: phone_number_verified,
                            email: profile.email,
                            isEmailVerified: email_verified,
                        }))

                        const updatedDuplicateByPhone = await getById('User', duplicatedByPhoneUser.id)
                        expect(updatedDuplicateByPhone).toHaveProperty('phone', null)
                        expect(updatedDuplicateByPhone).toHaveProperty('isPhoneVerified', false)
                        expect(updatedDuplicateByPhone.meta).toEqual(expect.objectContaining({
                            phone: duplicatedByPhoneUser.phone,
                        }))

                        const updatedDuplicateByEmail = await getById('User', duplicatedByEmailUser.id)
                        expect(updatedDuplicateByEmail).toHaveProperty('email', null)
                        expect(updatedDuplicateByEmail).toHaveProperty('isEmailVerified', false)
                        expect(updatedDuplicateByEmail.meta).toEqual(expect.objectContaining({
                            email: duplicatedByEmailUser.email,
                        }))
                    })
                })
                describe('isPhoneVerified / isEmailVerified must depends on trustPhone / trustEmail since it can be used for condo auth methods',  () => {
                    test('isPhoneVerified', async () => {
                        const providerInfo = generateProviderInfo({
                            trustPhone: false,
                        })
                        expect(providerInfo).toHaveProperty('trustPhone', false)

                        const profile = createTestOIDCProfile({
                            phone_number_verified: true,
                        })
                        expect(profile).toHaveProperty('phone_number_verified', true)

                        const { id } = await syncUser(
                            createMockRequest(),
                            profile,
                            getRandomUserType(),
                            providerInfo,
                        )
                        expect(id).toBeDefined()

                        const user = await getById('User', id)
                        expect(user).toHaveProperty('phone', profile.phone_number)
                        expect(user).toHaveProperty('isPhoneVerified', false)
                    })
                    test('isEmailVerified', async () => {
                        const providerInfo = generateProviderInfo({
                            trustEmail: false,
                        })
                        expect(providerInfo).toHaveProperty('trustEmail', false)

                        const profile = createTestOIDCProfile({
                            email_verified: true,
                        })
                        expect(profile).toHaveProperty('email_verified', true)

                        const { id } = await syncUser(
                            createMockRequest(),
                            profile,
                            getRandomUserType(),
                            providerInfo,
                        )
                        expect(id).toBeDefined()

                        const user = await getById('User', id)
                        expect(user).toHaveProperty('email', profile.email)
                        expect(user).toHaveProperty('isEmailVerified', false)
                    })

                })
                describe('email / phone must not be set on conflict with untrusted provider',  () => {
                    test('phone', async () => {
                        const phone = createTestPhone()
                        const userType = getRandomUserType()

                        const duplicatedByPhoneUser = await User.create(serverContext, {
                            ...DV_SENDER,
                            phone,
                            isPhoneVerified: false,
                            type: userType,
                        }, 'id phone isPhoneVerified')
                        expect(duplicatedByPhoneUser).toHaveProperty('id')

                        const provider = generateProviderInfo({ trustPhone: false })

                        const profile = createTestOIDCProfile({
                            phone_number: phone,
                            phone_number_verified: true,
                        })

                        const { id } = await syncUser(
                            createMockRequest(),
                            profile,
                            userType,
                            provider,
                        )
                        expect(id).toBeDefined()
                        expect(id).not.toEqual(duplicatedByPhoneUser.id)

                        const user = await getById('User', id)
                        expect(user).toEqual(expect.objectContaining({
                            phone: null,
                            isPhoneVerified: false,
                        }))

                        const updatedDuplicateByPhone = await getById('User', duplicatedByPhoneUser.id)
                        expect(updatedDuplicateByPhone).toHaveProperty('phone', duplicatedByPhoneUser.phone)
                        expect(updatedDuplicateByPhone).toHaveProperty('isPhoneVerified', duplicatedByPhoneUser.isPhoneVerified)
                    })
                    test('email', async () => {
                        const email = createTestEmail()
                        const userType = getRandomUserType()

                        const duplicatedByEmailUser = await User.create(serverContext, {
                            ...DV_SENDER,
                            email,
                            isEmailVerified: false,
                            type: userType,
                        }, 'id email isEmailVerified')
                        expect(duplicatedByEmailUser).toHaveProperty('id')

                        const provider = generateProviderInfo({ trustEmail: false })

                        const profile = createTestOIDCProfile({
                            email,
                            email_verified: true,
                        })

                        const { id } = await syncUser(
                            createMockRequest(),
                            profile,
                            userType,
                            provider,
                        )
                        expect(id).toBeDefined()
                        expect(id).not.toEqual(duplicatedByEmailUser.id)

                        const user = await getById('User', id)
                        expect(user).toEqual(expect.objectContaining({
                            email: null,
                            isEmailVerified: false,
                        }))

                        const updatedDuplicateByEmail = await getById('User', duplicatedByEmailUser.id)
                        expect(updatedDuplicateByEmail).toHaveProperty('email', duplicatedByEmailUser.email)
                        expect(updatedDuplicateByEmail).toHaveProperty('isEmailVerified', duplicatedByEmailUser.isEmailVerified)
                    })
                })
            })
        })
        describe('Must update user info on first linking', () => {
            let email
            let phone
            let userType
            let condoUser
            beforeEach(async () => {
                email = createTestEmail()
                phone = createTestPhone()
                userType = getRandomUserType()
                condoUser = await User.create(serverContext, {
                    ...DV_SENDER,
                    email,
                    isEmailVerified: true,
                    phone,
                    isPhoneVerified: true,
                    type: userType,
                }, 'id name meta')
            })
            test('Must update metadata with providers userProfile', async () => {
                const profile = {
                    ...createTestOIDCProfile({
                        phone_number: phone,
                        phone_number_verified: true,
                    }),
                    extraProperty: 'extraValue',
                }
                const providerInfo = generateProviderInfo()

                const { id } = await syncUser(
                    createMockRequest(),
                    profile,
                    userType,
                    providerInfo,
                )
                expect(id).toBeDefined()
                expect(id).toEqual(condoUser.id)

                const user = await getById('User', id)
                expect(user.meta).toEqual(expect.objectContaining({
                    [providerInfo.name]: profile,
                }))
            })
            test('Must set name from provider if not already defined', async () => {
                expect(condoUser).toHaveProperty('name', null)
                const profile = createTestOIDCProfile({
                    phone_number: phone,
                    phone_number_verified: true,
                })
                expect(profile.name).toBeDefined()

                const { id } = await syncUser(
                    createMockRequest(),
                    profile,
                    userType,
                    generateProviderInfo()
                )
                expect(id).toBeDefined()
                expect(id).toEqual(condoUser.id)

                const user = await getById('User', id)
                expect(user).toHaveProperty('name', profile.name)
            })
            test('Must not override existing condo user name', async () => {
                const originalName = faker.internet.userName()
                const updatedCondoUser = await User.update(serverContext, condoUser.id, {
                    ...DV_SENDER,
                    name: originalName,
                }, 'id name')
                expect(updatedCondoUser).toHaveProperty('name', originalName)

                const profile = createTestOIDCProfile({
                    phone_number: phone,
                    phone_number_verified: true,
                })
                expect(profile.name).toBeDefined()
                expect(profile.name).not.toEqual(originalName)

                const { id } = await syncUser(
                    createMockRequest(),
                    profile,
                    userType,
                    generateProviderInfo()
                )
                expect(id).toBeDefined()
                expect(id).toEqual(condoUser.id)

                const user = await getById('User', id)
                expect(user).toHaveProperty('name', originalName)
            })
            test('Must not set external fields for already created users', async () => {
                const profile = createTestOIDCProfile({
                    phone_number: phone,
                    phone_number_verified: true,
                })

                const { id } = await syncUser(
                    createMockRequest(),
                    profile,
                    userType,
                    generateProviderInfo()
                )
                expect(id).toBeDefined()
                expect(id).toEqual(condoUser.id)

                const user = await getById('User', id)
                expect(user).toHaveProperty('externalPhone', null)
                expect(user).toHaveProperty('isExternalPhoneVerified', false)
                expect(user).toHaveProperty('externalEmail', null)
                expect(user).toHaveProperty('isExternalEmailVerified', false)
                expect(user).toHaveProperty('externalSystemName', null)
            })
            describe('Must fill email field if matched by phone', () => {
                describe('If there is no conflicts', () => {
                    test.each(_generateCombinations({
                        trustEmail: [true, false],
                        emailVerified: [true, false],
                    }).map(c => [JSON.stringify(c), c]))('%p', async (_, { trustEmail, emailVerified }) => {
                        const phone = createTestPhone()
                        const userType = getRandomUserType()
                        const condoUser = await User.create(serverContext, {
                            ...DV_SENDER,
                            type: userType,
                            phone,
                            isPhoneVerified: true,
                        }, 'id phone email isEmailVerified')
                        expect(condoUser).toHaveProperty('phone', phone)
                        expect(condoUser).toHaveProperty('email', null)
                        expect(condoUser).toHaveProperty('isEmailVerified', false)

                        const profile = createTestOIDCProfile({
                            phone_number: phone,
                            phone_number_verified: true,
                            email: createTestEmail(),
                            email_verified: emailVerified,
                        })
                        const providerInfo = generateProviderInfo({ trustEmail })

                        const { id } = await syncUser(
                            createMockRequest(),
                            profile,
                            userType,
                            providerInfo,
                        )
                        expect(id).toBeDefined()
                        expect(id).toEqual(condoUser.id)

                        const user = await getById('User', id)
                        expect(user).toHaveProperty('email', profile.email)
                        expect(user).toHaveProperty('isEmailVerified', trustEmail && emailVerified)
                    })
                })
                describe('If there is conflict with unverified email', () => {
                    test.each(_generateCombinations({
                        trustEmail: [true, false],
                        emailVerified: [true, false],
                    }).map(c => [JSON.stringify(c), c]))('%p', async (_, { trustEmail, emailVerified }) => {
                        const phone = createTestPhone()
                        const email = createTestEmail()
                        const userType = getRandomUserType()
                        const condoUser = await User.create(serverContext, {
                            ...DV_SENDER,
                            type: userType,
                            phone,
                            isPhoneVerified: true,
                        }, 'id phone email isEmailVerified')
                        expect(condoUser).toHaveProperty('phone', phone)
                        expect(condoUser).toHaveProperty('email', null)
                        expect(condoUser).toHaveProperty('isEmailVerified', false)

                        const conflictingUser = await User.create(serverContext, {
                            ...DV_SENDER,
                            type: userType,
                            email,
                            isEmailVerified: false,
                        }, 'id email')
                        expect(conflictingUser).toHaveProperty('email', email)

                        const profile = createTestOIDCProfile({
                            phone_number: phone,
                            phone_number_verified: true,
                            email,
                            email_verified: emailVerified,
                        })
                        const providerInfo = generateProviderInfo({ trustEmail })

                        const { id } = await syncUser(
                            createMockRequest(),
                            profile,
                            userType,
                            providerInfo,
                        )
                        expect(id).toBeDefined()
                        expect(id).toEqual(condoUser.id)

                        const user = await getById('User', id)
                        expect(user).toHaveProperty('email', profile.email)
                        expect(user).toHaveProperty('isEmailVerified', trustEmail && emailVerified)

                        const updatedConflictingUser = await getById('User', conflictingUser.id)
                        expect(updatedConflictingUser).toEqual(expect.objectContaining({
                            email: null,
                            isEmailVerified: false,
                            meta: expect.objectContaining({
                                email,
                            }),
                        }))
                    })
                })
                describe('Must not set email if there is conflict with verified condo user',  () => {
                    test.each(_generateCombinations({
                        trustEmail: [true, false],
                        emailVerified: [true, false],
                    }).map(c => [JSON.stringify(c), c]))('%p', async (_, { trustEmail, emailVerified }) => {
                        const phone = createTestPhone()
                        const email = createTestEmail()
                        const userType = getRandomUserType()
                        const condoUser = await User.create(serverContext, {
                            ...DV_SENDER,
                            type: userType,
                            phone,
                            isPhoneVerified: true,
                        }, 'id phone email isEmailVerified')
                        expect(condoUser).toHaveProperty('phone', phone)
                        expect(condoUser).toHaveProperty('email', null)
                        expect(condoUser).toHaveProperty('isEmailVerified', false)

                        const conflictingUser = await User.create(serverContext, {
                            ...DV_SENDER,
                            type: userType,
                            email,
                            isEmailVerified: true,
                        }, 'id email isEmailVerified')
                        expect(conflictingUser).toHaveProperty('email', email)
                        expect(conflictingUser).toHaveProperty('isEmailVerified', true)

                        const profile = createTestOIDCProfile({
                            phone_number: phone,
                            phone_number_verified: true,
                            email,
                            email_verified: emailVerified,
                        })
                        const providerInfo = generateProviderInfo({ trustEmail })

                        const { id } = await syncUser(
                            createMockRequest(),
                            profile,
                            userType,
                            providerInfo,
                        )
                        expect(id).toBeDefined()
                        expect(id).toEqual(condoUser.id)

                        const user = await getById('User', id)
                        expect(user).toHaveProperty('email', null)
                        expect(user).toHaveProperty('isEmailVerified', false)

                        const updatedConflictingUser = await getById('User', conflictingUser.id)
                        expect(updatedConflictingUser).toEqual(expect.objectContaining({
                            email,
                            isEmailVerified: true,
                        }))
                    })
                })
            })
            describe('Must fill phone field if matched by email', () => {
                describe('If there is no conflicts', () => {
                    test.each(_generateCombinations({
                        trustPhone: [true, false],
                        phoneVerified: [true, false],
                    }).map(c => [JSON.stringify(c), c]))('%p', async (_, { trustPhone, phoneVerified }) => {
                        const email = createTestEmail()
                        const userType = getRandomUserType()
                        const condoUser = await User.create(serverContext, {
                            ...DV_SENDER,
                            type: userType,
                            email,
                            isEmailVerified: true,
                        }, 'id email phone isPhoneVerified')
                        expect(condoUser).toHaveProperty('email', email)
                        expect(condoUser).toHaveProperty('phone', null)
                        expect(condoUser).toHaveProperty('isPhoneVerified', false)

                        const profile = createTestOIDCProfile({
                            phone_number_verified: phoneVerified,
                            email: email,
                            email_verified: true,
                        })
                        const providerInfo = generateProviderInfo({ trustPhone })

                        const { id } = await syncUser(
                            createMockRequest(),
                            profile,
                            userType,
                            providerInfo,
                        )
                        expect(id).toBeDefined()
                        expect(id).toEqual(condoUser.id)

                        const user = await getById('User', id)
                        expect(user).toHaveProperty('phone', profile.phone_number)
                        expect(user).toHaveProperty('isPhoneVerified', trustPhone && phoneVerified)
                    })
                })
                describe('If there is conflict with unverified phone', () => {
                    test.each(_generateCombinations({
                        trustPhone: [true, false],
                        phoneVerified: [true, false],
                    }).map(c => [JSON.stringify(c), c]))('%p', async (_, { trustPhone, phoneVerified }) => {
                        const email = createTestEmail()
                        const phone = createTestPhone()
                        const userType = getRandomUserType()
                        const condoUser = await User.create(serverContext, {
                            ...DV_SENDER,
                            type: userType,
                            email,
                            isEmailVerified: true,
                        }, 'id email phone isPhoneVerified')
                        expect(condoUser).toHaveProperty('email', email)
                        expect(condoUser).toHaveProperty('phone', null)
                        expect(condoUser).toHaveProperty('isPhoneVerified', false)

                        const conflictingUser = await User.create(serverContext, {
                            ...DV_SENDER,
                            type: userType,
                            phone,
                            isPhoneVerified: false,
                        }, 'id phone')
                        expect(conflictingUser).toHaveProperty('phone', phone)

                        const profile = createTestOIDCProfile({
                            phone_number: phone,
                            phone_number_verified: phoneVerified,
                            email,
                            email_verified: true,
                        })
                        const providerInfo = generateProviderInfo({ trustPhone })

                        const { id } = await syncUser(
                            createMockRequest(),
                            profile,
                            userType,
                            providerInfo,
                        )
                        expect(id).toBeDefined()
                        expect(id).toEqual(condoUser.id)

                        const user = await getById('User', id)
                        expect(user).toHaveProperty('phone', profile.phone_number)
                        expect(user).toHaveProperty('isPhoneVerified', trustPhone && phoneVerified)

                        const updatedConflictingUser = await getById('User', conflictingUser.id)
                        expect(updatedConflictingUser).toEqual(expect.objectContaining({
                            phone: null,
                            isPhoneVerified: false,
                            meta: expect.objectContaining({
                                phone,
                            }),
                        }))
                    })
                })
                describe('Must not set phone if there is conflict with verified condo user',  () => {
                    test.each(_generateCombinations({
                        trustPhone: [true, false],
                        phoneVerified: [true, false],
                    }).map(c => [JSON.stringify(c), c]))('%p', async (_, { trustPhone, phoneVerified }) => {
                        const email = createTestEmail()
                        const phone = createTestPhone()
                        const userType = getRandomUserType()
                        const condoUser = await User.create(serverContext, {
                            ...DV_SENDER,
                            type: userType,
                            email,
                            isEmailVerified: true,
                        }, 'id email phone isPhoneVerified')
                        expect(condoUser).toHaveProperty('email', email)
                        expect(condoUser).toHaveProperty('phone', null)
                        expect(condoUser).toHaveProperty('isPhoneVerified', false)

                        const conflictingUser = await User.create(serverContext, {
                            ...DV_SENDER,
                            type: userType,
                            phone,
                            isPhoneVerified: true,
                        }, 'id phone isPhoneVerified')
                        expect(conflictingUser).toHaveProperty('phone', phone)
                        expect(conflictingUser).toHaveProperty('isPhoneVerified', true)

                        const profile = createTestOIDCProfile({
                            phone_number: phone,
                            // NOTE: false here, otherwise there'll be a match by phone
                            phone_number_verified: false,
                            email,
                            email_verified: true,
                        })
                        const providerInfo = generateProviderInfo({ trustPhone })

                        const { id } = await syncUser(
                            createMockRequest(),
                            profile,
                            userType,
                            providerInfo,
                        )
                        expect(id).toBeDefined()
                        expect(id).toEqual(condoUser.id)

                        const user = await getById('User', id)
                        expect(user).toHaveProperty('phone', null)
                        expect(user).toHaveProperty('isPhoneVerified', false)

                        const updatedConflictingUser = await getById('User', conflictingUser.id)
                        expect(updatedConflictingUser).toEqual(expect.objectContaining({
                            phone,
                            isPhoneVerified: true,
                        }))
                    })
                })
            })
        })
        test('Must be able to sync single provider account to multiple user types', async () => {
            const profile = createTestOIDCProfile()
            const providerInfo = generateProviderInfo()
            const { id: staffId } = await syncUser(
                createMockRequest(),
                profile,
                STAFF,
                providerInfo
            )

            const { id: residentId } = await syncUser(
                createMockRequest(),
                profile,
                RESIDENT,
                providerInfo
            )
            expect(staffId).not.toEqual(residentId)
            const staff = await getById('User', staffId)
            expect(staff).toHaveProperty('type', STAFF)
            const resident = await getById('User', residentId)
            expect(resident).toHaveProperty('type', RESIDENT)
        })
    })
    describe('captureUserType', () => {
        let next
        let res
        beforeEach(() => {
            next = jest.fn()
            res = createMockResponse()
        })
        test('Must throw error if user_type not specified in query parameters', () => {
            const req = createMockRequest()
            captureUserType(req, res, next)
            expectExpressNextCallWithGQLError(next, {
                code: 'BAD_USER_INPUT',
                type: 'MISSING_QUERY_PARAMETER',
            })
        })
        describe('Must throw error if user_type is invalid value', () => {
            test.each([SERVICE, faker.random.alphaNumeric(12)])('%p', (userType) => {
                const req = createMockRequest({
                    query: { user_type: userType },
                })
                captureUserType(req, res, next)
                expectExpressNextCallWithGQLError(next, {
                    code: 'BAD_USER_INPUT',
                    type: 'INVALID_USER_TYPE',
                })
            })
        })
        describe('Must save userType to session and call next handler on valid userType', () => {
            test.each([STAFF, RESIDENT])('%p', (userType) => {
                const req = createMockRequest({
                    query: { user_type: userType },
                })
                captureUserType(req, res, next)
                expectExpressNextHandlerCall(next)
                expect(req.session).toHaveProperty('userType', userType)
            })
        })
    })
    describe('ensureUserType', () => {
        let next
        let res
        beforeEach(() => {
            next = jest.fn()
            res = createMockResponse()
        })
        describe('Must ensure valid userType exists in query parameter or in session', () => {
            describe('Query parameter', () => {
                describe('Must pass valid values and save it in session for persistence', () => {
                    test.each([RESIDENT, STAFF])('%p', (userType) => {
                        const req = createMockRequest({
                            query: { user_type: userType },
                        })
                        ensureUserType(req, res, next)
                        expectExpressNextHandlerCall(next)
                        expect(req.session).toHaveProperty('userType', userType)
                    })
                })
                describe('Must throw error if userType is invalid value', () => {
                    test.each([SERVICE, faker.random.alphaNumeric(12)])('%p', (userType) => {
                        const req = createMockRequest({
                            query: { user_type: userType },
                        })
                        ensureUserType(req, res, next)
                        expectExpressNextCallWithGQLError(next, {
                            code: 'BAD_USER_INPUT',
                            type: 'INVALID_USER_TYPE',
                        })
                    })
                })
            })
            describe('Session', () => {
                describe('must validate previously saved userType', () => {
                    test.each([RESIDENT, STAFF])('%p', (userType) => {
                        const req = createMockRequest({
                            session: { userType },
                        })
                        ensureUserType(req, res, next)
                        expectExpressNextHandlerCall(next)
                        expect(req.session).toHaveProperty('userType', userType)
                    })
                    test.each([SERVICE, faker.random.alphaNumeric(12)])('%p', (userType) => {
                        const req = createMockRequest({
                            session: { userType },
                        })
                        ensureUserType(req, res, next)
                        expectExpressNextCallWithGQLError(next, {
                            code: 'BAD_USER_INPUT',
                            type: 'INVALID_USER_TYPE',
                        })
                    })
                })
            })
            test('Must prioritize query parameters over session, since its more explicit',  () => {
                const req = createMockRequest({
                    query: { user_type: STAFF },
                    session: { userType: RESIDENT },
                })
                ensureUserType(req, res, next)
                expectExpressNextHandlerCall(next)
                expect(req.session).toHaveProperty('userType', STAFF)
            })
        })
    })
})