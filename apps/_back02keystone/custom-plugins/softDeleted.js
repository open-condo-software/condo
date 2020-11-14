const { DateTimeUtc } = require('@keystonejs/fields')
const { composeHook } = require('./_common')
const { getType } = require('@keystonejs/utils')

const softDeleted = ({ deletedAtField = 'deletedAt' } = {}) => ({ fields = {}, hooks = {}, access, ...rest }, { keystone }) => {
    // TODO(pahaz):
    //  [x] 1) filter by default deletedAt = null (access.read), how-to change it?!
    //  [x] 2) allow update only for deletedAt = null (access.update)
    //  [x] 3) disallow access to hard delete (access.delete)
    //  [ ] 4) what if some object has FK (Relation) to SoftDeletedList ?

    const datedOptions = {
        type: DateTimeUtc,
        access: {
            read: true,
            create: false,
            update: true,
        },
        kmigratorOptions: { null: true, db_index: true },
    }

    fields[deletedAtField] = { ...datedOptions }

    const newResolveInput = ({ resolvedData, existingItem }) => {
        if (resolvedData[deletedAtField]) {
            resolvedData[deletedAtField] = new Date().toISOString()
        }
        if (existingItem && existingItem[deletedAtField]) {
            throw new Error('Already deleted')
        }
        return resolvedData
    }

    const originalResolveInput = hooks.resolveInput
    hooks.resolveInput = composeHook(originalResolveInput, newResolveInput)

    const newAccess = (args) => {
        const { operation } = args
        if (operation === 'read') {
            const current = getOpAccess('read', keystone, access, args)
            return applySoftDeletedFilters(current, deletedAtField)
        } else if (operation === 'delete') {
            return false
        } else {
            return getOpAccess(operation, keystone, access, args)
        }
    }

    return { fields, hooks, access: newAccess, ...rest }
}

function getOpAccess (op, keystone, access, args) {
    const type = getType(access)
    switch (type) {
        case 'Boolean':
            return access || false
        case 'Function':
            return access(args) || false
        case 'Object':
            const opAccess = access[op]
            if (opAccess) return getOpAccess(op, keystone, opAccess, args)
            return keystone.defaultAccess.list || false
        case 'Undefined':
            return keystone.defaultAccess.list || false
        default:
            throw new Error(
                `getReadAccess(), received ${type}.`,
            )
    }
}

function applySoftDeletedFilters (access, deletedAtField) {
    const type = getType(access)
    switch (type) {
        case 'Boolean':
            return (access) ? { [deletedAtField]: null } : false
        case 'Object':
            const anyFilterByDeleted = Object.keys(access).find((x) => x.startsWith(deletedAtField))
            if (anyFilterByDeleted) return access
            return {
                ...access,
                [deletedAtField]: null,
            }
        default:
            throw new Error(
                `applySoftDeletedFilters() accept a boolean or a object, received ${type}.`,
            )
    }
}

module.exports = {
    softDeleted,
}
