import execa from 'execa'

const STARTUP_TIMEOUT_IN_MS = 60 * 1000 // 1 min

beforeAll(async () => {
    // Build before running of tests
    await execa('yarn', ['workspace', '@open-condo/billing', 'build'])
}, STARTUP_TIMEOUT_IN_MS)
