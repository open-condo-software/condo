const conf = require('@open-condo/config')

const { developmentClient, productionClient } = require('@dev-portal-api/domains/common/utils/serverClients')

class FakeSMSAdapter {
    async sendMessage (phone, message) {
        console.log(JSON.stringify({ adapter: 'Fake SMS Adapter', phone, message }))
    }
}

class CondoSMSAdapter {
    #client

    constructor (serverClient) {
        this.#client = serverClient
    }

    async sendMessage (phone, message) {
        await this.#client.sendMessage({ phone }, message)
    }
}

class SMSAdapter {
    #internalAdapter = null

    constructor (type = 'fake') {
        switch (type) {
            case 'condo-dev':
                this.#internalAdapter = new CondoSMSAdapter(developmentClient)
                break
            case 'condo-prod':
                this.#internalAdapter = new CondoSMSAdapter(productionClient)
                break
            default:
                this.#internalAdapter = new FakeSMSAdapter()
                break
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