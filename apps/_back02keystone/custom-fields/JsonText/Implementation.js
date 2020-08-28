const { Implementation } = require('@keystonejs/fields')

class JsonTextImplementation extends Implementation {
    constructor (path, { isMultiline }) {
        super(...arguments)
        this.isMultiline = isMultiline
        this.isOrderable = false
    }

    // Output

    gqlOutputFields () {
        return [`${this.path}: String`]
    }

    gqlOutputFieldResolvers () {
        return {
            [`${this.path}`]: item => {
                const data = item[this.path]
                if (!data) return data
                return JSON.stringify(data)
            },
        }
    }

    // Input

    gqlQueryInputFields () {
        return [
            ...this.equalityInputFields('String'),
            ...this.inInputFields('String'),
        ]
    }

    gqlUpdateInputFields () {
        return [`${this.path}: String`]
    }

    gqlCreateInputFields () {
        return [`${this.path}: String`]
    }

    extendAdminMeta (meta) {
        const { isMultiline } = this
        return { isMultiline, ...meta }
    }

    async resolveInput ({
        existingItem,
        originalInput,
        resolvedData,
        context,
    }) {
        const previousData = existingItem && existingItem[this.path] || {}
        const uploadData = resolvedData[this.path]
        let result

        // NOTE: The following two conditions could easily be combined into a
        // single `if (!uploadData) return uploadData`, but that would lose the
        // nuance of returning `undefined` vs `null`.
        // Premature Optimisers; be ware!
        if (typeof uploadData === 'undefined') {
            // Nothing was passed in, so we can bail early.
            return undefined
        }

        if (uploadData === null) {
            // `null` was specifically uploaded, and we should set the field value to
            // null. To do that we... return `null`
            return null
        }

        try {
            result = JSON.parse(uploadData)
        } catch (e) {
            throw new Error(`[json] wrong json format: ${e}`)
        }
        if (typeof result !== 'object') {
            throw new Error('[json] only json object supported')
        }

        return result
    }
}

module.exports = {
    JsonTextImplementation,
}
