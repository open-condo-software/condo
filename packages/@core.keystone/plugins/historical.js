const { v4: uuid } = require('uuid')
const {
    Select, DateTimeUtc, Uuid, DateTime, CalendarDay, Checkbox, Decimal, Float, Text, Integer,
} = require('@keystonejs/fields')
const { getType } = require('@keystonejs/utils')

const { Json, Stars } = require('../custom-fields')

const { HiddenRelationship } = require('./utils')
const { composeHook, isValidDate } = require('./utils')

const GQL_TYPE_SUFFIX = 'HistoryRecord'

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

function prepareHistoryRecordFields (listKey, listFields, historyField, ignoreFieldTypes) {
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
        }),
        Relationship: (field) => ({
            type: HiddenRelationship,
            ref: field.ref,
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
        [`${historyField}_action`]: {
            type: Select,
            options: 'c, u, d',
            isRequired: true,
        },
        [`${historyField}_id`]: {
            type: HiddenRelationship,
            ref: `${listKey}`,
            isRequired: true,
            kmigratorOptions: { null: false, db_index: true },
        },
    }
}

function prepareHistoryRecordInput (
    { operation, existingItem, updatedItem },
    historyField,
    historicalFields,
    historicalList,
) {
    // create / update / delete
    const op = operation[0]
    // no updatedItem on delete
    const item = updatedItem || existingItem
    const hist = { ...item }
    hist[`${historyField}_id`] = item['id']
    hist[`${historyField}_action`] = op
    hist[`${historyField}_date`] = (new Date()).toISOString()
    for (let name in hist) {
        if (!historicalFields.hasOwnProperty(name)) {
            delete hist[name]
            continue
        }

        if (historicalFields[name].type.type === 'HiddenRelationship') {
            // stringify relations
            hist[name] = (hist[name]) ? String(hist[name]) : hist[name]
        } else if (isValidDate(hist[name])) {
            // stringify datetime
            hist[name] = hist[name].toISOString()
        }
    }
    delete hist['id']
    return hist
}

const historical = ({ historyField = 'history', ignoreFieldTypes = ['Content'], isStrictMode = true } = {}) => ({ fields = {}, hooks = {}, access, ...rest }, { listKey, keystone }) => {
    const historicalFields = prepareHistoryRecordFields(listKey, fields, historyField, ignoreFieldTypes)
    const historicalListKey = `${listKey}${GQL_TYPE_SUFFIX}`
    const query = `
      mutation create${historicalListKey} ($data: ${historicalListKey}CreateInput!) {
        obj: create${historicalListKey}(data: $data) { id }
      }
    `

    const historicalList = createHistoricalList(keystone, access, historicalListKey, historicalFields)

    const hook = async (hookArgs) => {
        const hist = prepareHistoryRecordInput(hookArgs, historyField, historicalFields, historicalList)
        const { context } = hookArgs
        const { errors } = await context.executeGraphQL({
            context: context.createContext({ skipAccessControl: true }),
            query: query,
            variables: {
                data: hist,
            },
        })
        if (errors) {
            console.warn(errors)
            if (isStrictMode) throw new Error('Cant\' create history record')
        }
    }

    const originalAfterChange = hooks.afterChange
    hooks.afterChange = composeHook(originalAfterChange, hook)
    const originalBeforeDelete = hooks.beforeDelete
    hooks.beforeDelete = composeHook(originalBeforeDelete, hook)
    return { fields, hooks, access, ...rest }
}

module.exports = {
    historical,
}
