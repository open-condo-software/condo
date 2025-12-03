const express = require('express')

const SUCCESS_WEBHOOK_PATH = '/test/webhook/success'
const FAIL_WEBHOOK_PATH_500 = '/test/webhook/fail/500'

// Store received webhooks for verification
const receivedWebhooks = []

function clearReceivedWebhooks () {
    receivedWebhooks.length = 0
}

function getReceivedWebhooks () {
    return [...receivedWebhooks]
}

class WebhookTestingApp {
    prepareMiddleware () {
        // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()
        app.use(express.json())

        // Success endpoint - returns 200 (matches any path starting with SUCCESS_WEBHOOK_PATH)
        app.post(`${SUCCESS_WEBHOOK_PATH}/:uniqueId?`, async (req, res) => {
            receivedWebhooks.push({
                timestamp: new Date().toISOString(),
                path: req.path,
                headers: {
                    'x-condo-signature': req.headers['x-condo-signature'],
                    'x-condo-delivery-id': req.headers['x-condo-delivery-id'],
                    'content-type': req.headers['content-type'],
                },
                body: req.body,
            })
            res.status(200).json({ received: true })
        })

        // Failure endpoint - returns 500 (matches any path starting with FAIL_WEBHOOK_PATH_500)
        app.post(`${FAIL_WEBHOOK_PATH_500}/:uniqueId?`, async (req, res) => {
            receivedWebhooks.push({
                timestamp: new Date().toISOString(),
                path: req.path,
                headers: req.headers,
                body: req.body,
                failed: true,
            })
            res.status(500).json({ error: 'Internal Server Error' })
        })

        return app
    }
}

module.exports = {
    WebhookTestingApp,
    SUCCESS_WEBHOOK_PATH,
    FAIL_WEBHOOK_PATH_500,
    clearReceivedWebhooks,
    getReceivedWebhooks,
}
