const { get } = require('lodash')

const EXTRA_LOGGING = process.env.DISABLE_LOGGING !== 'true'

jest.setTimeout(120000)

if (EXTRA_LOGGING) {
    beforeEach(() => console.log(`[TEST BEGIN][${get(jasmine, ['currentTest', 'fullName'], jasmine['testPath'].split('/').pop().split('.')[0])}]`)) // eslint-disable-line
    // nosemgrep: javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
    afterEach(() => console.log(`[TEST END][${get(jasmine, ['currentTest', 'fullName'], jasmine['testPath'].split('/').pop().split('.')[0])}]`, get(jasmine, ['currentTest', 'failedExpectations'], []).map(x => x.stack))) // eslint-disable-line
}

// Patch tests to include their own name
jasmine.getEnv().addReporter({ // eslint-disable-line
    specStarted: result => jasmine.currentTest = result, // eslint-disable-line
    specDone: result => jasmine.currentTest = result, // eslint-disable-line
})
