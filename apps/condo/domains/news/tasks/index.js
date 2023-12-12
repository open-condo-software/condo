const notifyResidentsAboutDelayedNewsItem = require('./notifyResidentsAboutDelayedNewsItems')
const notifyResidentsAboutNewsItem = require('./notifyResidentsAboutNewsItem')
const publishSharedNewsItem = require('./publishSharedNewsItem')
const publishSharedNewsItemsByNewsItem = require('./publishSharedNewsItemsByNewsItem')

module.exports = {
    notifyResidentsAboutNewsItem,
    notifyResidentsAboutDelayedNewsItem,
    publishSharedNewsItem,
    publishSharedNewsItemsByNewsItem,
}
