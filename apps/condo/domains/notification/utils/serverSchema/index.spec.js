/**
 * @jest-environment node
 */

const { setFakeClientMode } = require('@open-condo/keystone/test.utils')

const { sendMessage, Message } = require('./index')
const { DEVELOPER_IMPORTANT_NOTE_TYPE } = require('../../constants/constants')

const index = require('@app/condo/index')
const { keystone } = index

describe('notification', () => {
    setFakeClientMode(index)

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

            const message = await Message.getOne(keystone, { id: result.id })
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
