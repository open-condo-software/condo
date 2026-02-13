const { configure, checkNatsAccess, getAvailableStreams } = require('./natsAuthCallout')

module.exports = {
    configure,
    checkNatsAccess,
    getAvailableStreams,
}
