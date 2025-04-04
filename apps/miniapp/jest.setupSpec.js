const EXTRA_LOGGING = process.env.DISABLE_LOGGING !== 'true'

if (EXTRA_LOGGING) {
    // Patch tests to include their own name
    jasmine.getEnv().addReporter({ // eslint-disable-line
        specStarted: result => jasmine.currentTest = result, // eslint-disable-line
        specDone: result => jasmine.currentTest = result, // eslint-disable-line
    })

    beforeEach(() => console.log('[BEGIN] TEST:', jasmine['currentTest'])) // eslint-disable-line
    afterEach(() => console.log('[END] TEST:', jasmine['currentTest'])) // eslint-disable-line
}
