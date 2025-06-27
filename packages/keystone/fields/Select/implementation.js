const { Select: KSSelect } = require('@open-keystone/fields')
const inflection = require('inflection')


class Select extends KSSelect.implementation {
    constructor (path, fieldOptions) {
        super(...arguments)
        const { graphQLReturnType } = fieldOptions
        this.graphQLReturnType = graphQLReturnType
    }

    getTypeName () {
        if (this.graphQLReturnType) {
            return this.graphQLReturnType
        } else {
            return `${this.listKey}${inflection.classify(this.path)}Type`
        }
    }

    getGqlAuxTypes () {
        // NOTE: if graphQLReturnType is specified then all types are already defined somewhere else
        if (this.graphQLReturnType) {
            return []
        } else {
            return [
                `
      enum ${this.getTypeName()} {
        ${this.options.map(i => i.value).join('\n        ')}
      }
    `,
            ]
        }
    }
}

module.exports = {
    Select,
}
