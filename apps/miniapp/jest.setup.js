// setup TESTS_FAKE_CLIENT_MODE
const { setFakeClientMode } = require('@condo/keystone/test.utils')
const { createWorker, taskQueue } = require('@condo/keystone/tasks')
const conf = require('@core/config')

if (conf.TESTS_FAKE_CLIENT_MODE) setFakeClientMode(require.resolve('./index'))
if (conf.TESTS_FAKE_WORKER_MODE) createWorker(require.resolve('./index')).catch((error) => {
    console.error(error)
    process.exit(2)
})

beforeAll(async () => {
    jest.setTimeout(10 * 60 * 1000) // 10 min
    return await taskQueue.isReady()
})

afterAll(async () => {
    return await taskQueue.close()
})
