const { Integer } = require('@keystonejs/fields')
const { History } = require('./field')

const composeHook = (originalHook, newHook) => async params => {
    let { resolvedData } = params
    if (originalHook) {
        resolvedData = await originalHook(params)
    }
    return newHook({ ...params, resolvedData })
}

const historical = ({ historyField = 'history', ignoreFieldTypes = ['Content'] } = {}) => ({ fields = {}, hooks = {}, ...rest }) => {
    const fieldsCopy = { ...fields }
    const historyOptions = {
        type: History,
        fields: fieldsCopy,
        ignoreFieldTypes,
        historyField,
        access: {
            create: false,
            read: true,
            update: false,
        },
    }

    fields[historyField] = historyOptions

    // const newResolveInput = ({ resolvedData, existingItem }) => {
    //     if (existingItem) {
    //         resolvedData[versionField] = Number(existingItem[versionField] || startBy) + 1
    //     }
    //
    //     return resolvedData
    // }
    // const originalResolveInput = hooks.resolveInput
    // hooks.resolveInput = composeHook(originalResolveInput, newResolveInput)
    return { fields, hooks, ...rest }
}

module.exports = {
    historical,
}
