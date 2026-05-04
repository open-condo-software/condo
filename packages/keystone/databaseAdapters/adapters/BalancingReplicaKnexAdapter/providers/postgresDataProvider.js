class PostgresDataProvider {
    shouldHandleFind () {
        return false
    }

    async executeFind () {
        return null
    }

    shouldHandleItemsQuery () {
        return false
    }

    async executeItemsQuery () {
        return null
    }

    shouldHandleCreate () {
        return false
    }

    async executeCreate () {
        return null
    }

    shouldHandleUpdate () {
        return false
    }

    async executeUpdate () {
        return null
    }

    shouldHandleDelete () {
        return false
    }

    async executeDelete () {
        return null
    }
}

module.exports = {
    PostgresDataProvider,
}
