require('@condo/domains/common/utils/testSchema/env').mockEnv({
    VOIP_CALL_STATUS_JWT_SECRET: 'voip-test-secret',
})
jest.mock('@open-condo/keystone/kv', () => ({ getKVClient: jest.fn() }))
jest.mock('@open-condo/keystone/schema', () => ({ getByCondition: jest.fn(), find: jest.fn() }))
jest.mock('@open-condo/miniapp-utils/helpers/uuid', () => ({ generateUUIDv4: jest.fn() }))
jest.mock('@condo/domains/miniapp/utils/serverSchema', () => ({}))
jest.mock('@condo/domains/notification/utils/serverSchema', () => ({ sendMessage: jest.fn() }))
jest.mock('@condo/domains/property/utils/serverSchema/helpers', () => ({}))
jest.mock('@condo/domains/resident/utils/serverSchema', () => ({}))

const { randomUUID } = require('crypto')

const conf = require('@open-condo/config')

const { SEND_VOIP_CALL_CANCEL_MESSAGE_CANCEL_REASON_ENDED } = require('@condo/domains/miniapp/constants')
const { VOIP_INCOMING_CALL_MESSAGE_TYPE, CANCELED_CALL_MESSAGE_PUSH_TYPE } = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')

const { sendMessageToUser } = require('./sendVoIPCallMessage')
const { generateCallStatusId, buildCallStatusToken } = require('./voip')

describe('Compact VoIP push URLs', () => {
    let args

    beforeEach(() => {
        jest.clearAllMocks()
        sendMessage.mockResolvedValue({ id: 'message' })
        args = {
            context: {},
            voipMessageType: VOIP_INCOMING_CALL_MESSAGE_TYPE,
            b2cApp: { id: randomUUID(), name: 'Intercom' },
            property: { addressKey: randomUUID() },
            resident: { id: randomUUID(), address: 'Building 1' },
            contact: { id: randomUUID() },
            user: { id: randomUUID() },
            dv: 1,
            sender: { dv: 1, fingerprint: 'send-voip-call' },
            callStatusToken: buildCallStatusToken(generateCallStatusId()),
            hasSendDTMFUrl: true,
            callData: {
                callId: randomUUID(),
                nativeCallData: {
                    voipAddress: 'sip.example.com',
                    voipLogin: 'resident',
                    voipPassword: 'test-password',
                    voipPanels: [{ name: 'Entrance', dtmfCommand: '#' }, { name: 'Gate', dtmfCommand: '*123#' }],
                },
            },
        }
    })

    test('uses only the signed token and panel code in query parameters', async () => {
        await sendMessageToUser(args)
        const data = sendMessage.mock.calls[0][1].meta.data
        const statusUrl = new URL(data.getVoIPCallStatusUrl)
        expect(statusUrl.origin).toBe(new URL(conf.SERVER_URL).origin)
        expect(statusUrl.pathname).toBe('/api/voip/getVoIPCallStatus')
        expect([...statusUrl.searchParams]).toEqual([['data.token', args.callStatusToken]])
        const panels = JSON.parse(data.voipPanels)
        for (const panel of panels) {
            const url = new URL(panel.sendDTMFUrl)
            expect(url.origin).toBe(new URL(conf.SERVER_URL).origin)
            expect(url.pathname).toBe('/api/voip/sendDTMFToB2CApp')
            expect([...url.searchParams]).toEqual([['data.token', args.callStatusToken], ['data.data.dtmfCode', panel.dtmfCommand]])
        }
        expect(data.getVoIPCallStatusTimeout).toEqual(expect.any(String))
        expect(data.sendDTMFTimeout).toEqual(expect.any(String))
    })

    test('preserves custom panels without substituting generated DTMF URLs', async () => {
        const panels = [{ dtmfCommand: '#', sendDTMFUrl: 'https://example.com/custom' }]
        await sendMessageToUser({ ...args, customVoIPValues: { voipPanels: JSON.stringify(panels) } })
        expect(sendMessage.mock.calls[0][1].meta.data.voipPanels).toBe(JSON.stringify(panels))
    })

    test('does not add status or DTMF URLs to cancel pushes', async () => {
        await sendMessageToUser({
            ...args,
            voipMessageType: CANCELED_CALL_MESSAGE_PUSH_TYPE,
            callData: { callId: args.callData.callId, reason: SEND_VOIP_CALL_CANCEL_MESSAGE_CANCEL_REASON_ENDED },
            voipIncomingCallId: 'incoming-message',
        })
        const data = sendMessage.mock.calls[0][1].meta.data
        expect(data.getVoIPCallStatusUrl).toBeUndefined()
        expect(data.voipPanels).toBeUndefined()
        expect(data.getVoIPCallStatusTimeout).toEqual(expect.any(String))
    })
})
