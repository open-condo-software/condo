const conf = require('@open-condo/config')

class FakeSMSAdapter {
    async sendMessage (phone, message) {
        console.log(JSON.stringify({ adapter: 'Fake SMS Adapter', phone, message }))
    }
}

class SMSAdapter {
    #internalAdapter = null

    constructor (type = 'fake') {
        if (type === 'fake') {
            this.#internalAdapter = new FakeSMSAdapter()
        }
    }

    async sendMessage (phone, message) {
        return await this.#internalAdapter.sendMessage(phone, message)
    }
}

const DEFAULT_SMS_ADAPTER = new SMSAdapter(conf['SMS_PROVIDER'] || 'fake')

async function sendMessage (phone, message) {
    return await DEFAULT_SMS_ADAPTER.sendMessage(phone, message)
}

module.exports = {
    SMSAdapter,
    sendMessage,
}