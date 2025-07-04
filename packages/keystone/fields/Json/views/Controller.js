import FieldController from '@open-keystone/fields/Controller'

const { omitRecursively } = require('../utils/cleaner')

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
        return JSON.stringify(omitRecursively(data[path], '__typename'))
    }

    serialize = data => {
        const { path } = this
        if (!data || !data[path]) {
            // Forcibly return null if empty string
            return null
        }
        return omitRecursively(JSON.parse(data[path]), '__typename')
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
