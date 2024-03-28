const notifyResidentsAboutDelayedNewsItem = require('./notifyResidentsAboutDelayedNewsItems')
const { notifyResidentsAboutNewsItemTask } = require('./notifyResidentsAboutNewsItem')
const publishSharedNewsItem = require('./publishSharedNewsItem')
const publishSharedNewsItemsByNewsItem = require('./publishSharedNewsItemsByNewsItem')

module.exports = {
    notifyResidentsAboutNewsItemTask,
    notifyResidentsAboutDelayedNewsItem,
    publishSharedNewsItem,
    publishSharedNewsItemsByNewsItem,
}
