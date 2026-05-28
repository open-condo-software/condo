const EXTRA_LOGGING = process.env.DISABLE_LOGGING !== 'true'

jest.setTimeout(60000)

if (EXTRA_LOGGING) {
    jasmine.getEnv().addReporter({
        specStarted: result => jasmine.currentTest = result,
        specDone: result => jasmine.currentTest = result,
    })

    beforeEach(() => console.log('[BEGIN] TEST:', jasmine['currentTest']))
    afterEach(() => console.log('[END] TEST:', jasmine['currentTest']))
}
