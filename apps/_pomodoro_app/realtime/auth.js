/**
 * This buddy is a middleware, that handles auth in socket.io
 * More here: https://socket.io/docs/migrating-from-0-9/
 * @param socket
 * @param next {function}
 */
function authMiddleware(socket, next) {
    const handshakeData = socket.request;
    console.log('auth-d', handshakeData._query['team'])
    next()
}

module.exports = authMiddleware

