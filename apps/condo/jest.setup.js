// setup TESTS_FAKE_CLIENT_MODE
const { setFakeClientMode } = require('@core/keystone/test.utils')
const { createWorker } = require('@core/keystone/tasks')
const conf = require('@core/config')

if (conf.TESTS_FAKE_CLIENT_MODE) setFakeClientMode(require.resolve('./index'), { excludeApps: ['NextApp'] })
if (conf.TESTS_FAKE_WORKER_MODE) createWorker(require.resolve('./index')).catch((error) => {
    console.error(error)
    process.exit(2)
})
