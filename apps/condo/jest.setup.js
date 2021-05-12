// setup TESTS_FAKE_CLIENT_MODE
const { setFakeClientMode } = require('@core/keystone/test.utils')
const { createWorker, taskQueue } = require('@core/keystone/tasks')
const conf = require('@core/config')

if (conf.TESTS_FAKE_CLIENT_MODE) setFakeClientMode(require.resolve('./index'))
if (conf.TESTS_FAKE_WORKER_MODE) createWorker(require.resolve('./index')).catch((error) => {
    console.error(error)
    process.exit(2)
})

beforeAll(async () => {
    return await taskQueue.isReady()
})

afterAll(async () => {
    return await taskQueue.close()
})
