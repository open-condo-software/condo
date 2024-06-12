const notifyResidentsAboutDelayedNewsItem = require('./notifyResidentsAboutDelayedNewsItems')
const { notifyResidentsAboutNewsItemTask } = require('./notifyResidentsAboutNewsItem')
const publishDelayedSharedNewsItems = require('./publishDelayedSharedNewsItems')
const publishNewsItemSharing = require('./publishNewsItemSharing')
const publishSharedNewsItemsByNewsItem = require('./publishSharedNewsItemsByNewsItem')

module.exports = {
    notifyResidentsAboutNewsItemTask,
    notifyResidentsAboutDelayedNewsItem,
    publishDelayedSharedNewsItems,
    publishNewsItemSharing,
    publishSharedNewsItemsByNewsItem,
}
