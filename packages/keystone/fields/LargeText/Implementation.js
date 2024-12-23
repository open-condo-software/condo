const { Text } = require('@keystonejs/fields')

class LargeTextImplementation extends Text.implementation {
    constructor (path, {
        adapter,
    }) {
        super(...arguments)
        this.fileAdapter = adapter
    }
}

module.exports = {
    LargeTextImplementation,
}
