const { createOidcClient } = require('./createOidcClient')
const { OIDCMiddleware } = require('./OIDCMiddleware')

module.exports = {
    OIDCMiddleware,
    createOidcClient,
}
