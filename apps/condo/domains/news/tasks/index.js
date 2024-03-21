const { createTask, createCronTask } = require('@open-condo/keystone/tasks')

const { notifyResidentsAboutDelayedNewsItems } = require('./notifyResidentsAboutDelayedNewsItems')
const { notifyResidentsAboutNewsItem } = require('./notifyResidentsAboutNewsItem')
const { publishSharedNewsItem } = require('./publishSharedNewsItem')
const { publishSharedNewsItemsByNewsItem } = require('./publishSharedNewsItemsByNewsItem')

module.exports = {
    notifyResidentsAboutNewsItem: createTask('notifyResidentsAboutNewsItem', notifyResidentsAboutNewsItem, { priority: 2 }),
    publishSharedNewsItem: createTask('publishSharedNewsItem', publishSharedNewsItem, { priority: 3 }),
    publishSharedNewsItemsByNewsItem: createTask('publishSharedNewsItemsByNewsItem', publishSharedNewsItemsByNewsItem, { priority: 2 }),
    // cron tasks
    notifyResidentsAboutDelayedNewsItem: createCronTask('notifyResidentsAboutDelayedNewsItems', '* * * * *', notifyResidentsAboutDelayedNewsItems),
}
