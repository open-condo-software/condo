const { getLogger } = require('@open-condo/keystone/logging')
const { createCronTask } = require('@open-condo/keystone/tasks')

const { garbageCollectorTask } = require('@condo/domains/common/tasks/garbageCollector')

const logger = getLogger('common-sample-task')

const sampleTask = createCronTask('commonSampleCronTask', '0 0 1 1 *', () => {
    logger.info('common-sample-cron-task successful call')
})

// Runs yearly
module.exportts = {
    sampleTask,
    garbageCollectorTask,
}