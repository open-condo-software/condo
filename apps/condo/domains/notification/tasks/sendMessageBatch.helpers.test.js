const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')
const { isString } = require('lodash')

const { md5 } = require('@condo/domains/common/utils/crypto')
const {
    SMS_TRANSPORT,
    EMAIL_TRANSPORT,
    PUSH_TRANSPORT,
    CUSTOM_CONTENT_MESSAGE_TYPE,
    CUSTOM_CONTENT_MESSAGE_PUSH_TYPE,
    CUSTOM_CONTENT_MESSAGE_EMAIL_TYPE,
    CUSTOM_CONTENT_MESSAGE_SMS_TYPE,
} = require('@condo/domains/notification/constants/constants')

const {
    selectTarget,
    detectTransportType,
    getUniqKey,
    normalizeTarget,
    prepareMessageData,
    DATE_FORMAT,
    EMAIL_FROM,
} = require('./sendMessageBatch.helpers')

describe('sendMessageBatch', () => {
    afterAll( () => {
        if (global.gc) {
            global.gc()
        }
    })
    describe('helpers', () => {
        describe('selectTarget', () => {
            it('selects proper target type', async () => {
                const user = {
                    id: faker.datatype.uuid(),
                    remoteClient: `rc:${faker.datatype.uuid()}`,
                    phone: faker.phone.number('+79#########'),
                    email: `${faker.random.alphaNumeric(8)}@${faker.random.alphaNumeric(8)}.com`,
                }
                const brokenEmail = `${faker.random.alphaNumeric(8)}@${faker.random.alphaNumeric(8)}`
                const brokenPhone = faker.phone.number('+79########')
                const landLinePhone = faker.phone.number('+7343#######')
                const brokenLandLinePhone = faker.phone.number('+7343######')

                expect(selectTarget(user.phone)).toEqual({ to: { phone: user.phone } })
                expect(selectTarget(user.email)).toEqual({ to: { email: user.email }, emailFrom: EMAIL_FROM })
                expect(selectTarget(user.id)).toEqual({ to: { user: { id: user.id } } })
                expect(selectTarget(user.remoteClient)).toEqual({ to: { remoteClient: { id: user.remoteClient.replace('rc:', '') } } })
                expect(selectTarget(brokenEmail)).toBeNull()
                expect(selectTarget(brokenPhone)).toBeNull()
                expect(selectTarget(landLinePhone)).toBeNull()
                expect(selectTarget(brokenLandLinePhone)).toBeNull()
                expect(selectTarget(faker.random.alphaNumeric(8))).toBeNull()
                expect(selectTarget(new Date())).toBeNull()
                expect(selectTarget(17)).toBeNull()
                expect(selectTarget(null)).toBeNull()
                expect(selectTarget()).toBeNull()
            })
        })

        describe('detectTransportType', () => {
            it('properly detects transport type', async () => {
                const user = {
                    id: faker.datatype.uuid(),
                    remoteClient: `rc:${faker.datatype.uuid()}`,
                    phone: faker.phone.number('+79#########'),
                    email: `${faker.random.alphaNumeric(8)}@${faker.random.alphaNumeric(8)}.com`,
                }
                const brokenEmail = `${faker.random.alphaNumeric(8)}@${faker.random.alphaNumeric(8)}`
                const brokenPhone = faker.phone.number('+79########')
                const landLinePhone = faker.phone.number('+7343#######')
                const brokenLandLinePhone = faker.phone.number('+7343######')

                expect(detectTransportType(user.phone)).toEqual(SMS_TRANSPORT)
                expect(detectTransportType(user.email)).toEqual(EMAIL_TRANSPORT)
                expect(detectTransportType(user.id)).toEqual(PUSH_TRANSPORT)
                expect(detectTransportType(user.remoteClient)).toEqual(PUSH_TRANSPORT)
                expect(detectTransportType(brokenEmail)).toBeNull()
                expect(detectTransportType(brokenPhone)).toBeNull()
                expect(detectTransportType(landLinePhone)).toBeNull()
                expect(detectTransportType(brokenLandLinePhone)).toBeNull()
                expect(detectTransportType(faker.random.alphaNumeric(8))).toBeNull()
                expect(detectTransportType(new Date())).toBeNull()
                expect(detectTransportType(17)).toBeNull()
                expect(detectTransportType(null)).toBeNull()
                expect(detectTransportType()).toBeNull()
            })

        })

        describe('getUniqKey', () => {
            it('generates proper uniqKey', async () => {
                const target = faker.datatype.uuid()
                const date = dayjs().format(DATE_FORMAT)
                const title = faker.random.alphaNumeric(8)

                expect(getUniqKey(date, title, target)).toEqual(`${date}:${title}:${normalizeTarget(target)}`)
            })
        })

        describe('normalizeTarget', () => {
            it('normalizes target properly', async () => {
                const targets = [
                    faker.datatype.uuid(),
                    faker.phone.number('+79#########'),
                    `${faker.random.alphaNumeric(8)}@${faker.random.alphaNumeric(8)}.com`.toLowerCase(),
                    null,
                    null,
                    null,
                ]
                const denormalizedTargets = [
                    '       ' + targets[0] + '       ',
                    '       ' + targets[1] + '       ',
                    '       ' + targets[2].toUpperCase() + '       ',
                    17,
                    null,
                    new Date(),
                ]

                denormalizedTargets.forEach((target, idx) => {
                    const normalizaedValue = isString(target) ? md5(targets[idx]) : null
                    expect(normalizeTarget(target)).toEqual(normalizaedValue)
                })
            })
        })

        describe('prepareMessageData', () => {
            it('prepares proper push messageData', async () => {
                const target = faker.datatype.uuid()
                const batch = {
                    id: faker.datatype.uuid(),
                    title: faker.random.alphaNumeric(20),
                    message: faker.random.alphaNumeric(50),
                    deepLink: faker.random.alphaNumeric(30),
                    messageType: CUSTOM_CONTENT_MESSAGE_TYPE,
                }
                const today = dayjs().format(DATE_FORMAT)
                const messageData = prepareMessageData(target, batch, today)

                expect(messageData).not.toBeNull()
                expect(messageData.type).toEqual(CUSTOM_CONTENT_MESSAGE_PUSH_TYPE)
                expect(messageData.to).toMatchObject({ user: { id: target } } )
                expect(messageData.meta.dv).toEqual(1)
                expect(messageData.meta.body).toEqual(batch.message)
                expect(messageData.meta.title).toEqual(batch.title)
                expect(messageData.meta.data.target).toEqual(target)
                expect(messageData.meta.data.userId).toEqual(target)
                expect(messageData.meta.data.url).toEqual(batch.deepLink)
                expect(messageData.meta.data.batchId).toEqual(batch.id)
                expect(messageData.sender).toMatchObject({ dv: 1, fingerprint: 'send-message-batch-notification' })
                expect(messageData.uniqKey).toEqual(getUniqKey(today, batch.title, target))
            })

            it('prepares proper email messageData', async () => {
                const target = `${faker.random.alphaNumeric(8)}@${faker.random.alphaNumeric(8)}.com`
                const batch = {
                    id: faker.datatype.uuid(),
                    title: faker.random.alphaNumeric(20),
                    message: faker.random.alphaNumeric(50),
                    deepLink: faker.random.alphaNumeric(30),
                    messageType: CUSTOM_CONTENT_MESSAGE_TYPE,
                }
                const today = dayjs().format(DATE_FORMAT)
                const messageData = prepareMessageData(target, batch, today)

                expect(messageData).not.toBeNull()
                expect(messageData.type).toEqual(CUSTOM_CONTENT_MESSAGE_EMAIL_TYPE)
                expect(messageData.to).toMatchObject({ email: target } )
                expect(messageData.meta.dv).toEqual(1)
                expect(messageData.meta.body).toEqual(batch.message)
                expect(messageData.meta.subject).toEqual(batch.title)
                expect(messageData.meta.data.target).toEqual(target)
                expect(messageData.meta.data.userId).toBeUndefined()
                expect(messageData.meta.data.url).toEqual(batch.deepLink)
                expect(messageData.meta.data.batchId).toEqual(batch.id)
                expect(messageData.sender).toMatchObject({ dv: 1, fingerprint: 'send-message-batch-notification' })
                expect(messageData.uniqKey).toEqual(getUniqKey(today, batch.title, target))
            })

            it('prepares proper sms messageData', async () => {
                const target = faker.phone.number('+79#########')
                const batch = {
                    id: faker.datatype.uuid(),
                    title: faker.random.alphaNumeric(20),
                    message: faker.random.alphaNumeric(50),
                    deepLink: faker.random.alphaNumeric(30),
                    messageType: CUSTOM_CONTENT_MESSAGE_TYPE,
                }
                const today = dayjs().format(DATE_FORMAT)
                const messageData = prepareMessageData(target, batch, today)

                expect(messageData).not.toBeNull()
                expect(messageData.type).toEqual(CUSTOM_CONTENT_MESSAGE_SMS_TYPE)
                expect(messageData.to).toMatchObject({ phone: target } )
                expect(messageData.meta.dv).toEqual(1)
                expect(messageData.meta.body).toEqual(batch.message)
                expect(messageData.meta.subject).toBeUndefined()
                expect(messageData.meta.data.target).toEqual(target)
                expect(messageData.meta.data.userId).toBeUndefined()
                expect(messageData.meta.data.url).toEqual(batch.deepLink)
                expect(messageData.meta.data.batchId).toEqual(batch.id)
                expect(messageData.sender).toMatchObject({ dv: 1, fingerprint: 'send-message-batch-notification' })
                expect(messageData.uniqKey).toEqual(getUniqKey(today, batch.title, target))
            })

        })
    })
})