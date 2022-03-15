const admin = require('firebase-admin')
const isEmpty = require('lodash/isEmpty')
const isNull = require('lodash/isNull')
const faker = require('faker')

const conf = require('@core/config')

const { PUSH_FAKE_TOKEN_SUCCESS, PUSH_FAKE_TOKEN_FAIL } = require('../constants/constants')

const FIREBASE_CONFIG = conf['FIREBASE_CONFIG_JSON'] && JSON.parse(conf['FIREBASE_CONFIG_JSON'])
const EMPTY_RESULT = {
    responses: [],
    successCount: 0,
    failureCount: 0,
}
const FAKE_ERROR_RESPONSE = {
    success: false,
    error: {
        errorInfo: {
            code: 'fake-error',
            message: 'Fake error mesage',
        },
    },
}

const getFakeSuccessResponse = () => ({
    success: true,
    messageId: `fake-success-message/${faker.datatype.uuid()}`,
})

/**
 * Send push notification to pushToken via app, configured by FIREBASE_CONFIG in .env
 * Attention! Notifications could only be sent to devices, connected via same PROJECT_ID.
 * Attempts to send push notifications to devices, connected through different projects will fail.
 */
class FirebaseAdapter {
    constructor (config = FIREBASE_CONFIG) {
        this.app = null

        if (isEmpty(config)) console.error('Valid FIREBASE_CONFIG_JSON should be provided within .env, and can be retrieved from https://console.firebase.google.com/project/__PROJECT_ID__/settings/serviceaccounts/adminsdk')

        try {
            this.app = admin.initializeApp({ credential: admin.credential.cert(config) })
        } catch (error) {
            console.error('Unable to authorize at FireBase using provided FIREBASE_CONFIG_JSON', error)
        }
    }

    prepareNotification ({ title, body } = {}) {
        if (!title || !body || isEmpty(title) || isEmpty(body)) throw new Error('No notification.title or notification.body')

        return { title, body }
    }

    prepareNotifications (notificationRaw, data, tokensData = []) {
        const notification = this.prepareNotification(notificationRaw)
        const notifications = []
        const fakeNotifications = []

        tokensData.forEach((pushToken) => {
            const isFakeToken = pushToken === PUSH_FAKE_TOKEN_SUCCESS || pushToken === PUSH_FAKE_TOKEN_FAIL
            const target = isFakeToken ? fakeNotifications : notifications

            target.push({
                token: pushToken,
                data,
                notification,
            })
        })

        return [notifications, fakeNotifications]
    }

    injectFakeResults (result, fakeNotifications) {
        const mixed = { ...result }

        fakeNotifications.forEach(({ token }) => {
            if (token === PUSH_FAKE_TOKEN_SUCCESS) {
                mixed.successCount++
                mixed.responses.push(getFakeSuccessResponse())
            }
            if (token === PUSH_FAKE_TOKEN_FAIL) {
                mixed.failureCount++
                mixed.responses.push(FAKE_ERROR_RESPONSE)
            }
        })

        return mixed
    }

    async sendNotification ({ notification, tokensData, data } = {}) {
        console.log('sendNotification:', { notification, tokensData, data })

        // If we were unable to initialize firebase, then we will always fail to deliver pushes
        if (isNull(this.app)) return [false, { error: 'No FIREBASE_CONFIG_JSON provided or invalid' }]
        if (!tokensData || isEmpty(tokensData)) return null

        const [notifications, fakeNotifications] = this.prepareNotifications(notification, data, tokensData)
        let result

        console.log('sendNotification notifications:', notifications)

        if (isEmpty(notifications)) {
            result = this.injectFakeResults(EMPTY_RESULT, fakeNotifications)
        } else {
            result = await this.app.messaging().sendAll(notifications)
                .then((result) => {
                    const extraResult = this.injectFakeResults(result, fakeNotifications)

                    return extraResult
                })
                .catch((error) => {
                    return { state: 'error', error }
                })
        }

        const isOk = !isEmpty(result) && result.successCount > 0

        return [isOk, result]
    }

    // async sendData (args = {}) {
    //     const { pushToken, pushTokens, data } = args
    //     if (!data || isEmpty(data)) throw new Error('No notification')
    //
    //     const payload = this.preparePayload({ data, pushToken, pushTokens })
    //
    //     return this.app.messaging().send({ data, token: pushToken })
    //         .then((messageId) => {
    //             // Response is a message ID string.
    //             return { state: 'success', messageId }
    //         })
    //         .catch((error) => {
    //             return { state: 'error', error }
    //         })
    // }

}

module.exports = {
    FirebaseAdapter,
}


// // Create a list containing up to 500 messages.
// const messages = [];
// messages.push({
//     notification: { title: 'Price drop', body: '5% off all electronics' },
//     token: registrationToken,
// });
// messages.push({
//     notification: { title: 'Price drop', body: '2% off all books' },
//     topic: 'readers-club',
// });
//
// getMessaging().sendAll(messages)
//     .then((response) => {
//         console.log(response.successCount + ' messages were sent successfully');
//     });



// const topicName = 'industry-tech';
//
// const message = {
//     notification: {
//         title: '`$FooCorp` up 1.43% on the day',
//         body: 'FooCorp gained 11.80 points to close at 835.67, up 1.43% on the day.'
//     },
//     android: {
//         notification: {
//             icon: 'stock_ticker_update',
//             color: '#7e55c3'
//         }
//     },
//     topic: topicName,
// };
//
// getMessaging().send(message)
//     .then((response) => {
//         // Response is a message ID string.
//         console.log('Successfully sent message:', response);
//     })
//     .catch((error) => {
//         console.log('Error sending message:', error);
//     });



// const topicName = 'industry-tech';
//
// const message = {
//     notification: {
//         title: 'Sparky says hello!'
//     },
//     android: {
//         notification: {
//             imageUrl: 'https://foo.bar.pizza-monster.png'
//         }
//     },
//     apns: {
//         payload: {
//             aps: {
//                 'mutable-content': 1
//             }
//         },
//         fcm_options: {
//             image: 'https://foo.bar.pizza-monster.png'
//         }
//     },
//     webpush: {
//         headers: {
//             image: 'https://foo.bar.pizza-monster.png'
//         }
//     },
//     topic: topicName,
// };
//
// getMessaging().send(message)
//     .then((response) => {
//         // Response is a message ID string.
//         console.log('Successfully sent message:', response);
//     })
//     .catch((error) => {
//         console.log('Error sending message:', error);
//     });