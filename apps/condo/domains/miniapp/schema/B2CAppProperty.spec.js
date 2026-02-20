/**
 * @jest-environment node
 */

const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')
const set = require('lodash/set')

const { AddressServiceClient } = require('@open-condo/clients/address-service-client/AddressServiceClient')
const { FakeAddressServiceClient } = require('@open-condo/clients/address-service-client/FakeAddressServiceClient')
const { GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')
const {
    makeLoggedInAdminClient,
    expectToThrowGQLError, setFakeClientMode,
} = require('@open-condo/keystone/test.utils')

const { WRONG_VALUE } = require('@condo/domains/common/constants/errors')
const {
    INCORRECT_HOUSE_TYPE_ERROR,
    INCORRECT_ADDRESS_ERROR,
} = require('@condo/domains/miniapp/constants')
const {
    createTestB2CApp,
    createTestB2CAppAccessRight,
    createTestB2CAppProperty,
} = require('@condo/domains/miniapp/utils/testSchema')
const { VALID_HOUSE_TYPES } = require('@condo/domains/property/constants/common')
const {
    makeClientWithServiceUser,
} = require('@condo/domains/user/utils/testSchema')

describe('B2CAppProperty spec', () => {
    let admin
    let app
    let permittedUser
    let anotherPermittedUser

    setFakeClientMode(index, { excludeApps: ['OIDCMiddleware'] })

    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()

        permittedUser = await makeClientWithServiceUser()
        const [b2cApp] = await createTestB2CApp(admin)
        app = b2cApp
        await createTestB2CAppAccessRight(admin, permittedUser.user, app)

        anotherPermittedUser = await makeClientWithServiceUser()
        const [secondApp] = await createTestB2CApp(admin)
        await createTestB2CAppAccessRight(admin, anotherPermittedUser.user, secondApp)
    })

    describe('Validation tests', () => {

        // TODO(DOMA-8887) Need to start condo in fake mode to have an ability to mock the `search` function.
        describe.skip('Should validate address and throw error', () => {

            afterEach(() => {
                jest.restoreAllMocks()
            })

            test('If house type is not supported', async () => {

                jest.spyOn(AddressServiceClient.prototype, 'search').mockImplementationOnce(async (s) => {
                    const cli = new FakeAddressServiceClient(faker.internet.url())
                    const result = await cli.search(s)
                    set(result, ['addressMeta', 'data', 'house_type_full'], faker.datatype.string(8))
                    return result
                })

                await expectToThrowGQLError(async () => {
                    await createTestB2CAppProperty(admin, app)
                }, {
                    code: BAD_USER_INPUT,
                    type: WRONG_VALUE,
                    variable: ['data', 'address'],
                    message: `${INCORRECT_HOUSE_TYPE_ERROR}. Valid values are: [${VALID_HOUSE_TYPES.join(', ')}]`,
                })
            })
            test('If address suggestion don\'t match input address', async () => {
                jest.spyOn(AddressServiceClient.prototype, 'search').mockImplementationOnce(async (s) => {
                    const cli = new FakeAddressServiceClient(faker.internet.url())
                    const result = await cli.search(s)
                    set(result, ['addressMeta', 'value'], faker.address.streetAddress())
                    return result
                })
                await expectToThrowGQLError(async () => {
                    await createTestB2CAppProperty(admin, app)
                }, {
                    code: BAD_USER_INPUT,
                    type: WRONG_VALUE,
                    variable: ['data', 'address'],
                    message: INCORRECT_ADDRESS_ERROR,
                })
            })
        })
    })
})
