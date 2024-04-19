const index = require('@app/condo/index')
const falsey = require('falsey')

const conf = require('@open-condo/config')
const { setFakeClientMode } = require('@open-condo/keystone/test.utils')

const EXTRA_LOGGING = falsey(process.env.DISABLE_LOGGING)

jest.setTimeout(60000)

if (conf.TESTS_FAKE_CLIENT_MODE) setFakeClientMode(index, { excludeApps: ['NextApp'] })
if (conf.TESTS_FAKE_WORKER_MODE) console.warn('The Tasks will be executed inside this node process with setTimeout instead of being sent to the queue!')

if (EXTRA_LOGGING) {
    // Patch tests to include their own name
    jasmine.getEnv().addReporter({ // eslint-disable-line
        specStarted: result => jasmine.currentTest = result, // eslint-disable-line
        specDone: result => jasmine.currentTest = result, // eslint-disable-line
    })

    beforeEach(() => console.log('[BEGIN] TEST:', jasmine['currentTest'])) // eslint-disable-line
    afterEach(() => console.log('[END] TEST:', jasmine['currentTest'])) // eslint-disable-line
}

// The mocked module implementation must be placed into __mocks__/MockedClass near the module itself
[
    '@open-condo/clients/address-service-client/AddressServiceClient',
    '@open-condo/clients/finance-info-client',
].forEach((module) => {
    console.log(`🥸Mock module ${module}`)
    jest.mock(module)
})
