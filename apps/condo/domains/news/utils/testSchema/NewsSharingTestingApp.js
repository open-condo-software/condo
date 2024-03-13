const express = require('express')

const SUCCESS_GET_RECIPIENTS_URL = "/test/news-sharing-api/success/getRecipients"
const SUCCESS_PUBLISH_URL = "/test/news-sharing-api/success/getRecipients"
const SUCCESS_PREVIEW_URL = "/test/news-sharing-api/success/preview"
const FAULTY_GET_RECIPIENTS_URL_404 = '/test/news-sharing-api/fail/getRecipients/404'
const FAULTY_GET_RECIPIENTS_URL_500 = '/test/news-sharing-api/fail/getRecipients/500'

const INCORRECT_GET_RECIPIENTS_RESULT_URL_WRONG_RETURN_TYPE = '/test/news-sharing-api/fail/getRecipients/0'
const INCORRECT_GET_RECIPIENTS_URL_BAD_NAME = '/test/news-sharing-api/fail/getRecipients/1'
const INCORRECT_GET_RECIPIENTS_URL_BAD_ID = '/test/news-sharing-api/fail/getRecipients/2'
const INCORRECT_GET_RECIPIENTS_URL_OTHER_FIELDS = '/test/news-sharing-api/fail/getRecipients/3'

const SUCCESS_GET_RECIPIENTS_RESULT = [
    {
        id: '1231-2312-3331-1231',
        name: 'Mayview house chat',
        receiversCount: 120,
    },
    {
        id: '5231-2312-3331-1233',
        name: 'Bayview house chat',
        receiversCount: 990,
    },
    {
        id: '5231-2312-3331-1233',
        name: 'Bayview house chat',
    },
]

const INCORRECT_GET_RECIPIENTS_RESULT_WRONG_RETURN_TYPE = {}

const INCORRECT_GET_RECIPIENTS_RESULT_BAD_NAME = [
    {
        // Name is bad
        name: {},
        id: '1231-2312-3331-1231',
        receiversCount: 120,
    },
    {
        // Correct
        id: '2313',
        name: 'Bayview house chat',
        receiversCount: 990,
    },
    {
        // Correct
        id: '2313',
        name: 'Bayview house chat',
        receiversCount: 990,
    },
]

const INCORRECT_GET_RECIPIENTS_RESULT_BAD_ID = [
    {
        // Correct
        id: '2313',
        name: 'Bayview house chat',
        receiversCount: 990,
    },
    {
        // Does not have ID
        name: 'Bayview house chat',
        receiversCount: 990,
    },
    {
        // Correct
        id: '2313',
        name: 'Bayview house chat',
        receiversCount: 990,
    },
]

const INCORRECT_GET_RECIPIENTS_RESULT_OTHER_FIELDS = [
    {
        // Correct
        id: '2313',
        name: 'Bayview house chat',
        receiversCount: 990,
    },
    {
        // Correct
        id: '2313',
        name: 'Bayview house chat',
        receiversCount: 990,
    },
    {
        // Has other fields
        name: 'Bayview house chat',
        receiversCount: 990,
        recipients: '{}',
    },
]


class NewsSharingTestingApp {
    prepareMiddleware () {
        // this route can not be used for csrf attack (because no cookies and tokens are used in a public route)
        // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()

        app.get(SUCCESS_GET_RECIPIENTS_URL, async (req, res, next) => {
            res.json(SUCCESS_GET_RECIPIENTS_RESULT)
        })

        app.post(SUCCESS_PUBLISH_URL, async (req, res, next) => {
            res.status(200).send('OK')
        })

        app.post(SUCCESS_PREVIEW_URL, async (req, res, next) => {
            res.status(200).send('OK')
        })

        app.get(INCORRECT_GET_RECIPIENTS_URL_BAD_ID, async (req, res, next) => {
            res.status(200).send(INCORRECT_GET_RECIPIENTS_RESULT_BAD_ID)
        })

        app.get(INCORRECT_GET_RECIPIENTS_URL_BAD_NAME, async (req, res, next) => {
            res.status(200).send(INCORRECT_GET_RECIPIENTS_RESULT_BAD_NAME)
        })

        app.get(INCORRECT_GET_RECIPIENTS_URL_OTHER_FIELDS, async (req, res, next) => {
            res.status(200).send(INCORRECT_GET_RECIPIENTS_RESULT_OTHER_FIELDS)
        })

        app.get(INCORRECT_GET_RECIPIENTS_RESULT_URL_WRONG_RETURN_TYPE, async (req, res, next) => {
            res.status(200).send(INCORRECT_GET_RECIPIENTS_RESULT_WRONG_RETURN_TYPE)
        })

        app.get(FAULTY_GET_RECIPIENTS_URL_500, async (req, res, next) => {
            res.status(500).send({})
        })

        app.get(FAULTY_GET_RECIPIENTS_URL_404, async (req, res, next) => {
            res.status(404).send({})
        })

        return app
    }
}

module.exports = {
    NewsSharingTestingApp,

    SUCCESS_GET_RECIPIENTS_URL,
    SUCCESS_PUBLISH_URL,
    SUCCESS_PREVIEW_URL,
    FAULTY_GET_RECIPIENTS_URL_404,
    FAULTY_GET_RECIPIENTS_URL_500,

    INCORRECT_GET_RECIPIENTS_RESULT_URL_WRONG_RETURN_TYPE,
    INCORRECT_GET_RECIPIENTS_URL_BAD_NAME,
    INCORRECT_GET_RECIPIENTS_URL_BAD_ID,
    INCORRECT_GET_RECIPIENTS_URL_OTHER_FIELDS,

    SUCCESS_GET_RECIPIENTS_RESULT,

    INCORRECT_GET_RECIPIENTS_RESULT_WRONG_RETURN_TYPE,
    INCORRECT_GET_RECIPIENTS_RESULT_BAD_NAME,
    INCORRECT_GET_RECIPIENTS_RESULT_BAD_ID,
    INCORRECT_GET_RECIPIENTS_RESULT_OTHER_FIELDS,
}
