const { faker } = require('@faker-js/faker')

const conf = require('@open-condo/config')
const {
    makeLoggedInAdminClient,
    makeClient,
} = require('@open-condo/keystone/test.utils')

const { 
    SEND_VOIP_CALL_CANCEL_MESSAGE_CANCEL_REASON_ANSWERED, SEND_VOIP_CALL_CANCEL_MESSAGE_CANCEL_REASON_ENDED,
    CALL_STATUS_STARTED, CALL_STATUS_ENDED, CALL_STATUS_ANSWERED,
} = require('@condo/domains/miniapp/constants')
const {
    createTestB2CApp,
    sendVoIPCallStartMessageByTestClient,
    createTestB2CAppProperty,
    createTestB2CAppAccessRight,
    createTestB2CAppAccessRightSet,
    createTestAppMessageSetting,
    getVoIPCallStatusByTestClient,
    sendVoIPCallCancelMessageByTestClient,
    prepareVoIPUser,
} = require('@condo/domains/miniapp/utils/testSchema')
const {
    VOIP_INCOMING_CALL_MESSAGE_TYPE,
    CANCELED_CALL_MESSAGE_PUSH_TYPE,
} = require('@condo/domains/notification/constants/constants')
const { Message } = require('@condo/domains/notification/utils/testSchema')
const { FLAT_UNIT_TYPE } = require('@condo/domains/property/constants/common')
const { makeClientWithResidentAccessAndProperty } = require('@condo/domains/property/utils/testSchema')
const { makeClientWithSupportUser, makeClientWithNewRegisteredAndLoggedInUser,
    makeClientWithServiceUser,
} = require('@condo/domains/user/utils/testSchema')

const SERVER_URL = conf.SERVER_URL

describe('GetVoIPCallStatusService', () => {
    let admin

    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()
    })

    describe('Access', () => {
        let b2cApp
        let property
        let organization
        let serviceUser
        let b2cAccessRight
        let callId
        let callStatusJwtToken

        beforeAll(async () => {
            const [testB2CApp] = await createTestB2CApp(admin)
            b2cApp = testB2CApp

            const { organization: testOrganization, property: testProperty } = await makeClientWithResidentAccessAndProperty()
            property = testProperty
            organization = testOrganization
            await createTestB2CAppProperty(admin, b2cApp, { address: testProperty.address, addressMeta: testProperty.addressMeta })
            serviceUser = await makeClientWithServiceUser();
            [b2cAccessRight] = await createTestB2CAppAccessRight(admin, serviceUser.user, b2cApp)

            callId = faker.datatype.uuid()
            const unitName = faker.random.alphaNumeric(8)
            const unitType = FLAT_UNIT_TYPE
            const { user } = await prepareVoIPUser({ admin, organization, property, unitName, unitType })
            await sendVoIPCallStartMessageByTestClient(admin, {
                app: { id: b2cApp.id },
                addressKey: property.addressKey,
                unitName,
                unitType,
                callData: {
                    callId,
                    b2cAppCallData: { B2CAppContext: '' },
                },
            })
            const [msg] = await Message.getAll(admin, { type: VOIP_INCOMING_CALL_MESSAGE_TYPE, user: { id: user.id } }, { first: 1, sortBy: ['createdAt_DESC'] })
            callStatusJwtToken = JSON.parse(new URL(msg.meta.data.getVoIPCallStatusUrl).searchParams.get('data')).token
        })

        const TEST_CASES = [
            { name: 'admin can', getClient: () => admin },
            { name: 'support can', getClient: () => makeClientWithSupportUser() },
            { name: 'user can', getClient: () => makeClientWithNewRegisteredAndLoggedInUser() },
            { name: 'anonymous can', getClient: () => makeClient() },
        ]

        test.each(TEST_CASES)('$name', async ({ getClient }) => {
            const client = await getClient()
            const [result] = await getVoIPCallStatusByTestClient(client, { token: callStatusJwtToken })
            expect(result).toHaveProperty('status', CALL_STATUS_STARTED)
        })
    })

    describe('Logic', () => {
        let serviceUser
        let organization
        let property
        let b2cApp

        beforeAll(async () => {
            const [testB2CApp] = await createTestB2CApp(admin)
            b2cApp = testB2CApp

            const { organization: testOrganization, property: testProperty } = await makeClientWithResidentAccessAndProperty()
            organization = testOrganization
            property = testProperty
            await createTestB2CAppProperty(admin, b2cApp, { address: testProperty.address, addressMeta: testProperty.addressMeta })
            serviceUser = await makeClientWithServiceUser()
            const [accessRightSet] = await createTestB2CAppAccessRightSet(admin, b2cApp, { canExecuteSendVoIPCallStartMessage: true, canExecuteSendVoIPCallCancelMessage: true })
            await createTestB2CAppAccessRight(admin, serviceUser.user, b2cApp, { accessRightSet: { connect: { id: accessRightSet.id } } })
            await createTestAppMessageSetting(admin, { b2cApp, numberOfNotificationInWindow: 1000, type: VOIP_INCOMING_CALL_MESSAGE_TYPE })
        })

        test(`Receives ${CALL_STATUS_STARTED} if call started`, async () => {
            const unitName = faker.random.alphaNumeric(8)
            const unitType = FLAT_UNIT_TYPE
            const callId = faker.random.alphaNumeric(8)
            const { user } = await prepareVoIPUser({ admin, organization, property, unitName, unitType })
            await sendVoIPCallStartMessageByTestClient(serviceUser, {
                app: { id: b2cApp.id },
                addressKey: property.addressKey,
                unitName,
                unitType,
                callData: {
                    callId,
                    b2cAppCallData: { B2CAppContext: '' },
                },
            })
            const [msg] = await Message.getAll(admin, { type: VOIP_INCOMING_CALL_MESSAGE_TYPE, user: { id: user.id } }, { sortBy: ['createdAt_DESC'], first: 1 })
            const callStatusJwtToken = JSON.parse(new URL(msg.meta.data.getVoIPCallStatusUrl).searchParams.get('data')).token

            const [{ status }] = await getVoIPCallStatusByTestClient(await makeClient(), {
                token: callStatusJwtToken,
            })
            expect(status).toEqual(CALL_STATUS_STARTED)
        })

        test(`Receives ${CALL_STATUS_ENDED} if call ended`, async () => {
            const unitName = faker.random.alphaNumeric(8)
            const unitType = FLAT_UNIT_TYPE
            const callId = faker.random.alphaNumeric(8)
            const { user } = await prepareVoIPUser({ admin, organization, property, unitName, unitType })
            await sendVoIPCallStartMessageByTestClient(serviceUser, {
                app: { id: b2cApp.id },
                addressKey: property.addressKey,
                unitName,
                unitType,
                callData: {
                    callId,
                    b2cAppCallData: { B2CAppContext: '' },
                },
            })
            const [msg] = await Message.getAll(admin, { type: VOIP_INCOMING_CALL_MESSAGE_TYPE, user: { id: user.id } }, { sortBy: ['createdAt_DESC'], first: 1 })
            const callStatusJwtToken = JSON.parse(new URL(msg.meta.data.getVoIPCallStatusUrl).searchParams.get('data')).token
            await sendVoIPCallCancelMessageByTestClient(serviceUser, {
                app: { id: b2cApp.id },
                addressKey: property.addressKey,
                unitName,
                unitType,
                callData: {
                    callId,
                    reason: SEND_VOIP_CALL_CANCEL_MESSAGE_CANCEL_REASON_ENDED,
                },
            })

            const [{ status }] = await getVoIPCallStatusByTestClient(await makeClient(), {
                token: callStatusJwtToken,
            })
            expect(status).toEqual(CALL_STATUS_ENDED)
        })

        test(`Receives ${CALL_STATUS_ANSWERED} if call ended with answer`, async () => {
            const unitName = faker.random.alphaNumeric(8)
            const unitType = FLAT_UNIT_TYPE
            const callId = faker.random.alphaNumeric(8)
            const { user } = await prepareVoIPUser({ admin, organization, property, unitName, unitType })
            const addressKey = property.addressKey
            await sendVoIPCallStartMessageByTestClient(serviceUser, {
                app: { id: b2cApp.id },
                addressKey,
                unitName,
                unitType,
                callData: {
                    callId,
                    b2cAppCallData: { B2CAppContext: '' },
                },
            })
            const [msg] = await Message.getAll(admin, { type: VOIP_INCOMING_CALL_MESSAGE_TYPE, user: { id: user.id } }, { sortBy: ['createdAt_DESC'], first: 1 })
            const callStatusJwtToken = JSON.parse(new URL(msg.meta.data.getVoIPCallStatusUrl).searchParams.get('data')).token

            await sendVoIPCallCancelMessageByTestClient(serviceUser, {
                app: { id: b2cApp.id },
                addressKey,
                unitName,
                unitType,
                callData: {
                    callId,
                    reason: SEND_VOIP_CALL_CANCEL_MESSAGE_CANCEL_REASON_ANSWERED,
                },
            })

            const [{ status }] = await getVoIPCallStatusByTestClient(await makeClient(), {
                token: callStatusJwtToken,
            })
            expect(status).toEqual(CALL_STATUS_ANSWERED)
        })

    })

    describe('express route', () => {
        let serviceUser
        let organization
        let property
        let b2cApp

        async function fetchGetCallStatusUrl (url) {
            const result = await fetch(url)
            return result.json()
        }

        beforeAll(async () => {
            const [testB2CApp] = await createTestB2CApp(admin)
            b2cApp = testB2CApp

            const { organization: testOrganization, property: testProperty } = await makeClientWithResidentAccessAndProperty()
            organization = testOrganization
            property = testProperty
            await createTestB2CAppProperty(admin, b2cApp, { address: testProperty.address, addressMeta: testProperty.addressMeta })
            serviceUser = await makeClientWithServiceUser()
            const [accessRightSet] = await createTestB2CAppAccessRightSet(admin, b2cApp, { canExecuteSendVoIPCallStartMessage: true, canExecuteSendVoIPCallCancelMessage: true })
            await createTestB2CAppAccessRight(admin, serviceUser.user, b2cApp, { accessRightSet: { connect: { id: accessRightSet.id } } })
            await createTestAppMessageSetting(admin, { b2cApp, numberOfNotificationInWindow: 1000, type: VOIP_INCOMING_CALL_MESSAGE_TYPE })
        })

        test('Receives url and timeout in start and end pushes', async () => {
            const unitName = faker.random.alphaNumeric(8)
            const unitType = FLAT_UNIT_TYPE
            const callId = faker.random.alphaNumeric(8)
            const { user } = await prepareVoIPUser({ admin, organization, property, unitName, unitType })
            const client = await makeClient()
            await sendVoIPCallStartMessageByTestClient(serviceUser, {
                app: { id: b2cApp.id },
                addressKey: property.addressKey,
                unitName,
                unitType,
                callData: {
                    callId,
                    b2cAppCallData: { B2CAppContext: '' },
                },
            })
            let [msg] = await Message.getAll(admin, { type: VOIP_INCOMING_CALL_MESSAGE_TYPE, user: { id: user.id } }, { sortBy: ['createdAt_DESC'], first: 1 })
            let { getVoIPCallStatusUrl, getVoIPCallStatusTimeout } = msg.meta.data

            expect(getVoIPCallStatusUrl).toEqual(expect.any(String))
            expect(getVoIPCallStatusTimeout).toEqual(expect.any(String))
            getVoIPCallStatusUrl = getVoIPCallStatusUrl.replace(SERVER_URL, client.serverUrl)

            const status1 = await fetchGetCallStatusUrl(getVoIPCallStatusUrl)
            expect(status1.status).toEqual(CALL_STATUS_STARTED)

            await sendVoIPCallCancelMessageByTestClient(serviceUser, {
                app: { id: b2cApp.id },
                addressKey: property.addressKey,
                unitName,
                unitType,
                callData: {
                    callId,
                    reason: SEND_VOIP_CALL_CANCEL_MESSAGE_CANCEL_REASON_ENDED,
                },
            });
            [msg] = await Message.getAll(admin, { type: CANCELED_CALL_MESSAGE_PUSH_TYPE, user: { id: user.id } }, { sortBy: ['createdAt_DESC'], first: 1 })

            expect(msg.meta.data.getVoIPCallStatusUrl).not.toBeDefined()
            expect(msg.meta.data.getVoIPCallStatusTimeout).toEqual(expect.any(String))

            const status2 = await fetchGetCallStatusUrl(getVoIPCallStatusUrl)
            expect(status2.status).toEqual(CALL_STATUS_ENDED)
        })

    })

})