const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')


const { EMAIL_TRANSPORT } = require('@condo/domains/notification/constants/constants')
const { Message } = require('@condo/domains/notification/utils/serverSchema')
const { NotificationAnonymousSetting } = require('@condo/domains/notification/utils/serverSchema')
const { getAnonymousSettings } = require('@condo/domains/notification/utils/serverSchema/helpers')
const { RedisGuard } = require('@condo/domains/user/utils/serverSchema/guards')

const logger = getLogger('unsubscribe/linkHandler')

const UNSUBSCRIBE_LINK_WINDOW_SIZE = 60 // seconds
const MAX_UNSUBSCRIBE_LINK_REQUEST_BY_WINDOW = 5

const sender = { dv: 1, fingerprint: 'unsubscribe-link-handler' }
const redisGuard = new RedisGuard()

class UnsubscribeLinkRouter {
    async init () {
        const { keystone: context } = await getSchemaCtx('MultiPayment')
        this.context = context
    }


    async checkLimits (req) {
        const ip = req.ip.split(':').pop()
        await redisGuard.checkCustomLimitCounters(
            ip,
            UNSUBSCRIBE_LINK_WINDOW_SIZE,
            MAX_UNSUBSCRIBE_LINK_REQUEST_BY_WINDOW,
        )
    }

    async handleRequest (req, res) {
        try {
            // check throttling limits
            await this.checkLimits(req)

            // get notification parameter
            const { id } = req.query

            // get related message
            const message = await Message.getOne(this.context, { id })

            // now supported to set settings only for email transport
            if (message.email) {
                // now lets check if already unsubscribed
                const settings = await getAnonymousSettings(this.context, message.email, message.type)

                // only in case if no unsubscribe record exists
                if (settings.length === 0) {
                    // create notification anonymous settings based on the message
                    await NotificationAnonymousSetting.create(this.context, {
                        dv: 1,
                        sender,
                        email: message.email,
                        messageType: message.type,
                        messageTransport: EMAIL_TRANSPORT,
                        isEnabled: false,
                    })
                }
            }
        } catch (e) {
            return res.redirect('/500')
        }

        // redirect to unsubscribed page
        return res.redirect('/unsubscribed')
    }
}

module.exports = {
    UnsubscribeLinkRouter,
}
