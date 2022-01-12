const { sleep } = require('./sleep')

const DELAY_MS = 3000

describe('sleep', () => {
    test(`delays at least required number of milliseconds (${DELAY_MS})`, async () => {
        const startTimestamp = Date.now()

        await sleep(DELAY_MS)

        const delayTime = Date.now() - startTimestamp

        expect(delayTime).toBeGreaterThanOrEqual(DELAY_MS)
    })
})
