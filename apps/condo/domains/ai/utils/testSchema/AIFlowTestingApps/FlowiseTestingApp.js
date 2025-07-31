const express = require('express')
const { faker } = require('@faker-js/faker')


const SUCCESS_FLOWISE_PREDICTION_RESULT = {
    json: {
        comment: 'hello, can you please fix my hot water?',
    },
    chatId: '25156883-4a40-4166-bb52-224c55e8067f',
    chatMessageId: '4136bc17-4a37-4a4b-9bec-f24b7071745c',
    isStreamValid: false,
    sessionId: '9887a40b-4495-4ce0-b16c-7aa1ce4d0e40',
}

const FAULTY_FLOWISE_PREDICTION_RESULT = {
    stack: {},
    message: `Error: predictionsServices.buildChatflow - can not run AI at this time`,
    success: false,
    statusCode: 500,
}

class FlowiseTestingApp {
    prepareMiddleware () {
        // this route can not be used for csrf attack (because no cookies and tokens are used in a public route)
        // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()

        app.post('/test/flowise/api/v1/prediction/success', async (req, res) => {
            return res.status(200).json(SUCCESS_FLOWISE_PREDICTION_RESULT)
        })

        app.post('/test/flowise/api/v1/prediction/fail/500', async (req, res) => {
            return res.status(500).json(FAULTY_FLOWISE_PREDICTION_RESULT)
        })

        return app
    }
}

module.exports = {
    FlowiseTestingApp,
    SUCCESS_FLOWISE_PREDICTION_RESULT,
    FAULTY_FLOWISE_PREDICTION_RESULT,
}
