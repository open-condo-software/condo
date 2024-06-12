const notifyResidentsAboutDelayedNewsItem = require('./notifyResidentsAboutDelayedNewsItems')
const { notifyResidentsAboutNewsItemTask } = require('./notifyResidentsAboutNewsItem')
const publishDelayedSharedNewsItems = require('./publishDelayedSharedNewsItems')
const publishSharedNewsItem = require('./publishSharedNewsItem')
const publishSharedNewsItemsByNewsItem = require('./publishSharedNewsItemsByNewsItem')

module.exports = {
    notifyResidentsAboutNewsItemTask,
    notifyResidentsAboutDelayedNewsItem,
    publishDelayedSharedNewsItems,
    publishSharedNewsItem,
    publishSharedNewsItemsByNewsItem,
}
