AbstractAuthMiddleware = require('./AbstractAuthMiddleware')

class SimpleAuthMiddleware extends AbstractAuthMiddleware {
    static auth(socket, next) {
        const handshakeData = socket.request;
        console.log('auth-d', handshakeData._query['timer'])
        next()
    }
}

module.exports = SimpleAuthMiddleware
