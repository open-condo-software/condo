const dayjs = require('dayjs')

const { FirebaseAdapter } = require('./firebaseAdapter')
const { PUSH_FAKE_TOKEN_SUCCESS } = require('@condo/domains/notification/constants/constants')

const adapter = new FirebaseAdapter()

describe('Firebase adapter utils', () => {
    it('tries to send push notification to fake success pushtoken ', async () => {
        const [isOk, result] = await adapter.sendNotification({
            tokensData: [PUSH_FAKE_TOKEN_SUCCESS],
            notification: {
                title: 'Doma.ai',
                body: `${dayjs().format()} Condo greets you!`,
            },
            data: {
                app : 'condo',
                type: 'notification',
            },
        })

        expect(isOk).toEqual(true)
        expect(result).toBeDefined()
    })
})

