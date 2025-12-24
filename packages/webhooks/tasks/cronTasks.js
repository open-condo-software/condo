const { createCronTask } = require('@open-condo/keystone/tasks')

const CRON_TASKS_CACHE = new Map()

function getWebhookCronTasks (cronSchedules = {}) {
    const {
        retryFailedWebhookPayloads: retrySchedule = '*/1 * * * *',
        deleteOldWebhookPayloads: deleteSchedule = '0 3 * * *',
    } = cronSchedules

    if (!CRON_TASKS_CACHE.has('retryFailedWebhookPayloads')) {
        // Lazy import allows tests to get task references in beforeAll() and spy on their methods with jest.spyOn()
        // If tasks were created at module load time, tests couldn't properly spy on them
        const { retryFailedWebhookPayloads } = require('@open-condo/webhooks/tasks/retryFailedWebhookPayloads')
        CRON_TASKS_CACHE.set('retryFailedWebhookPayloads', createCronTask(
            'retryFailedWebhookPayloads',
            retrySchedule,
            retryFailedWebhookPayloads
        ))
    }
    if (!CRON_TASKS_CACHE.has('deleteOldWebhookPayloads')) {
        // Lazy import allows tests to get task references in beforeAll() and spy on their methods with jest.spyOn()
        // If tasks were created at module load time, tests couldn't properly spy on them
        const { deleteOldWebhookPayloads } = require('@open-condo/webhooks/tasks/deleteOldWebhookPayloads')
        CRON_TASKS_CACHE.set('deleteOldWebhookPayloads', createCronTask(
            'deleteOldWebhookPayloads',
            deleteSchedule,
            deleteOldWebhookPayloads
        ))
    }

    return {
        retryFailedWebhookPayloads: CRON_TASKS_CACHE.get('retryFailedWebhookPayloads'),
        deleteOldWebhookPayloads: CRON_TASKS_CACHE.get('deleteOldWebhookPayloads'),
    }
}

module.exports = {
    getWebhookCronTasks,
}
