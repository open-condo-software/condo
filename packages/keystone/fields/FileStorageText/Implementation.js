const { Text } = require('@keystonejs/fields')

class FileStorageTextImplementation extends Text.implementation {
    constructor (path, {
        adapter,
    }) {
        super(...arguments)
        this.fileAdapter = adapter
        this.isMultiline = true
        this.isOrderable = false
    }
    equalityInputFields () {
        return []
    }
    equalityInputFieldsInsensitive () {
        return []
    }
    inInputFields () {
        return []
    }
    orderingInputFields () {
        return []
    }
    stringInputFields () {
        return []
    }
    stringInputFieldsInsensitive () {
        return []
    }
}

module.exports = {
    FileStorageTextImplementation,
}
