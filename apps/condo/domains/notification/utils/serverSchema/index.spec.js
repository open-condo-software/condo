/**
 * @jest-environment node
 */

const { prepareKeystoneExpressApp, setFakeClientMode } = require('@open-condo/keystone/test.utils')

const { sendMessage, Message } = require('./index')
const { DEVELOPER_IMPORTANT_NOTE_TYPE } = require('../../constants/constants')

let keystone

describe('notification', () => {
    const keystoneIndex = require.resolve('../../../../index')
    setFakeClientMode(require.resolve(keystoneIndex))

    beforeAll(async () => {
        const result = await prepareKeystoneExpressApp(require.resolve(keystoneIndex))
        keystone = result.keystone
    })

    describe('sendMessage', () => {
        it('send DEVELOPER_IMPORTANT_NOTE message', async () => {
            const result = await sendMessage(keystone, {
                sender: { dv: 1, fingerprint: 'noname' },
                to: { email: 'test@example.com' },
                lang: 'en',
                type: DEVELOPER_IMPORTANT_NOTE_TYPE,
                meta: {
                    dv: 1,
                    type: 'TEST',
                    data: { foo: 'bar', sigma: 1 },
                },
            })

            const [message] = await Message.getAll(keystone, { id: result.id })
            expect(message.type).toEqual(DEVELOPER_IMPORTANT_NOTE_TYPE)
            expect(message.lang).toEqual('en')
            expect(message.meta).toEqual({
                dv: 1,
                type: 'TEST',
                data: { foo: 'bar', sigma: 1 },
            })
        })
    })
})
