import FieldController from '@open-keystone/fields/Controller'

class OptionsController extends FieldController {
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
        return this.config.options.reduce((prev, next) => ({ ...prev, [next]: data[path][next] }), {})
    }

    serialize = data => {
        const { path } = this
        if (!data || !data[path]) {
            // Forcibly return null if empty string
            return null
        }
        return this.config.options.reduce((prev, next) => ({ ...prev, [next]: data[path][next] }), {})
    }

    getQueryFragment = () => {
        return `
            ${this.path} {
               ${this.config.options.join(' ')}
            }
        `
    }

    // For simplicity let's disable filtering on this field (PRs welcome)
    getFilterTypes = () => { return [] }
}

export default OptionsController
