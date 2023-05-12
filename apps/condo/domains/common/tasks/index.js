const { getLogger } = require('@open-condo/keystone/logging')
const { createCronTask } = require('@open-condo/keystone/tasks')

const logger = getLogger('common-sample-task')

// Will never be called. (At 00:00 on day-of-month 31 in February)
module.exportts = {
    sampleTask: createCronTask('commonSampleCronTask', '0 0 31 2 *', () => {
        logger.info('common-sample-cron-task successful call')
    }),
}