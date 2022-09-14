const faker = require('faker')
const dayjs = require('dayjs')

const { selectTarget, detectTransportType, getUniqKey, normalizeTarget, DATE_FORMAT, EMAIL_FROM } = require('./sendMessageBatch.helpers')

const { SMS_TRANSPORT, EMAIL_TRANSPORT, PUSH_TRANSPORT } = require('../constants/constants')

describe('sendMessageBatch', () => {
    describe('helpers', () => {
        describe('selectTarget', () => {
            it('selects proper target type', async () => {
                const user = {
                    id: faker.datatype.uuid(),
                    phone: faker.phone.phoneNumber('+79#########'),
                    email: `${faker.random.alphaNumeric(8)}@${faker.random.alphaNumeric(8)}.com`,
                }
                const brokenEmail = `${faker.random.alphaNumeric(8)}@${faker.random.alphaNumeric(8)}`
                const brokenPhone = faker.phone.phoneNumber('+79########')
                const landLinePhone = faker.phone.phoneNumber('+7343#######')
                const brokenLandLinePhone = faker.phone.phoneNumber('+7343######')

                expect(selectTarget(user.phone)).toEqual({ to: { phone: user.phone } })
                expect(selectTarget(user.email)).toEqual({ to: { email: user.email }, emailFrom: EMAIL_FROM })
                expect(selectTarget(user.id)).toEqual({ to: { user: { id: user.id } } })
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
                    phone: faker.phone.phoneNumber('+79#########'),
                    email: `${faker.random.alphaNumeric(8)}@${faker.random.alphaNumeric(8)}.com`,
                }
                const brokenEmail = `${faker.random.alphaNumeric(8)}@${faker.random.alphaNumeric(8)}`
                const brokenPhone = faker.phone.phoneNumber('+79########')
                const landLinePhone = faker.phone.phoneNumber('+7343#######')
                const brokenLandLinePhone = faker.phone.phoneNumber('+7343######')

                expect(detectTransportType(user.phone)).toEqual(SMS_TRANSPORT)
                expect(detectTransportType(user.email)).toEqual(EMAIL_TRANSPORT)
                expect(detectTransportType(user.id)).toEqual(PUSH_TRANSPORT)
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

                expect(getUniqKey(date, title, target)).toEqual(`${date}:${title}:${target}`)
            })
        })

        describe('normalizeTarget', () => {
            it('normalizes target properly', async () => {
                const targets = [
                    faker.datatype.uuid(),
                    faker.phone.phoneNumber('+79#########'),
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
                    expect(normalizeTarget(target)).toEqual(targets[idx])
                })
            })
        })


    })
})