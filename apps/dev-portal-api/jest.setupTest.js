const index = require('@app/dev-portal-api/index')
const { get } = require('lodash')

const conf = require('@open-condo/config')
const { setFakeClientMode } = require('@open-condo/keystone/test.utils')

const TESTS_LOG_REQUEST_RESPONSE = conf.TESTS_LOG_REQUEST_RESPONSE === 'true'

jest.setTimeout(60000)

if (conf.TESTS_FAKE_CLIENT_MODE) setFakeClientMode(index, { excludeApps: ['NextApp'] })
if (conf.TESTS_FAKE_WORKER_MODE) console.warn('The Tasks will be executed inside this node process with setTimeout instead of being sent to the queue!')
if (TESTS_LOG_REQUEST_RESPONSE) {
    beforeEach(() => console.log(`[TEST BEGIN][${get(jasmine, ['currentTest', 'fullName'], jasmine['testPath'].split('/').pop().split('.')[0])}]`)) // eslint-disable-line
    afterEach(() => console.log(`[TEST END][${get(jasmine, ['currentTest', 'fullName'], jasmine['testPath'].split('/').pop().split('.')[0])}]`)) // eslint-disable-line
}

// Patch tests to include their own name
jasmine.getEnv().addReporter({ // eslint-disable-line
    specStarted: result => jasmine.currentTest = result, // eslint-disable-line
    specDone: result => jasmine.currentTest = result, // eslint-disable-line
})
