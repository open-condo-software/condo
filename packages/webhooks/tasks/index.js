const { DEFAULT_QUEUE_NAME } = require('@open-condo/keystone/tasks')
// NOTE: We use two separate caches (cronTasks and regularTasks) with lazy loading because:
// 1. Prevents cyclic dependencies (e.g., retryFailedWebhookPayloads uses regularTasks, which would create a cycle)
// 2. Lazy loading allows tests to get task references in beforeAll() and spy on their methods with jest.spyOn()
// 3. Cron tasks and regular tasks have different initialization parameters (cronSchedules vs taskPriority)
// 4. Separate caches allow independent configuration and lifecycle management for each task type
// 5. This pattern enables consumers to fetch only cron tasks or only regular tasks without loading both
const { getWebhookCronTasks } = require('@open-condo/webhooks/tasks/cronTasks')
const { getWebhookRegularTasks } = require('@open-condo/webhooks/tasks/regularTasks')

/**
 * Gets all webhook tasks including regular tasks and cron tasks
 * @param {string} taskPriority - Task queue priority (default: DEFAULT_QUEUE_NAME)
 * @param {Object} cronSchedules - Optional cron schedule overrides
 * @returns {Object} Object containing all webhook tasks
 */
function getWebhookTasks (taskPriority = DEFAULT_QUEUE_NAME, cronSchedules = {}) {
    const regularTasks = getWebhookRegularTasks(taskPriority)
    const cronTasks = getWebhookCronTasks(cronSchedules)

    return {
        ...regularTasks,
        ...cronTasks,
    }
}

module.exports = {
    getWebhookTasks,
    getWebhookRegularTasks,
    getWebhookCronTasks,
}
