const { Implementation } = require('@open-keystone/fields')

const { JsonKnexFieldAdapter, JsonMongooseFieldAdapter, JsonPrismaFieldAdapter } = require('../Json/Implementation')

class OptionsImplementation extends Implementation {
    constructor (path, { options }, listConfig) {
        super(...arguments)
        if (!Array.isArray(options)) {
            throw new Error(
                `
  🚫 The Options field ${this.listKey}.${path} is not configured with valid options;
  `,
            )
        }
        this.options = options

        // To maintain consistency with other types, we grab the sanitised name
        // directly from the list.
        const { itemQueryName } = listConfig.getListByKey(listConfig.listKey).gqlNames

        // Including the list name + path to make sure these input types are unique
        // to this list+field and don't collide.
        this.graphQLOutputType = `Options${itemQueryName}_${path}`
        this.graphQLInputType = `Options${itemQueryName}Input_${path}`
    }

    // Field auxiliary types are top-level types which a type may need or provide
    getGqlAuxTypes () {
        return [
            `
      type ${this.graphQLOutputType} { \n` + this.options.map(x => `${x}: Boolean\n`) + `
      }
    `,
            `
      input ${this.graphQLInputType} { \n` + this.options.map(x => `${x}: Boolean\n`) + `
      }
    `,
        ]
    }

    gqlAuxFieldResolvers () {
        return {}
    }

    getGqlAuxQueries () {
        return []
    }

    gqlAuxQueryResolvers () {
        return {}
    }

    getGqlAuxMutations () {
        return []
    }

    gqlAuxMutationResolvers () {
        return {}
    }

    // Output

    gqlOutputFields () {
        return [`${this.path}: ${this.graphQLOutputType}`]
    }

    gqlOutputFieldResolvers () {
        return {
            [this.path]: item => {
                const default_ = this.options.reduce((prev, next) => ({ ...prev, [next]: null }), {})
                const itemValues = item[this.path]
                if (itemValues) {
                    Object.assign(default_, itemValues)
                }
                return default_
            },
        }
    }

    // Input

    gqlQueryInputFields () {
        // NOTE: should be implemented by ADAPTER.getQueryConditions()
        return [
            ...this.equalityInputFields(this.graphQLInputType),
            ...this.inInputFields(this.graphQLInputType),
            // TODO(pahaz): Create a graphQL query for each individual option. ADAPTER.getQueryConditions()
            //...this.options.map(option => `${this.path}_${option}: Boolean`),
        ]
    }

    gqlUpdateInputFields () {
        return [`${this.path}: ${this.graphQLInputType}`]
    }

    gqlCreateInputFields () {
        return [`${this.path}: ${this.graphQLInputType}`]
    }

    extendAdminMeta (meta) {
        // Remove additions to extendMeta by the text implementation
        // Add options to adminMeta
        // disable sorting as we don't know how this should be sorted
        return { ...meta, options: this.options }
    }

    getDefaultValue ({ context, originalInput, actions }) {
        const default_ = this.options.reduce((prev, next) => ({ ...prev, [next]: null }), {})
        if (typeof this.defaultValue !== 'undefined') {
            if (typeof this.defaultValue === 'function') {
                Object.assign(default_, this.defaultValue({ context, originalInput, actions }))
            } else {
                Object.assign(default_, this.defaultValue)
            }
        }
        return default_
    }

    async resolveInput ({ resolvedData, existingItem }) {
        const defaultData = this.options.reduce((prev, next) => ({ ...prev, [next]: null }), {})
        const previousData = existingItem && existingItem[this.path] || {}
        const uploadData = resolvedData[this.path]

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

        const mergedData = { ...defaultData, ...previousData, ...uploadData }
        const nonNullKeys = Object.keys(mergedData).filter((k) => mergedData[k] !== null)

        // we don't save any null value! just true/false
        // if key exists it means that it's not null!
        if (nonNullKeys.length === 0) return null
        return Object.fromEntries(nonNullKeys.map(k => [k, mergedData[k]]))
    }
}

module.exports = {
    OptionsImplementation,
    OptionsKnexFieldAdapter: JsonKnexFieldAdapter,
    OptionsMongooseFieldAdapter: JsonMongooseFieldAdapter,
    OptionsPrismaFieldAdapter: JsonPrismaFieldAdapter,
}
