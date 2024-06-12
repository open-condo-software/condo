const notifyResidentsAboutDelayedNewsItem = require('./notifyResidentsAboutDelayedNewsItems')
const { notifyResidentsAboutNewsItemTask } = require('./notifyResidentsAboutNewsItem')
const publishSharedNewsItem = require('./publishSharedNewsItem')
const publishSharedNewsItemsByNewsItem = require('./publishSharedNewsItemsByNewsItem')
const publishDelayedSharedNewsItems = require('./publishDelayedSharedNewsItems')

module.exports = {
    notifyResidentsAboutNewsItemTask,
    notifyResidentsAboutDelayedNewsItem,
    publishDelayedSharedNewsItems,
    publishSharedNewsItem,
    publishSharedNewsItemsByNewsItem,
}
