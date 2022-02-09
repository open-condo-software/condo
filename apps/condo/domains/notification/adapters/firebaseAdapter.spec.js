const dayjs = require('dayjs')

const conf = require('@core/config')

const { FirebaseAdapter } = require('./firebaseAdapter')
const { PUSH_FAKE_TOKEN_SUCCESS } = require('@condo/domains/notification/constants/constants')

const FIREBASE_PUSH_TOKEN_TEST = conf['FIREBASE_PUSH_TOKEN_TEST']

const adapter = new FirebaseAdapter()

describe('Firebase adapter utils', () => {
    it('tries to send push notification to default or fake success pushtoken ', async () => {
        const [isOk, result] = await adapter.sendNotification({
            tokensData: [FIREBASE_PUSH_TOKEN_TEST || PUSH_FAKE_TOKEN_SUCCESS],
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

