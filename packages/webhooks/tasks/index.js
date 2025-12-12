const { DEFAULT_QUEUE_NAME } = require('@open-condo/keystone/tasks')
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
