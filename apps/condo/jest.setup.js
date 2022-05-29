// setup TESTS_FAKE_CLIENT_MODE
const { setFakeClientMode } = require('@core/keystone/test.utils')
const { createWorker } = require('@core/keystone/tasks')
const conf = require('@core/config')

if (conf.TESTS_FAKE_CLIENT_MODE) setFakeClientMode(require.resolve('./index'), { excludeApps: ['NextApp'] })
if (conf.TESTS_FAKE_WORKER_MODE) createWorker(require.resolve('./index')).catch((error) => {
    console.error(error)
    process.exit(2)
})

// Patch tests to include their own name
jasmine.getEnv().addReporter({
    specStarted: result => jasmine.currentTest = result,
    specDone: result => jasmine.currentTest = result,
})

beforeEach(() => console.log('[BEGIN] TEST:', jasmine['currentTest']))
afterEach(() => console.log('[END] TEST:', jasmine['currentTest']))
