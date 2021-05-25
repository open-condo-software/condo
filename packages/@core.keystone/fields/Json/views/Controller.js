import FieldController from '@keystonejs/fields/Controller'

class JsonController extends FieldController {
    constructor (config, ...args) {
        const defaultValue = config.defaultValue
        super({ ...config, defaultValue }, ...args)
    }

    deserialize = data => {
        const { path } = this
        if (!data || !data[path]) {
            // Forcibly return null if empty string
            return null
        }
        return JSON.stringify(data[path])
    }

    serialize = data => {
        const { path } = this
        if (!data || !data[path]) {
            // Forcibly return null if empty string
            return null
        }
        return JSON.parse(data[path])
    }

    // For simplicity let's disable filtering on this field (PRs welcome)
    getFilterTypes = () => { return [] }
}

export default JsonController
