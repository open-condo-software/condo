/**
 * A class to handle the auth of the socket
 */
class AbstractAuthMiddleware {

    /**
     * This buddy is a middleware, that handles auth in socket.io
     * More here: https://socket.io/docs/migrating-from-0-9/
     * @param socket
     * @param next {function}
     */
    static auth(socket, next) {}
}

module.exports = AbstractAuthMiddleware
