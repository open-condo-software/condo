const { composeResolveInputHook } = require('./utils')
const { plugin } = require('./utils/typing')

const versioned = ({ versionField = 'v', startBy = 1 } = {}) => plugin(({ fields = {}, hooks = {}, ...rest }) => {
    const versionOptions = {
        type: 'Integer',
        isRequired: true,
        defaultValue: startBy,
        access: {
            create: false,
            read: true,
            update: false,
        },
        knexOptions: { defaultTo: knex => startBy },
    }

    fields[versionField] = { ...versionOptions }

    const newResolveInput = ({ resolvedData, existingItem }) => {
        if (existingItem) {
            resolvedData[versionField] = Number(existingItem[versionField] || startBy) + 1
        }

        return resolvedData
    }
    const originalResolveInput = hooks.resolveInput
    hooks.resolveInput = composeResolveInputHook(originalResolveInput, newResolveInput)
    return { fields, hooks, ...rest }
})

module.exports = {
    versioned,
}
