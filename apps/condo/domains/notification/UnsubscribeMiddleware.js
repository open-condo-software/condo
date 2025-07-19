const express = require('express')
const { get, isNil } = require('lodash')

const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { EMAIL_TRANSPORT, SMS_TRANSPORT } = require('@condo/domains/notification/constants/constants')
const {
    UNSUBSCRIBE_LINK_PATH,
    UNSUBSCRIBED_PAGE_PATH,
} = require('@condo/domains/notification/constants/links')
const { Message } = require('@condo/domains/notification/utils/serverSchema')
const { NotificationAnonymousSetting } = require('@condo/domains/notification/utils/serverSchema')
const { getAnonymousSettings } = require('@condo/domains/notification/utils/serverSchema/helpers')
const { RedisGuard } = require('@condo/domains/user/utils/serverSchema/guards')

const logger = getLogger()

const UNSUBSCRIBE_LINK_WINDOW_SIZE = 60 // seconds
const MAX_UNSUBSCRIBE_LINK_REQUEST_BY_WINDOW = 5

const sender = { dv: 1, fingerprint: 'unsubscribe-link-handler' }
const redisGuard = new RedisGuard()

class UnsubscribeLinkRouter {
    async init () {
        const { keystone: context } = await getSchemaCtx('Message')
        this.context = context
    }

    async checkLimits (req) {
        const ip = req.ip
        await redisGuard.checkCustomLimitCounters(
            ip,
            UNSUBSCRIBE_LINK_WINDOW_SIZE,
            MAX_UNSUBSCRIBE_LINK_REQUEST_BY_WINDOW,
            { req },
        )
    }

    async handleRequest (req, res) {
        try {
            // check throttling limits
            await this.checkLimits(req)

            // get notification parameter
            const id = get(req, ['query', 'id'])
            if (isNil(id)) {
                throw new Error('Empty message id is not allowed for unsubscribed request')
            }

            // get related anonymous message
            const message = await Message.getOne(this.context, {
                id,
                deletedAt: null,
            }, 'user { id } email phone type')

            // now supported to set settings only for email/sms transport
            if (isNil(message.user) && (message.email || message.phone)) {
                // now lets check if already unsubscribed
                const settings = await getAnonymousSettings(this.context, message.email, message.phone, message.type)

                // only in case if no unsubscribe record exists
                if (settings.length === 0) {
                    // create notification anonymous settings based on the message
                    await NotificationAnonymousSetting.create(this.context, {
                        dv: 1,
                        sender,
                        email: message.email,
                        phone: message.phone,
                        messageType: message.type,
                        messageTransport: isNil(message.phone) ? EMAIL_TRANSPORT : SMS_TRANSPORT,
                        isEnabled: false,
                    })
                }
            }
        } catch (error) {
            // print error log
            logger.error({
                msg: error.message,
                req,
                err: error,
            })

            return res.redirect('/500')
        }

        // redirect to unsubscribed page
        return res.redirect(UNSUBSCRIBED_PAGE_PATH)
    }
}

class UnsubscribeMiddleware {
    async prepareMiddleware () {
        // this route can not be used for csrf attack (because no cookies and tokens are used in a public route)
        // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()

        const router = new UnsubscribeLinkRouter()
        await router.init()
        app.get(UNSUBSCRIBE_LINK_PATH, router.handleRequest.bind(router))

        return app
    }
}

module.exports = {
    UnsubscribeMiddleware,
}
