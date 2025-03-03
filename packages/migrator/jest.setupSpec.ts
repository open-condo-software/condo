import execa from 'execa'

const STARTUP_TIMEOUT_IN_MS = 60 * 1000 // 1 min

beforeAll(async () => {
    // NOTE: We need to build migrator to run e2e tests (src/cli.spec.ts)
    await execa('yarn', ['workspace', '@open-condo/migrator', 'build'])
}, STARTUP_TIMEOUT_IN_MS)