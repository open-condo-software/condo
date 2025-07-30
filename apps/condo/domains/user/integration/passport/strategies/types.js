// @ts-check

/** @interface */
class AuthStrategy {

    /** @returns {import('passport').Strategy} */
    build () {
        throw new Error('implement me')
    }

    /**
     * One strategy on a single endpoint can authenticate multiple providers,
     * so this method used to aggregate them
     * @returns {Array<string>}
     */
    getProviders () {
        return []
    }
}

module.exports = {
    AuthStrategy,
}