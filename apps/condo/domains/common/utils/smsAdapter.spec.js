const { SMSAdapter } = require('./smsAdapter')
const conf = require('@core/config')

const TEST_PHONE_NUMBER = conf.SMS_TEST_PHONE || '88009232323'
const NOT_VALID_PHONE_NUMBER = '+19999999999'

describe('SMS adapters', () => {
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
                const [isOk] = await Adapter.sendTestSMS({ phone: TEST_PHONE_NUMBER, message: '1' })
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
                const [isOk] = await Adapter.sendTestSMS({ phone: TEST_PHONE_NUMBER, message: '1' })
                expect(isOk).toBe(true)
            }
        })
    })
})
