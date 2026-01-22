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

        const promises = await Promise.allSettled(notifications.map(async (_, idx) => {
            const { token, data: pushData = {}, notification  = {}, type, appId } = notifications[idx]
            return await this.sendPush(token, notification, pushData)
        }))
            
        for (const p of promises) {
            if (p.status !== 'fulfilled') {
                responses.push({ error: p.reason })
                failureCount += 1
                continue
            }
            const response = p.value
            if (response instanceof Error) {
                failureCount += 1
            } else {
                const responseJSON = await response.json()

                const statusOk = response?.status === 200
                const responseIsEmpty = 
                    responseJSON === null 
                    || responseJSON === undefined 
                    || (typeof responseJSON === 'object' && Object.keys(responseJSON).length === 0) 

                if (statusOk && responseIsEmpty) {
                    responses.push({ ...responseJSON, success: true })
                    successCount += 1
                } else {
                    responses.push({ ...responseJSON, success: false })
                    failureCount += 1
                }
            }
        }

        return { responses, successCount, failureCount }
    }
}

module.exports = { RedStoreNotificationSender }