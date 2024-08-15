const express = require('express')

const SUCCESS_GET_RECIPIENTS_URL = "/test/news-sharing-api/success/getRecipients"
const SUCCESS_PUBLISH_URL = "/test/news-sharing-api/success/publish"
const SUCCESS_PREVIEW_URL = "/test/news-sharing-api/success/preview"

const FAULTY_GET_RECIPIENTS_URL_404 = '/test/news-sharing-api/fail/getRecipients/404'
const FAULTY_GET_RECIPIENTS_URL_500 = '/test/news-sharing-api/fail/getRecipients/500'
const FAULTY_PUBLISH_URL_500 = "/test/news-sharing-api/fail/publish/500"

const INCORRECT_GET_RECIPIENTS_RESULT_URL_WRONG_RETURN_TYPE = '/test/news-sharing-api/fail/getRecipients/0'
const INCORRECT_GET_RECIPIENTS_URL_BAD_NAME = '/test/news-sharing-api/fail/getRecipients/1'
const INCORRECT_GET_RECIPIENTS_URL_BAD_ID = '/test/news-sharing-api/fail/getRecipients/2'
const INCORRECT_GET_RECIPIENTS_URL_OTHER_FIELDS = '/test/news-sharing-api/fail/getRecipients/3'

const SUCCESS_GET_RECIPIENTS_COUNTERS_URL = '/test/news-sharing-api/success/getRecipientsCount'
const FAULTY_GET_RECIPIENTS_COUNTERS_URL_404 = '/test/news-sharing-api/fail/getRecipientsCount/404'
const FAULTY_GET_RECIPIENTS_COUNTERS_URL_500 = '/test/news-sharing-api/fail/getRecipientsCount/500'

const INCORRECT_GET_RECIPIENTS_COUNTERS_RESULT_URL_WRONG_RETURN_TYPE = '/test/news-sharing-api/fail/getRecipientsCount/0'
const INCORRECT_GET_RECIPIENTS_COUNTERS_RESULT_URL_OTHER_FIELDS = '/test/news-sharing-api/fail/getRecipientsCount/1'

const SUCCESS_GET_RECIPIENTS_COUNTERS_RESULT = {
    receiversCount: 1000,
}

const INCORRECT_GET_RECIPIENTS_COUNTERS_RESULT_WRONG_RETURN_TYPE = {
    receiversCount: 'abcd'
}

const INCORRECT_GET_RECIPIENTS_COUNTERS_RESULT_OTHER_FIELDS = {
    ...SUCCESS_GET_RECIPIENTS_COUNTERS_RESULT,
    meta: true,
}

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

        // Publish
        app.post(SUCCESS_PUBLISH_URL, async (req, res) => {
            res.status(200).send('OK')
        })

        app.post(FAULTY_PUBLISH_URL_500, async(req, res) => { res.status(500).send({}) })

        // Preview
        app.get(SUCCESS_PREVIEW_URL, async (req, res) => {
            res.status(200).send('OK')
        })

        // GetRecipients
        app.get(SUCCESS_GET_RECIPIENTS_URL, async (req, res) => {
            res.json(SUCCESS_GET_RECIPIENTS_RESULT)
        })

        app.get(INCORRECT_GET_RECIPIENTS_URL_BAD_ID, async (req, res) => {
            res.status(200).send(INCORRECT_GET_RECIPIENTS_RESULT_BAD_ID)
        })

        app.get(INCORRECT_GET_RECIPIENTS_URL_BAD_NAME, async (req, res) => {
            res.status(200).send(INCORRECT_GET_RECIPIENTS_RESULT_BAD_NAME)
        })

        app.get(INCORRECT_GET_RECIPIENTS_URL_OTHER_FIELDS, async (req, res) => {
            res.status(200).send(INCORRECT_GET_RECIPIENTS_RESULT_OTHER_FIELDS)
        })

        app.get(INCORRECT_GET_RECIPIENTS_RESULT_URL_WRONG_RETURN_TYPE, async (req, res) => {
            res.status(200).send(INCORRECT_GET_RECIPIENTS_RESULT_WRONG_RETURN_TYPE)
        })

        app.get(FAULTY_GET_RECIPIENTS_URL_500, async (req, res) => {
            res.status(500).send({})
        })

        app.get(FAULTY_GET_RECIPIENTS_URL_404, async (req, res) => {
            res.status(404).send({})
        })

        // GetRecipientsCounters
        app.post(SUCCESS_GET_RECIPIENTS_COUNTERS_URL, async (req, res) => {
            res.json(SUCCESS_GET_RECIPIENTS_COUNTERS_RESULT)
        })

        app.post(FAULTY_GET_RECIPIENTS_COUNTERS_URL_404, async (req, res) => {
            res.status(404).send({})
        })

        app.post(FAULTY_GET_RECIPIENTS_COUNTERS_URL_500, async (req, res) => {
            res.status(500).send({})
        })

        app.post(INCORRECT_GET_RECIPIENTS_COUNTERS_RESULT_URL_WRONG_RETURN_TYPE, async (req, res) => {
            res.json(INCORRECT_GET_RECIPIENTS_COUNTERS_RESULT_WRONG_RETURN_TYPE)
        })

        app.post(INCORRECT_GET_RECIPIENTS_COUNTERS_RESULT_URL_OTHER_FIELDS, async (req, res) => {
            res.json(INCORRECT_GET_RECIPIENTS_COUNTERS_RESULT_OTHER_FIELDS)
        })

        return app
    }
}

module.exports = {
    NewsSharingTestingApp,

    SUCCESS_PREVIEW_URL,

    // Publish Urls
    SUCCESS_PUBLISH_URL,
    FAULTY_PUBLISH_URL_500,

    // GetRecipients Urls
    SUCCESS_GET_RECIPIENTS_URL,
    FAULTY_GET_RECIPIENTS_URL_404,
    FAULTY_GET_RECIPIENTS_URL_500,
    INCORRECT_GET_RECIPIENTS_RESULT_URL_WRONG_RETURN_TYPE,
    INCORRECT_GET_RECIPIENTS_URL_BAD_NAME,
    INCORRECT_GET_RECIPIENTS_URL_BAD_ID,
    INCORRECT_GET_RECIPIENTS_URL_OTHER_FIELDS,

    // GetRecipients Data
    SUCCESS_GET_RECIPIENTS_RESULT,
    INCORRECT_GET_RECIPIENTS_RESULT_WRONG_RETURN_TYPE,
    INCORRECT_GET_RECIPIENTS_RESULT_BAD_NAME,
    INCORRECT_GET_RECIPIENTS_RESULT_BAD_ID,
    INCORRECT_GET_RECIPIENTS_RESULT_OTHER_FIELDS,

    // GetRecipientsCount Urls
    SUCCESS_GET_RECIPIENTS_COUNTERS_URL,
    FAULTY_GET_RECIPIENTS_COUNTERS_URL_404,
    FAULTY_GET_RECIPIENTS_COUNTERS_URL_500,
    INCORRECT_GET_RECIPIENTS_COUNTERS_RESULT_URL_WRONG_RETURN_TYPE,
    INCORRECT_GET_RECIPIENTS_COUNTERS_RESULT_URL_OTHER_FIELDS,

    // GetRecipientsCount Data
    SUCCESS_GET_RECIPIENTS_COUNTERS_RESULT,
    INCORRECT_GET_RECIPIENTS_COUNTERS_RESULT_WRONG_RETURN_TYPE,
    INCORRECT_GET_RECIPIENTS_COUNTERS_RESULT_OTHER_FIELDS
}
