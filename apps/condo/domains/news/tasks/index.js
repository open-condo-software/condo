const notifyResidentsAboutDelayedNewsItem = require('./notifyResidentsAboutDelayedNewsItems')
const { notifyResidentsAboutNewsItemTask } = require('./notifyResidentsAboutNewsItem')
const publishDelayedSharedNewsItems = require('./publishDelayedSharedNewsItems')
const publishNewsItemSharing = require('./publishNewsItemSharing')

module.exports = {
    notifyResidentsAboutNewsItemTask,
    notifyResidentsAboutDelayedNewsItem,
    publishDelayedSharedNewsItems,
    publishNewsItemSharing,
}
