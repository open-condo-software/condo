const { get } = require('lodash')

const EXTRA_LOGGING = process.env.DISABLE_LOGGING !== 'true'

// Patch tests to include their own name
jasmine.getEnv().addReporter({ // eslint-disable-line
    specStarted: result => jasmine.currentTest = result, // eslint-disable-line
    specDone: result => jasmine.currentTest = result, // eslint-disable-line
})

if (EXTRA_LOGGING) {
    beforeEach(() => console.log(`[TEST BEGIN][${get(jasmine, ['currentTest', 'fullName'], jasmine['testPath'].split('/').pop().split('.')[0])}]`)) // eslint-disable-line
    afterEach(() => console.log(`[TEST END][${get(jasmine, ['currentTest', 'fullName'], jasmine['testPath'].split('/').pop().split('.')[0])}]`)) // eslint-disable-line
}
