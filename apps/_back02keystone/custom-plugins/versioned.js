const { Integer } = require('@keystonejs/fields')

const composeHook = (originalHook, newHook) => async params => {
    let { resolvedData } = params
    if (originalHook) {
        resolvedData = await originalHook(params)
    }
    return newHook({ ...params, resolvedData })
}

const versioned = ({ versionField = 'v', startBy = 1 } = {}) => ({ fields = {}, hooks = {}, ...rest }) => {
    const versionOptions = {
        type: Integer,
        isRequired: true,
        defaultValue: startBy,
        access: {
            create: false,
            read: true,
            update: false,
        },
        knexOptions: { defaultTo: knex => startBy },
    }

    fields[versionField] = versionOptions

    const newResolveInput = ({ resolvedData, existingItem }) => {
        if (existingItem) {
            resolvedData[versionField] = Number(existingItem[versionField] || startBy) + 1
        }

        return resolvedData
    }
    const originalResolveInput = hooks.resolveInput
    hooks.resolveInput = composeHook(originalResolveInput, newResolveInput)
    return { fields, hooks, ...rest }
}

module.exports = {
    versioned,
}
