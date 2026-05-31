const index = require('@app/~/index')

const conf = require('@open-condo/config')
const { setFakeClientMode } = require('@open-condo/keystone/test.utils')

const EXTRA_LOGGING = conf.DISABLE_LOGGING !== 'true'

jest.setTimeout(60000)

if (conf.TESTS_FAKE_CLIENT_MODE) setFakeClientMode(index, { excludeApps: ['NextApp'] })
if (conf.TESTS_FAKE_WORKER_MODE) console.warn('The Tasks will be executed inside this node process with setTimeout instead of being sent to the queue!')

if (EXTRA_LOGGING) {
    jasmine.getEnv().addReporter({
        specStarted: result => jasmine.currentTest = result,
        specDone: result => jasmine.currentTest = result,
    })

    beforeEach(() => console.log('[BEGIN] TEST:', jasmine['currentTest']))
    afterEach(() => console.log('[END] TEST:', jasmine['currentTest']))
}
