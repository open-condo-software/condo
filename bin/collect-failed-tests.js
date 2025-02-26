const fetch = require('node-fetch')
const client = require('prom-client')


const PROMETHEUS_URL = process.env.PROMETHEUS_RW_SERVER_URL
const PROMETHEUS_USER = process.env.PROMETHEUS_USER
const PROMETHEUS_PASSWORD = process.env.PROMETHEUS_PASSWORD
// const REF = process.env.GITHUB


/**
 * @param {string} testData.testName - name of failed test
 * @param {string} testData.testFile - file where failed test is located
 * @returns {Promise<boolean>}
 */
async function sendFailedTest (testData) {
    if (!PROMETHEUS_URL || !PROMETHEUS_USER || !PROMETHEUS_PASSWORD) {
        throw new Error('Prometheus credentials was not provided!')
    }

    const response = await fetch(PROMETHEUS_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': ['Basic', Buffer.from(`${PROMETHEUS_USER}:${PROMETHEUS_PASSWORD}`).toString('base64')].join(' '),
        },
        body: JSON.stringify({
            metric: 'failed_test',
            value: 1,
            timestamp: Math.floor(Date.now() / 1000), // Date.now in MS, Prometheus accepts seconds
            labels: {
                ...testData,
            },
        }),
    })

    const txt = await response.text()

    console.log(response.status)
    console.log(txt)

    return response.ok
}

async function collectFailedTests () {
    const register = new client.Registry()
    const failedTestMetric = new client.Counter({
        name: 'failed_test',
        help: 'A custom test metric for Grafana Prometheus',
        labelNames: ['test_file', 'test_name'],
    })

    register.registerMetric(failedTestMetric)

    failedTestMetric.inc({
        test_file: 'my.test.js',
        test_name: 'my test name',
    })

    const metrics = await register.metrics()

    const response = await fetch(PROMETHEUS_URL, {
        method: 'POST',
        headers: {
            'Authorization': ['Basic', Buffer.from(`${PROMETHEUS_USER}:${PROMETHEUS_PASSWORD}`).toString('base64')].join(' '),
        },
        body: metrics,
    })

    const txt = await response.text()

    console.log(response.status)
    console.log(txt)
}

collectFailedTests().then(
    () => process.exit(),
    (error) => {
        console.error(error)
        process.exit(1)
    },
)