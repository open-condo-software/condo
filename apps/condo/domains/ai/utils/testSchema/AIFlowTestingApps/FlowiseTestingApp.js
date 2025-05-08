const express = require('express')
const { faker } = require('@faker-js/faker')


const SUCCESS_FLOWISE_PREDICTION_RESULT = {
    json: {
        comment: faker.lorem.sentence(),
    },
    chatId: faker.datatype.uuid(),
    chatMessageId: faker.datatype.uuid(),
    isStreamValid: false,
    sessionId: faker.datatype.uuid(),
}

const FAULTY_FLOWISE_PREDICTION_RESULT = {
    stack: {},
    message: `Error: predictionsServices.buildChatflow - ${faker.lorem.sentence()}`,
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
