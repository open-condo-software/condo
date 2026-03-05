jest.doMock('@open-condo/config', () => {
    const conf = jest.requireActual('@open-condo/config')
    return new Proxy(conf, {
        set () {},
        get (_, p) {
            if (p === 'TEMP_PREFERRED_PUSH_TRANSPORTS_BY_APP_ID') {
                return JSON.stringify({
                    'app-id-with-preference': {
                        voip: 'apple',
                        simple: 'apple',
                    },
                })
            }
            return conf[p]
        },
    })
}, { virtual: true })

const index = require('@app/condo/index')

const { makeClient, makeLoggedInAdminClient, setFakeClientMode } = require('@open-condo/keystone/test.utils')

const {
    RemoteClient, syncRemoteClientByTestClient,
} = require('@condo/domains/notification/utils/testSchema')
const { getRandomTokenData, getRandomPushTokenData } = require('@condo/domains/notification/utils/testSchema/utils')

describe('SyncRemoteClientService spec', () => {
    setFakeClientMode(index)

    let admin
    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()
    })
    
    describe('push tokens processing with preference config', () => {

        test.each([
            { remoteClientField: 'pushToken' },
            { remoteClientField: 'pushTokenVoIP' },
        ])('if preference in config is set, overrides $remoteClientField only if transport is same as in config', async ({ remoteClientField }) => {
            const client = await makeClient()
            const isVoIP = remoteClientField === 'pushTokenVoIP'
            const pushTransportField = isVoIP ? 'pushTransportVoIP' : 'pushTransport'

            const pushTokenVoIPParams = { canBeUsedAsVoIP: isVoIP, canBeUsedAsSimplePush: !isVoIP }
            const pushToken = getRandomPushTokenData({ transport: 'apple', ...pushTokenVoIPParams })
            const pushTokens = [
                getRandomPushTokenData({ transport: 'firebase', ...pushTokenVoIPParams }),
                getRandomPushTokenData({ transport: 'redstore', ...pushTokenVoIPParams }),
                pushToken,
                getRandomPushTokenData({ transport: 'huawei', ...pushTokenVoIPParams }),
            ]

            const payloadWithBoth1 = {
                ...getRandomTokenData({ appId: 'app-id-with-preference', [remoteClientField]: null }),
                pushTokens: pushTokens,
            }

            const [device1] = await syncRemoteClientByTestClient(client, payloadWithBoth1)
            const deviceFromDB1 = await RemoteClient.getOne(admin, { id: device1.id })
            expect(deviceFromDB1[remoteClientField]).toEqual(pushToken.token)
            expect(deviceFromDB1[pushTransportField]).toEqual(pushToken.transport)


            const payloadWithBoth2 = {
                ...getRandomTokenData({ appId: 'app-id-without-preference', [remoteClientField]: null }),
                pushTokens: pushTokens,
            }
            const [device2] = await syncRemoteClientByTestClient(client, payloadWithBoth2)
            const deviceFromDB2 = await RemoteClient.getOne(admin, { id: device2.id })
            expect(deviceFromDB2[remoteClientField]).toEqual(pushTokens[0].token)
            expect(deviceFromDB2[pushTransportField]).toEqual(pushTokens[0].transport)

            const payloadWithBoth3 = {
                ...getRandomTokenData({ appId: 'app-id-with-preference', [remoteClientField]: null, [pushTransportField]: null }),
                pushTokens: pushTokens.filter(_pushToken => _pushToken !== pushToken),
            }

            const [device3] = await syncRemoteClientByTestClient(client, payloadWithBoth3)
            const deviceFromDB3 = await RemoteClient.getOne(admin, { id: device3.id })
            expect(deviceFromDB3[remoteClientField]).toBeNull()
            expect(deviceFromDB3[pushTransportField]).toBeNull()

        })

    })
})