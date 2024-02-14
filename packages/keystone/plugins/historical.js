const { get, isFunction } = require('lodash')
const { v4: uuid } = require('uuid')

const { composeNonResolveInputHook, isValidDate } = require('./utils')
const { plugin } = require('./utils/typing')

const { GQLListSchema } = require('../schema')

const GQL_TYPE_SUFFIX = 'HistoryRecord'

function createHistoricalList (addSchema, access, historicalListKey, historicalFields) {
    if (!isFunction(addSchema)) throw new Error('wrong argument addSchema')
    const historicalList = new GQLListSchema(historicalListKey, {
        fields: historicalFields,
        access: {
            read: ({ authentication: { item: user } }) => !!(get(user, 'isAdmin')),
            create: () => false,
            update: false,
            delete: false,
        },
    })

    addSchema(historicalList)

    return historicalList
}

function prepareHistoryRecordFields (listKey, listFields, historyField, ignoreFieldTypes = []) {
    if (!listKey) throw new Error('can not prepareHistoryRecordFields without listKey')
    if (!listFields) throw new Error('can not prepareHistoryRecordFields without listFields')
    if (!historyField) throw new Error('can not prepareHistoryRecordFields without historyField')
    const defaultMapping = (field) => ({ type: 'Json' })
    const typeMapping = {
        Stars: (field) => ({ type: 'Stars', starCount: field.starCount }),
        DateTime: (field) => ({ type: 'DateTime' }),
        DateTimeUtc: (field) => ({ type: 'DateTimeUtc' }),
        CalendarDay: (field) => ({ type: 'CalendarDay' }),
        // File: (field) => ({ type: 'Json' }),
        Password: (field) => ({ type: 'Text' }),
        // Virtual: (field) => ({ type: 'Json' }),
        Color: (field) => ({ type: 'Text' }),
        Checkbox: (field) => ({ type: 'Checkbox' }),
        Integer: (field) => ({ type: 'Integer' }),
        Version: (field) => ({ type: 'Integer' }),
        Float: (field) => ({ type: 'Float' }),
        Decimal: (field) => ({ type: 'Decimal' }),
        // LocationGoogle: (field) => ({ type: 'Json' }),
        Select: (field) => ({ type: 'Text' }),
        Uuid: (field) => ({ type: 'Uuid' }),
        Url: (field) => ({ type: 'Text' }),
        Slug: (field) => ({ type: 'Text' }),
        Text: (field) => ({ type: 'Text' }),
        LocalizedText: (field) => ({ type: 'Text' }),
        SignedDecimal: (field) => ({ type: 'Decimal' }),
        AuthedRelationship: (field) => ({
            type: 'HiddenRelationship',
            ref: field.ref,
        }),
        Relationship: (field) => ({
            type: 'HiddenRelationship',
            ref: field.ref,
        }),
        RegexplessText: (field) => ({ type: 'Text' }),
    }
    const ignoreTypes = ignoreFieldTypes || []
    const getFieldType = (field) => get(field, 'type.type', get(field, 'type'))
    const historyFields = Object.fromEntries(
        Object.entries(listFields)
            .filter(([k, v]) => !(getFieldType(v) === 'Relationship' && v.many))
            .filter(([k, v]) => !(ignoreTypes.includes(getFieldType(v))))
            .map(([k, v]) => {
                const type = getFieldType(v)
                const newValue = (typeMapping[type] ? typeMapping[type] : defaultMapping)(v)
                newValue.access = {
                    read: true,
                    create: true,
                    update: false,
                    delete: false,
                }
                return [k, newValue]
            })
            .filter(x => x))
    historyFields['id'] = {
        type: 'Uuid',
        defaultValue: () => uuid(),
        isRequired: true,
    }

    return {
        ...historyFields,
        [`${historyField}_date`]: { type: 'DateTimeUtc', isRequired: true },
        [`${historyField}_action`]: {
            type: 'Select',
            options: 'c, u, d',
            isRequired: true,
        },
        [`${historyField}_id`]: {
            type: 'HiddenRelationship',
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

const historical = ({ historyField = 'history', ignoreFieldTypes = ['Content'], isStrictMode = true } = {}) => plugin(({ fields = {}, hooks = {}, access, ...rest }, { schemaName, addSchema }) => {
    const historicalFields = prepareHistoryRecordFields(schemaName, fields, historyField, ignoreFieldTypes)
    const historicalListKey = `${schemaName}${GQL_TYPE_SUFFIX}`
    const query = `
      mutation create${historicalListKey} ($data: ${historicalListKey}CreateInput!) {
        obj: create${historicalListKey}(data: $data) { id }
      }
    `

    const historicalList = createHistoricalList(addSchema, access, historicalListKey, historicalFields)

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
            if (isStrictMode) throw new Error('Can\'t create history record')
        }
    }

    const originalAfterChange = hooks.afterChange
    hooks.afterChange = composeNonResolveInputHook(originalAfterChange, hook)
    const originalBeforeDelete = hooks.beforeDelete
    hooks.beforeDelete = composeNonResolveInputHook(originalBeforeDelete, hook)
    return { fields, hooks, access, ...rest }
})

module.exports = {
    historical,
}
