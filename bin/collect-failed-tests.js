const fetch = require('node-fetch')
const { pushTimeseries } = require('prometheus-remote-write')

const PROMETHEUS_CONFIG = {
    url: process.env.PROMETHEUS_RW_SERVER_URL,
    auth: {
        username: process.env.PROMETHEUS_USER,
        password: process.env.PROMETHEUS_PASSWORD,
    },
    fetch,
    labels: {
        __name__: 'ci_failed_test',
    },
}

async function collectFailedTests () {
    await pushTimeseries({
        labels: {
            test_name: 'my test name',
            test_file: 'my.test.js',
        },
        samples: [
            { value: 1, timestamp: Date.now() },
        ],
    }, PROMETHEUS_CONFIG)
}

collectFailedTests().then(
    () => process.exit(),
    (error) => {
        console.error(error)
        process.exit(1)
    },
)