class TransformRowError extends Error {
    constructor (messages) {
        super(`Errors: ${messages.join(', ')}`)
        this.messages = messages
    }

    getMessages () {
        return this.messages
    }
}

module.exports = {
    TransformRowError,
}