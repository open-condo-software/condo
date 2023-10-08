/**
 * @jest-environment node
 */

const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const { setFakeClientMode, makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')

const { DATE_FORMAT } = require('@condo/domains/common/utils/date')
const {
    RESIDENT_UPGRADE_APP_TYPE, STAFF_UPGRADE_APP_TYPE,
    PUSH_TRANSPORT_FIREBASE, PUSH_TRANSPORT_HUAWEI,
} = require('@condo/domains/notification/constants/constants')
const { Message, syncRemoteClientByTestClient } = require('@condo/domains/notification/utils/testSchema')
const { makeClientWithResidentUser, makeClientWithStaffUser } = require('@condo/domains/user/utils/testSchema')

const { makeMessageKey, sendRemoteClientsUpgradeAppNotifications } = require('./sendRemoteClientsUpgradeAppNotifications')

const { getRandomTokenData } = require('../utils/testSchema/helpers')


describe('sendResidentsNoAccountNotifications', () => {
    setFakeClientMode(index)

    it('sends notification of RESIDENT_UPGRADE_APP_TYPE for resident user with unknown appId and firebase pushTransport', async () => {
        const admin = await makeLoggedInAdminClient()
        const residentUser = await makeClientWithResidentUser()
        const payload = getRandomTokenData({
            pushTransport: PUSH_TRANSPORT_FIREBASE,
            appId: 'unknown',
        })
        const [device] = await syncRemoteClientByTestClient(residentUser, payload)

        await sendRemoteClientsUpgradeAppNotifications({ deviceId: device.deviceId, appId: device.appId })

        const today = dayjs().format(DATE_FORMAT)
        const notificationKey = makeMessageKey(device.owner.id, today)
        const messageWhere = {
            type: RESIDENT_UPGRADE_APP_TYPE,
            uniqKey: notificationKey,
        }
        const message = await Message.getOne(admin, messageWhere)

        expect(message).toBeDefined()
    })

    it('sends notification of STAFF_UPGRADE_APP_TYPE for staff user with unknown appId and firebase pushTransport', async () => {
        const admin = await makeLoggedInAdminClient()
        const residentUser = await makeClientWithStaffUser()
        const payload = getRandomTokenData({
            pushTransport: PUSH_TRANSPORT_FIREBASE,
            appId: 'unknown',
        })
        const [device] = await syncRemoteClientByTestClient(residentUser, payload)

        await sendRemoteClientsUpgradeAppNotifications({ deviceId: device.deviceId, appId: device.appId })

        const today = dayjs().format(DATE_FORMAT)
        const notificationKey = makeMessageKey(device.owner.id, today)
        const messageWhere = {
            type: STAFF_UPGRADE_APP_TYPE,
            uniqKey: notificationKey,
        }
        const message = await Message.getOne(admin, messageWhere)

        expect(message).toBeDefined()
    })

    it('sends nothing for resident user with unknown appId and non-firebase pushTransport', async () => {
        const admin = await makeLoggedInAdminClient()
        const residentUser = await makeClientWithResidentUser()
        const payload = getRandomTokenData({
            pushTransport: PUSH_TRANSPORT_HUAWEI,
            appId: 'unknown',
        })
        const [device] = await syncRemoteClientByTestClient(residentUser, payload)

        await sendRemoteClientsUpgradeAppNotifications({ deviceId: device.deviceId, appId: device.appId })

        const today = dayjs().format(DATE_FORMAT)
        const notificationKey = makeMessageKey(device.owner.id, today)
        const messageWhere = {
            type: RESIDENT_UPGRADE_APP_TYPE,
            uniqKey: notificationKey,
        }
        const message = await Message.getOne(admin, messageWhere)

        expect(message).toBeUndefined()
    })

    it('sends nothing for resident user with non-unknown appId and firebase pushTransport', async () => {
        const admin = await makeLoggedInAdminClient()
        const residentUser = await makeClientWithResidentUser()
        const payload = getRandomTokenData({
            pushTransport: PUSH_TRANSPORT_FIREBASE,
            appId: faker.datatype.uuid(),
        })
        const [device] = await syncRemoteClientByTestClient(residentUser, payload)

        await sendRemoteClientsUpgradeAppNotifications({ deviceId: device.deviceId, appId: device.appId })

        const today = dayjs().format(DATE_FORMAT)
        const notificationKey = makeMessageKey(device.owner.id, today)
        const messageWhere = {
            type: RESIDENT_UPGRADE_APP_TYPE,
            uniqKey: notificationKey,
        }
        const message = await Message.getOne(admin, messageWhere)

        expect(message).toBeUndefined()
    })

    it('sends only one notification of RESIDENT_UPGRADE_APP_TYPE for resident user with unknown appId and firebase pushTransport', async () => {
        const admin = await makeLoggedInAdminClient()
        const residentUser = await makeClientWithResidentUser()
        const payload = getRandomTokenData({
            pushTransport: PUSH_TRANSPORT_FIREBASE,
            appId: 'unknown',
        })
        const [device] = await syncRemoteClientByTestClient(residentUser, payload)

        await sendRemoteClientsUpgradeAppNotifications({ deviceId: device.deviceId, appId: device.appId })
        await sendRemoteClientsUpgradeAppNotifications({ deviceId: device.deviceId, appId: device.appId })

        const today = dayjs().format(DATE_FORMAT)
        const notificationKey = makeMessageKey(device.owner.id, today)
        const messageWhere = {
            type: RESIDENT_UPGRADE_APP_TYPE,
            uniqKey: notificationKey,
        }
        const messages = await Message.getAll(admin, messageWhere)

        expect(messages).toHaveLength(1)
    })

})