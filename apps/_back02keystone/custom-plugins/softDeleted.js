const { DateTimeUtc } = require('@keystonejs/fields')
const { composeHook } = require('./_common')

const softDeleted = ({ deletedAtField = 'deletedAt' } = {}) => ({ fields = {}, hooks = {}, ...rest }) => {
    // TODO(pahaz):
    //  1) filter by default deletedAt = null (access.read), how-to change it?!
    //  2) allow update only to deletedAt = null (access.update)
    //  3) disallow access to hard delete (access.delete)

    const datedOptions = {
        type: DateTimeUtc,
        access: {
            read: true,
            create: false,
            update: true,
        },
    }

    fields[deletedAtField] = { ...datedOptions }

    const newResolveInput = ({ resolvedData, existingItem }) => {
        if (resolvedData[deletedAtField]) {
            if (existingItem[deletedAtField]) {
                throw new Error('Already deleted')
            } else {
                const dateNow = new Date().toISOString()
                resolvedData[deletedAtField] = dateNow
            }
        }

        return resolvedData
    }

    const originalResolveInput = hooks.resolveInput
    hooks.resolveInput = composeHook(originalResolveInput, newResolveInput)
    return { fields, hooks, ...rest }
}

module.exports = {
    softDeleted,
}
