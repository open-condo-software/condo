import FieldController from '@open-keystone/fields/Controller'

const { serialize, deserialize } = require('../utils')

class JsonController extends FieldController {
    constructor (config, ...args) {
        const defaultValue = config.defaultValue
        super({ ...config, defaultValue }, ...args)
    }

    deserialize = data => {
        return deserialize(data, this.path)
    }

    serialize = data => {
        return serialize(data, this.path)
    }

    getQueryFragment = () => {
        return `
            ${this.path} ${this.config.graphQLAdminFragment}
        `
    }

    // For simplicity let's disable filtering on this field (PRs welcome)
    getFilterTypes = () => { return [] }
}

export default JsonController
