const falsey = require('falsey')

const EXTRA_LOGGING = falsey(process.env.DISABLE_LOGGING)

// The mocked module implementation must be placed into __mocks__/MockedClass near the module itself
console.log('🥸Mock some modules')
jest.mock('@open-condo/clients/address-service-client/AddressServiceClient')
jest.mock('@open-condo/clients/finance-info-client')

if (EXTRA_LOGGING) {
    // Patch tests to include their own name
    jasmine.getEnv().addReporter({ // eslint-disable-line
        specStarted: result => jasmine.currentTest = result, // eslint-disable-line
        specDone: result => jasmine.currentTest = result, // eslint-disable-line
    })

    beforeEach(() => console.log('[BEGIN] TEST:', jasmine['currentTest'])) // eslint-disable-line
    afterEach(() => console.log('[END] TEST:', jasmine['currentTest'])) // eslint-disable-line
}
