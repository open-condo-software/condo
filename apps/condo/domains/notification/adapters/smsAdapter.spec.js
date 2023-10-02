const conf = require('@open-condo/config')

const { SMSAdapter } = require('./smsAdapter')

const TEST_PHONE_NUMBER = conf.SMS_TEST_PHONE || '88009232323'
const NOT_VALID_PHONE_NUMBER = '+55555555555'

describe('SMS adapters', () => {
    afterAll( () => {
        if (global.gc) {
            global.gc()
        }
    })
    describe('SMS.ru adapter', () => {
        it('should reject bad formatted phones', async () => {
            const Adapter = new SMSAdapter('SMS')
            if (Adapter.isConfigured) {
                expect(Adapter.isPhoneSupported(NOT_VALID_PHONE_NUMBER)).toBe(false)
            }
        })
        it('should validate well formatted phones', async () => {
            const Adapter = new SMSAdapter('SMS')
            if (Adapter.isConfigured) {
                expect(Adapter.isPhoneSupported(TEST_PHONE_NUMBER)).toBe(true)
            }
        })
        it('should be available', async () => {
            const Adapter = new SMSAdapter('SMS')
            if (Adapter.isConfigured) {
                const result = await Adapter.checkIsAvailable()
                expect(result).toBe(true)
            }
        })
        it('should send sms', async () => {
            const Adapter = new SMSAdapter('SMS')
            if (Adapter.isConfigured) {
                const [isOk] = await Adapter.send({ phone: TEST_PHONE_NUMBER, message: '1' }, { test: 1 })
                expect(isOk).toBe(true)
            }
        })
    })

    describe('SMSC.ru adapter', () => {
        it('should reject bad formatted phones', async () => {
            const Adapter = new SMSAdapter('SMSC')
            if (Adapter.isConfigured) {
                expect(Adapter.isPhoneSupported(NOT_VALID_PHONE_NUMBER)).toBe(false)
            }
        })
        it('should validate well formatted phones', async () => {
            const Adapter = new SMSAdapter('SMSC')
            if (Adapter.isConfigured) {
                expect(Adapter.isPhoneSupported(TEST_PHONE_NUMBER)).toBe(true)
            }
        })
        it('should be available', async () => {
            const Adapter = new SMSAdapter('SMSC')
            if (Adapter.isConfigured) {
                const result = await Adapter.checkIsAvailable()
                expect(result).toBe(true)
            }
        })
        it('should send sms', async () => {
            const Adapter = new SMSAdapter('SMSC')
            if (Adapter.isConfigured) {
                // There is no sms send emulation for this provider. It's possible to turn on test mode for account on web page settings
                // Though using hlr will reduce cost of test sms to minimum as it only checks provider information for the phone
                const [isOk] = await Adapter.send({ phone: TEST_PHONE_NUMBER, message: '1' }, { hlr: 1 })
                expect(isOk).toBe(true)
            }
        })
    })
})
