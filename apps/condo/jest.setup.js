// setup TESTS_FAKE_CLIENT_MODE
const falsey = require('falsey')

const { setFakeClientMode } = require('@core/keystone/test.utils')
const { createWorker } = require('@core/keystone/tasks')
const conf = require('@core/config')
const index = require('@app/condo/index')

const EXTRA_LOGGING = falsey(process.env.DISABLE_LOGGING)

jest.setTimeout(60000)

if (conf.TESTS_FAKE_CLIENT_MODE) setFakeClientMode(index, { excludeApps: ['NextApp'] })
if (conf.TESTS_FAKE_WORKER_MODE) createWorker(index).catch((error) => {
    console.error(error)
    process.exit(2)
})

if (EXTRA_LOGGING) {
    // Patch tests to include their own name
    jasmine.getEnv().addReporter({ // eslint-disable-line
        specStarted: result => jasmine.currentTest = result, // eslint-disable-line
        specDone: result => jasmine.currentTest = result, // eslint-disable-line
    })

    beforeEach(() => console.log('[BEGIN] TEST:', jasmine['currentTest'])) // eslint-disable-line
    afterEach(() => console.log('[END] TEST:', jasmine['currentTest'])) // eslint-disable-line
}
