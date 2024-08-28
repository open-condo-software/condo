const { fetch } = require('@open-condo/keystone/fetch')
const {get} = require("lodash");
const {APS_RESPONSE_STATUS_SUCCESS} = require("../apple/constants");


class RuStoreNotificationSender {
    #projectId = null
    #serviceToken = null
    #url = null

    /**
     * @param config
     */
    constructor (config) {
        this.#projectId = config['project_id']
        this.#serviceToken = config['service_token']
        this.#url = `https://vkpns.rustore.ru/v1/projects/${this.#projectId}/messages:send`
        this.sendPush = this.sendPush.bind(this)
    }

    async sendPush (token, notification) {
        await fetch(this.#url, {
            ...notification,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.#serviceToken}`,
            },
        })
    }

    async sendAll (notifications) {
        const responses = []
        let successCount = 0, failureCount = 0

        for (let idx = 0; idx < notifications.length; idx++) {
            const { token, data: pushData = {}, notification  = {}, type, appId } = notifications[idx]

            const response = await this.sendPush(token, { data: pushData, notification })
            responses.push(response)

            if (response instanceof Error) {
                failureCount += 1
            } else {
                const status = get(response, ['headers', ':status'])

                if (status === APS_RESPONSE_STATUS_SUCCESS) {
                    successCount += 1
                } else {
                    failureCount += 1
                }
            }
        }


        return { responses, successCount, failureCount }
    }
}

module.exports = { RuStoreNotificationSender }