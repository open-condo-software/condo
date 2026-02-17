const { configure, checkNatsAccess, getAvailableStreams } = require('./natsAuthCallout')
const {
    encodeNatsJwt,
    decodeNatsJwt,
    createUserJwt,
    createAuthResponseJwt,
    computePermissions,
} = require('./natsJwt')
const { matchNatsSubject, isSubjectAllowed } = require('./subjectMatch')

module.exports = {
    configure,
    checkNatsAccess,
    getAvailableStreams,
    encodeNatsJwt,
    decodeNatsJwt,
    createUserJwt,
    createAuthResponseJwt,
    computePermissions,
    matchNatsSubject,
    isSubjectAllowed,
}
