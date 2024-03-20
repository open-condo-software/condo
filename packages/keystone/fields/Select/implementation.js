const { Select: KSSelect } = require('@keystonejs/fields')

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
            return super.getTypeName()
        }
    }

    getGqlAuxTypes () {
        // NOTE: if graphQLReturnType is specified then all types are already defined somewhere else
        if (this.graphQLReturnType) {
            return []
        } else {
            return super.getGqlAuxTypes()
        }
    }
}

module.exports = {
    Select,
}
