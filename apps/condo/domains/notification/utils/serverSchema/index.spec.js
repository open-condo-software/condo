const { prepareKeystoneExpressApp, setFakeClientMode } = require('@core/keystone/test.utils')

const { sendMessage } = require('./index')
const { DEVELOPER_IMPORTANT_NOTE_TYPE } = require('../../constants')

let keystone

describe('notification', () => {
    setFakeClientMode(require.resolve('../../../../../index'))

    beforeAll(async () => {
        const result = await prepareKeystoneExpressApp(require.resolve('../../../../../index'))
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

            expect(result.type).toEqual(DEVELOPER_IMPORTANT_NOTE_TYPE)
            expect(result.lang).toEqual('en')
            expect(result.meta).toEqual({
                dv: 1,
                type: 'TEST',
                data: { foo: 'bar', sigma: 1 },
            })
        })
    })
})
