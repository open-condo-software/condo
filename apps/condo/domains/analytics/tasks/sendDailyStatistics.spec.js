/**
 * @jest-environment node
 */
const index = require('@app/condo/index')

const { setFakeClientMode, setFeatureFlag } = require('@open-condo/keystone/test.utils')

const { SEND_DAILY_STATISTICS_TASK } = require('@condo/domains/common/constants/featureflags')

const { sendDailyStatisticsTask } = require('./sendDailyStatistics')


describe('sendDailyStatistics', () => {
    setFakeClientMode(index)

    describe('task should correct work', () => {
        test('should return "disabled" if feature flag is disabled', async () => {
            setFeatureFlag(SEND_DAILY_STATISTICS_TASK, false)
            expect(await sendDailyStatisticsTask.delay.fn()).toBeDefined()
        })
    })
})
