const { Text } = require('@keystonejs/fields')

class CloudStorageTextImplementation extends Text.implementation {
    constructor (path, {
        adapter,
    }) {
        super(...arguments)
        this.fileAdapter = adapter
        this.isMultiline = true
    }
}

module.exports = {
    CloudStorageTextImplementation,
}
