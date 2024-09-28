const { get } = require('lodash')


const { fetch } = require('@open-condo/keystone/fetch')

const { APS_RESPONSE_STATUS_SUCCESS } = require('@condo/domains/notification/adapters/apple/constants')


class RedStoreNotificationSender {
    _projectId = null
    _serviceToken = null
    _url = null

    constructor (config) {
        if (!config['project_id'] || !config['service_token'] || !config['url']) throw Error('Config is invalid. Check fields project_id, service_token, url')
        this._projectId = config['project_id']
        this._serviceToken = config['service_token']
        this._url = config['url']
    }

    async sendPush (token, notification, data) {
        return await fetch(this._url, {
            body: JSON.stringify({
                message: {
                    token,
                    notification,
                    data,
                },
            }),
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this._serviceToken}`,
            },
        })
    }

    async sendAll (notifications) {
        const responses = []
        let successCount = 0, failureCount = 0

        for (let idx = 0; idx < notifications.length; idx++) {
            const { token, data: pushData = {}, notification  = {}, type, appId } = notifications[idx]

            const response = await this.sendPush(token, notification, pushData)
            
            if (response instanceof Error) {
                failureCount += 1
            } else {
                responses.push(await response.json())
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

module.exports = { RedStoreNotificationSender }