const { createTask, createCronTask } = require('@open-condo/keystone/tasks')

const { exportRecipientsTaskWorker } = require('./exportRecipientsTaskWorker')
const { notifyResidentsAboutDelayedNewsItemsCronTaskWorker } = require('./notifyResidentsAboutDelayedNewsItemsCronTaskWorker')
const { notifyResidentsAboutNewsItemTaskWorker } = require('./notifyResidentsAboutNewsItemTaskWorker')

const exportRecipientsTask = createTask('exportRecipients', exportRecipientsTaskWorker, { priority: 2 })
const notifyResidentsAboutNewsItemCronTask = createCronTask('notifyResidentsAboutDelayedNewsItems', '* * * * *', notifyResidentsAboutDelayedNewsItemsCronTaskWorker)
const notifyResidentsAboutNewsItemTask = createTask('notifyResidentsAboutNewsItem', notifyResidentsAboutNewsItemTaskWorker, { priority: 2 })

module.exports = {
    exportRecipientsTask,
    notifyResidentsAboutNewsItemCronTask,
    notifyResidentsAboutNewsItemTask,
}
