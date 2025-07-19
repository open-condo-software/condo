class TransformRowError extends Error {
    /**
     * @param {string[]} messages
     */
    constructor (messages) {
        super(`Errors: ${messages.join(', ')}`)
        this.messages = messages
    }

    /**
     * @return {string[]}
     */
    getMessages () {
        return this.messages
    }
}

module.exports = {
    TransformRowError,
}
