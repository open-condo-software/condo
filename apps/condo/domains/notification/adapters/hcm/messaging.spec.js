const { get } = require('lodash')

const conf = require('@open-condo/config')

const {
    HCM_CONFIG_ENV,
    HCM_CONFIG_TEST_PUSHTOKEN_ENV_RESIDENT,
    HCM_CONFIG_TEST_PUSHTOKEN_ENV_MASTER,
    APP_RESIDENT_KEY,
    APP_MASTER_KEY,
} = require('@condo/domains/notification/constants/constants')

const { PUSH_SUCCESS_CODE } = require('./constants')
const HCMMessaging = require('./messaging')

const HCM_CONFIG = conf[HCM_CONFIG_ENV] ? JSON.parse(conf[HCM_CONFIG_ENV]) : null
const HCM_PUSH_TOKEN_TEST_RESIDENT = conf[HCM_CONFIG_TEST_PUSHTOKEN_ENV_RESIDENT] || null
const HCM_PUSH_TOKEN_TEST_MASTER = conf[HCM_CONFIG_TEST_PUSHTOKEN_ENV_MASTER] || null

describe('Firebase adapter utils', () => {
    it('should succeed sending push notification to real resident push token ', async () => {
        const residentConfig = get(HCM_CONFIG, APP_RESIDENT_KEY)

        if (!HCM_PUSH_TOKEN_TEST_RESIDENT || !residentConfig) return

        const hcmMessaging = new HCMMessaging(residentConfig)
        const message = {
            data: JSON.stringify({
                '_title': 'Test push for HMS',
                '_body': 'This is a test push.',
                'target': 'ffdd8c37-90b4-4729-b2a9-091b6eb74c66',
                'userId': 'ffdd8c37-90b4-4729-b2a9-091b6eb74c66',
                'batchId': '175091ed-040a-41a9-a2cb-a7d4856aaf19',
                'notificationId': '81a0c2f2-6f0a-49bc-9ec7-db848deb1fc0',
                'url': 'https://v1.doma.ai/billing/receipts/',
            }),
            token: [HCM_PUSH_TOKEN_TEST_RESIDENT],
        }

        const result = await hcmMessaging.send(message)

        expect(result.code).toEqual(PUSH_SUCCESS_CODE)
        expect(result.requestId).toBeDefined()
    })

    it('should succeed sending push notification to real master push token ', async () => {
        const masterConfig = get(HCM_CONFIG, APP_MASTER_KEY)

        if (!HCM_PUSH_TOKEN_TEST_MASTER || !masterConfig) return

        const hcmMessaging = new HCMMessaging(masterConfig)
        const message = {
            data: JSON.stringify({
                '_title': 'Test push for HMS',
                '_body': 'This is a test push.',
                'target': 'ffdd8c37-90b4-4729-b2a9-091b6eb74c66',
                'userId': 'ffdd8c37-90b4-4729-b2a9-091b6eb74c66',
                'batchId': '175091ed-040a-41a9-a2cb-a7d4856aaf19',
                'notificationId': '81a0c2f2-6f0a-49bc-9ec7-db848deb1fc0',
                'url': 'https://v1.doma.ai/billing/receipts/',
            }),
            token: [HCM_PUSH_TOKEN_TEST_MASTER],
        }

        const result = await hcmMessaging.send(message)

        expect(result.code).toEqual(PUSH_SUCCESS_CODE)
        expect(result.requestId).toBeDefined()
    })
})
