const falsey = require('falsey')
const { get } = require('lodash')

const EXTRA_LOGGING = falsey(process.env.DISABLE_LOGGING)

jest.setTimeout(60000)

// Patch tests to include their own name
jasmine.getEnv().addReporter({ // eslint-disable-line
    specStarted: result => jasmine.currentTest = result, // eslint-disable-line
    specDone: result => jasmine.currentTest = result, // eslint-disable-line
})

if (EXTRA_LOGGING) {
    beforeEach(() => console.log(`[TEST BEGIN][${get(jasmine, ['currentTest', 'fullName'], jasmine['testPath'].split('/').pop().split('.')[0])}]`)) // eslint-disable-line
    afterEach(() => console.log(`[TEST END][${get(jasmine, ['currentTest', 'fullName'], jasmine['testPath'].split('/').pop().split('.')[0])}]`, get(jasmine, ['currentTest', 'failedExpectations'], []).map(x => x.stack))) // eslint-disable-line
}
