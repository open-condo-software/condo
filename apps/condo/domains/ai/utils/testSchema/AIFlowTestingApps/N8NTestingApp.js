const express = require('express')
const { faker } = require('@faker-js/faker')


const SUCCESS_N8N_PREDICTION_RESULT = {
    data: {
        answer: faker.lorem.sentence(),
    },
    executionId: faker.string.uuid(),
    workflowId: faker.string.uuid(),
}

const FAULTY_N8N_PREDICTION_RESULT = {
    message: 'Error: Workflow execution failed',
    statusCode: 500,
}

class N8NTestingApp {
    prepareMiddleware () {
        // this route can not be used for csrf attack (because no cookies and tokens are used in a public route)
        // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()

        app.post('/test/n8n/webhook/success', async (req, res) => {
            return res.status(200).json(SUCCESS_N8N_PREDICTION_RESULT)
        })

        app.post('/test/n8n/webhook/fail/500', async (req, res) => {
            return res.status(500).json(FAULTY_N8N_PREDICTION_RESULT)
        })

        return app
    }
}

module.exports = {
    N8NTestingApp,
    SUCCESS_N8N_PREDICTION_RESULT,
    FAULTY_N8N_PREDICTION_RESULT,
}
