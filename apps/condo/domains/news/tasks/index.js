const { createTask, createCronTask } = require('@open-condo/keystone/tasks')

const { exportRecipients } = require('./exportRecipients')
const { notifyResidentsAboutDelayedNewsItems } = require('./notifyResidentsAboutDelayedNewsItems')
const { notifyResidentsAboutNewsItem } = require('./notifyResidentsAboutNewsItem')

module.exports = {
    exportRecipientsTask: createTask('exportRecipients', exportRecipients, { priority: 2 }),
    notifyResidentsAboutDelayedNewsItemsCronTask: createCronTask('notifyResidentsAboutDelayedNewsItems', '* * * * *', notifyResidentsAboutDelayedNewsItems),
    notifyResidentsAboutNewsItemTask: createTask('notifyResidentsAboutNewsItem', notifyResidentsAboutNewsItem, { priority: 2 }),
}
