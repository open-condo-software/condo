const { Stars } = require('../../custom-fields')
const {
    Select, DateTimeUtc, Uuid, DateTime, CalendarDay, Checkbox, Decimal, Float, Text, Integer,
} = require('@keystonejs/fields')
const { v4: uuid } = require('uuid')
const { getType } = require('@keystonejs/utils')
const { Json } = require('../../custom-fields')
const { HiddenRelationship } = require('./field')

const GQL_TYPE_SUFFIX = 'HistoryRecord'

const composeHook = (originalHook, newHook) => async params => {
    let { resolvedData } = params
    if (originalHook) {
        resolvedData = await originalHook(params)
    }
    return newHook({ ...params, resolvedData })
}

function createHistoricalList (keystone, access, historicalListKey, historicalFields) {
    let historicalAccess = access
    if (access) {
        historicalAccess = ({ operation, ...rest }) => {
            if (operation === 'read') {
                const type = getType(access)
                switch (type) {
                    case 'Boolean':
                        return access
                    case 'Function':
                        return access({ operation, ...rest })
                    case 'Object':
                        return access.read || false
                    default:
                        throw new Error(
                            `Shorthand access must be specified as either a boolean or a function, received ${type}.`,
                        )
                }
            }
            // only read allowed for history!
            return false
        }
    }

    let historicalList = keystone.getListByKey(historicalListKey)
    if (!historicalList) {
        historicalList = keystone.createList(historicalListKey, {
            fields: historicalFields,
            access: historicalAccess,
        })
    }

    return historicalList
}

function preprocessFields (listKey, listFields, historyField, ignoreFieldTypes) {
    const defaultMapping = (field) => ({ type: Json })
    const typeMapping = {
        Stars: (field) => ({ type: Stars, starCount: field.starCount }),
        DateTime: (field) => ({ type: DateTime }),
        DateTimeUtc: (field) => ({ type: DateTimeUtc }),
        CalendarDay: (field) => ({ type: CalendarDay }),
        // File: (field) => ({ type: Json }),
        Password: (field) => ({ type: Text }),
        // Virtual: (field) => ({ type: Json }),
        Color: (field) => ({ type: Text }),
        Checkbox: (field) => ({ type: Checkbox }),
        Integer: (field) => ({ type: Integer }),
        Version: (field) => ({ type: Integer }),
        Float: (field) => ({ type: Float }),
        Decimal: (field) => ({ type: Decimal }),
        // LocationGoogle: (field) => ({ type: Json }),
        Select: (field) => ({ type: Text }),
        Uuid: (field) => ({ type: Uuid }),
        Url: (field) => ({ type: Text }),
        Slug: (field) => ({ type: Text }),
        Text: (field) => ({ type: Text }),
        AuthedRelationship: (field) => ({
            type: HiddenRelationship,
            ref: field.ref,
            kmigratorOptions: { 'db_constraint': false, db_index: false },
        }),
        Relationship: (field) => ({
            type: HiddenRelationship,
            ref: field.ref,
            kmigratorOptions: { 'db_constraint': false, db_index: false },
        }),
    }
    const ignoreTypes = ignoreFieldTypes || []
    const historyFields = Object.fromEntries(
        Object.entries(listFields)
            .filter(([k, v]) => v.type.type !== 'Relationship' || !v.many)
            .filter(([k, v]) => !ignoreTypes.includes(v.type.type))
            .map(([k, v]) => {
                const newValue = (typeMapping[v.type.type] ? typeMapping[v.type.type] : defaultMapping)(v)
                if (v.access) {
                    const type = getType(v.access)
                    if (type === 'Boolean' || type === 'Function') {
                        newValue['access'] = {
                            read: v.access,
                            create: true,
                        }
                    } else if (type === 'Object') {
                        newValue['access'] = {
                            read: v.access.read,
                            create: true,
                        }
                    } else {
                        throw new Error(
                            `Shorthand access must be specified as either a boolean or a function, received ${type}.`,
                        )
                    }
                }
                return [k, newValue]
            })
            .filter(x => x))
    historyFields['id'] = {
        type: Uuid,
        defaultValue: () => uuid(),
        isRequired: true,
    }

    return {
        ...historyFields,
        [`${historyField}_date`]: { type: DateTimeUtc, isRequired: true },
        [`${historyField}_action`]: { type: Select, options: 'c, u, d', isRequired: true },
        [`${historyField}_id`]: {
            type: HiddenRelationship,
            many: false,
            ref: `${listKey}`,
            isRequired: true,
            kmigratorOptions: { 'db_constraint': false, null: false },
        },
    }
}

const historical = ({ historyField = 'history', ignoreFieldTypes = ['Content'] } = {}) => ({ fields = {}, hooks = {}, access, ...rest }, { listKey, keystone }) => {
    const historicalFields = preprocessFields(listKey, fields, historyField, ignoreFieldTypes)
    const historicalListKey = `${listKey}${GQL_TYPE_SUFFIX}`
    const query = `
      mutation create${historicalListKey} ($data: ${historicalListKey}CreateInput!) {
        obj: create${historicalListKey}(data: $data) { id }
      }
    `

    createHistoricalList(keystone, access, historicalListKey, historicalFields)

    const afterChange = async ({
        operation,
        existingItem,
        originalInput,
        updatedItem,
        context,
    }) => {
        const op = existingItem ? 'u' : 'c'
        const hist = { ...updatedItem }
        for (let name in hist) {
            if (!historicalFields.hasOwnProperty(name)) {
                delete hist[name]
            }
        }
        hist[`${historyField}_id`] = updatedItem['id'] || existingItem['id']
        hist[`${historyField}_action`] = op
        hist[`${historyField}_date`] = (new Date()).toUTCString()
        delete hist['id']

        await context.executeGraphQL({
            context: context.createContext({ skipAccessControl: true }),
            query: query,
            variables: {
                data: hist,
            },
        })
    }

    const beforeDelete = async ({
        operation,
        existingItem,
        context,
    }) => {
        const op = 'd'
        const hist = { ...existingItem }
        for (let name in hist) {
            if (!historicalFields.hasOwnProperty(name)) {
                delete hist[name]
            }
        }
        hist[`${historyField}_id`] = existingItem['id']
        hist[`${historyField}_action`] = op
        hist[`${historyField}_date`] = (new Date()).toUTCString()
        delete hist['id']

        await context.executeGraphQL({
            context: context.createContext({ skipAccessControl: true }),
            query: query,
            variables: {
                data: hist,
            },
        })
    }

    const originalAfterChange = hooks.afterChange
    hooks.afterChange = composeHook(originalAfterChange, afterChange)
    const originalBeforeDelete = hooks.beforeDelete
    hooks.beforeDelete = composeHook(originalBeforeDelete, beforeDelete)
    return { fields, hooks, access, ...rest }
}

module.exports = {
    historical,
}
