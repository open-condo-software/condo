const { keys, transform, pick, pickBy, omit, isEqual, get, xor } = require('lodash')

/**
 * Utilities to make a GQLListSchema item trackable for changes.
 *
 * Implements changes tracking of a given schema items, that will be displayed
 * in UI in a user-friendly format. This is story for a scope of end-user, not a system.
 *
 * We take a "source" schema, whose changes we want to track and
 * store actual changes in a "destination" schema.
 *
 * Suppose, we have a `Ticket` schema, following workflow will happen:
 * 1. A `Ticket` item is created
 * 2. The item is updated
 * 3. First `TicketChange` item is created
 * 4. The `Ticket` item is updated second time
 * 5. Second `TicketChange` item is created
 *
 * Each `TicketChange` item contains incremental changes of related `Ticket` ("source") schema item.
 * A full snapshot is not stored by following reasons:
 * 1. We already have system `…HistoryRecord` schema, added via `versioned` Keystone plugin;
 * 2. Data bloating should be avoided.
 *
 *
 * ## Integration guide
 *
 * For example, to track changes of `Ticket` schema, following should be done:
 * 1. Decide, what fields should be trackable, using `buildSetOfFieldsToTrackFrom` function;
 * 2. Create a "destination" schema, e.g. `TicketChange`
 * 3. Generate fields for it using `generateChangeTrackableFieldsFrom` function
 * 4. Write `DisplayNameResolvers` (see description below in typedef)
 * 5. Write `RelatedManyToManyResolvers` (see description below in typedef)
 * 6. Implement an `afterChange` hook in `Ticket` and call `storeChangesIfUpdated` inside of it.
 *
 * That's it!
 * Changes of `Ticket` will be stored in `TicketChange` schema!
 *
 * Remember to make migrations of `TicketChange` schema!
 *
 * ## Terms
 *
 * ### Display name
 *
 * String representation of related entity, supposed to be displayed in UI.
 *
 * ### Change storage set
 *
 * Suppose, we are going to store a change of a field, whose name is `…`.
 * When the field is a scalar, following fields will be generated with the same type,
 * as type of field in question:
 *     - `…From`
 *     - `…To`
 * When the field is a `Relationship` with `many: true`, four fields will be generated:
 *     - `…IdsFrom` – old list of ids of related entities;
 *     - `…IdsTo` – new list of ids of related entities;
 *     - `…DisplayNamesFrom` – old list of display names of related entities;
 *     - `…DisplayNamesTo` – new list of display names of related entities.
 * When the field is a single `Relationship`, four fields will be generated:
 *     - `…IdFrom` – old list of ids of related entities;
 *     - `…IdTo` – new list of ids of related entities;
 *     - `…DisplayNameFrom` – old list of display names of related entities;
 *     - `…DisplayNameTo` – new list of display names of related entities.
 *
 * @module changeTrackable
 */

/**
 * Options for fields generator
 * @typedef {Object} Options
 * @property {string[]} except - Fields, that should not take part of change tracking
 */

/**
 * Build set of fields to track, omitting those, specified in options.
 *
 * It's impossible to keep fields in constant somewhere, because we have a circular dependency:
 *     - We need a schema to build fields from
 *     - schema needs fields in it's hook.
 *
 * @param schema
 * @param {Options} options
 * @return {*}
 */
const buildSetOfFieldsToTrackFrom = (schema, options = {}) => (
    omit(schema.fields, options.except || [])
)

/**
 * Indicates, that some resolver does not have required field
 */
class ResolversValidationError extends Error {
    constructor (fields) {
        const message = 'Missing display name resolvers for some fields'
        super(message)
        this.fields = fields
    }
}

/**
 * Generates a "Change storage set" (see Terms) for each field from `fields` object.
 * `fields` object is a set of fields from schema, that is going to be change trackable,
 * it's a "source" schema.
 *
 * Omitting of fields is not implemented here because trackable fields set
 * should be used in different places and calling this function over and over
 * is complicated
 *
 * In provided resolvers it validates presence of props (representing resolver functions),
 * with names, according to provided fields with relationship associations.
 *
 * @example
 *
 * // Schema for tracking changes of `Ticket`
 * const TicketChange = new GQLListSchema('TicketChange', {
 *      fields: {
 *          // Something custom, e.g. reference to source schema,
 *          // whose changes we will track in this schema
 *          ticket: {
 *              type: 'Relationship',
 *              ref: 'Ticket',
 *              isRequired: true,
 *          },
 *
 *          // And this is an actual data-fields, that will store changes
 *          // in the "Change storage set" format
 *          ...generateChangeTrackableFieldsFrom(trackableFields)
 *      }
 * })
 *
 * @param {Object} fields - `fields` object of a Keystone schema
 * @param {Object} singleRelationshipDisplayNameResolvers - map of field names to functions, that resolves display name of "single" relationship for that field
 * @param {Object} manyRelationshipDisplayNameResolvers - map of field names to functions, that resolves display name of "many" relationship for that field
 * @param {Map} [keysOfLocalizedRelationSingleTextFields] - map of field keys that should represent display name of related entity to localization template string like 'ticket.status.*.name'. These fields in resulting generated set will have `LocalizedText` type rather than `Text`.
 * @return {Object} - Set of fields, that should be substituted into a declaration of schema, that will store changes.
 */
function generateChangeTrackableFieldsFrom (
    fields,
    singleRelationshipDisplayNameResolvers,
    manyRelationshipDisplayNameResolvers,
    keysOfLocalizedRelationSingleDisplayNameTextFields,
) {
    const scalars = transform(pickBy(fields, isScalar), mapScalars, {})
    const fieldsOfSingleRelations = pickBy(fields, isRelationSingle)
    const fieldsOfManyRelations = pickBy(fields, isRelationMany)

    const fieldsWithoutResolvers = [
        ...keys(fieldsOfSingleRelations).filter(key => !singleRelationshipDisplayNameResolvers[key]),
        ...keys(fieldsOfManyRelations).filter(key => !manyRelationshipDisplayNameResolvers[key]),
    ]
    if (fieldsWithoutResolvers.length > 0) {
        throw new ResolversValidationError(fieldsWithoutResolvers)
    }

    const mappedFieldsOfSingleRelationships = transform(
        fieldsOfSingleRelations,
        (acc, value, key) => mapRelationSingle(acc, value, key, keysOfLocalizedRelationSingleDisplayNameTextFields),
        {}
    )
    const mappedFieldsOfManyRelationships = transform(
        fieldsOfManyRelations, 
        mapRelationMany, 
        {}
    )

    return {
        ...scalars,
        ...mappedFieldsOfSingleRelationships,
        ...mappedFieldsOfManyRelationships,
    }
}

/**
 * Map of field names to functions, that obtains item name by its id.
 *
 * @example
 * const ticketChangeDisplayNameResolversForSingleRelations = {
 *   'property': async (itemId) => {
 *       const item = await getById('Property', itemId)
 *       return get(item, 'name')
 *   },
 *   'status': async (itemId) => {
 *       const item = await getById('TicketStatus', itemId)
 *       return get(item, 'name')
 *   },
 *
 * @typedef DisplayNameResolvers
 */


/**
 * Map of fields with many-to-many relations to functions,
 * that obtains ids and display names of previous and updated list of related items.
 *
 * @example
 * // Resolver for `watchers` field of a schema with type `Relationship` and `many: true` option.
 * const relatedManyToManyResolvers = {
 *     'watchers': async ({ context, existingItem, originalInput }) => {
 *          // Some logic, that finally returns following:
 *          return {
 *              existing: { ids, displayNames },
 *              updated: { ids, displayNames },
 *          }
 *      }
 * }
 *
 * @typedef RelatedManyToManyResolvers
 */

/**
 * Should be substituted into `afterChange` hook of a schema, whose changes
 * should be trackable.
 *
 * @param fields
 * @param createCallback
 * @param displayNameResolvers
 * @param relatedManyToManyResolvers
 * @param relatedFieldsList
 * @return function, compatible with Keystone `afterChange` hook
 */
const storeChangesIfUpdated = (
    fields,
    createCallback,
    displayNameResolvers,
    relatedManyToManyResolvers,
    relatedFieldsList = [{}],
) => async ({ operation, existingItem, context, originalInput, updatedItem }) => {
    if (operation === 'update') {
        const fieldsChanges = await buildDataToStoreChangeFrom({
            existingItem,
            updatedItem,
            context,
            originalInput,
            fields,
            displayNameResolvers,
            relatedManyToManyResolvers,
        })

        const fieldsChangesWithRelatedFields = await buildRelatedFields({
            existingItem,
            fieldsChanges,
            relatedFieldsList,
            displayNameResolvers,
        })

        if (keys(fieldsChanges).length > 0) {
            await createCallback(fieldsChangesWithRelatedFields, { existingItem, updatedItem, context })
        }
    }
}

/**
 * Arguments to `buildDataToStoreChangeFrom` function
 * @typedef {Object} BuildDataToStoreChangeFromArgs
 * @property existingItem - GQLListSchema item before update (Keystone)
 * @property updatedItem - GQLListSchema item after update (Keystone)
 * @property context – Apollo Context from Keystone
 * @property {Object} fields - GQLListSchema fields object, that will be used as a guide to examine changes
 * @property {Object} originalInput – from Keystone hook
 * @property {DisplayNameResolvers} displayNameResolvers
 * @property {RelatedManyToManyResolvers} relatedManyToManyResolvers
 */

/**
 * Build changes data object, that will be passed to entity, that stores changes.
 * Changes data object is build by comparing field-by-field `existingItem` and `updatedItem`
 * For each field will be produced "Changes set"
 * @param {BuildDataToStoreChangeFromArgs} args
 */
const buildDataToStoreChangeFrom = async (args) => {
    const {
        existingItem,
        updatedItem,
        context,
        originalInput,
        fields,
        displayNameResolvers,
        relatedManyToManyResolvers,
    } = args
    const data = {}
    // Since `map` uses a series of async function calls, we need to use `Promise.all`,
    // otherwise, final result will miss fields, calculated asynchronously.
    // https://stackoverflow.com/questions/47065444/lodash-is-it-possible-to-use-map-with-async-functions
    await Promise.all(keys(fields).map(async (key) => {
        const field = fields[key]
        if (isScalar(field)) {
            const convertedExistingValue = convertScalarValueToInput(existingItem[key])
            const convertedUpdatedValue = convertScalarValueToInput(updatedItem[key])

            if (!isEqual(convertedExistingValue, convertedUpdatedValue)) {
                data[`${ key }From`] = convertedExistingValue
                data[`${ key }To`] = convertScalarValueToInput(updatedItem[key])
            }
        } else if (isRelationSingle(field)) {
            if (existingItem[key] !== updatedItem[key]) {
                data[`${ key }IdFrom`] = existingItem[key]
                data[`${ key }IdTo`] = updatedItem[key]
                data[`${ key }DisplayNameFrom`] = await displayNameResolvers[key](existingItem[key])
                data[`${ key }DisplayNameTo`] = await displayNameResolvers[key](updatedItem[key])
            }
        } else if (isRelationMany(field)) {
            if (originalInput[key]) {
                // Since many-to-many relation is stored in different schema, there is no
                // direct information here about initial list of related items.
                // As an easy solution, we can utilize `originalInput`, that have
                // relation "Nested mutations", like `connect` and `disconnect`
                // https://www.keystonejs.com/keystonejs/fields/src/types/relationship/#nested-mutations
                const { existing, updated } = await relatedManyToManyResolvers[key]({
                    context,
                    existingItem,
                    originalInput,
                })
                if (xor(existing.ids, updated.ids).length > 0) {
                    data[`${ key }IdsFrom`] = existing.ids
                    data[`${ key }IdsTo`] = updated.ids
                    data[`${ key }DisplayNamesFrom`] = existing.displayNames
                    data[`${ key }DisplayNamesTo`] = updated.displayNames
                }

            }
        }
    }))
    return data
}

/**
 * In some cases we cannot just pass a value of existing item into input values set.
 * For example, a `Datetime` Keystone fields accepts `String`, but not a `Date`, as it comes
 * from a GraphQL query result.
 * @param value - value of Keystone instance field
 */
const convertScalarValueToInput = (value) => {
    if (value instanceof Date) {
        return value.toISOString()
    }
    return value
}

const isFieldChanged = (fieldsChanges, fieldKey) => (
    fieldsChanges[`${fieldKey}From`] !== fieldsChanges[`${fieldKey}To`] ||
    fieldsChanges[`${fieldKey}IdFrom`] !== fieldsChanges[`${fieldKey}IdTo`] ||
    fieldsChanges[`${fieldKey}DisplayNameFrom`] !== fieldsChanges[`${fieldKey}DisplayNameTo`] ||
    fieldsChanges[`${fieldKey}IdsFrom`] !== fieldsChanges[`${fieldKey}IdsTo`] ||
    fieldsChanges[`${fieldKey}DisplayNamesFrom`] !== fieldsChanges[`${fieldKey}DisplayNamesTo`]
)

const buildRelatedFields = async (args) => {
    const {
        existingItem,
        fieldsChanges,
        relatedFieldsList,
        displayNameResolvers,
    } = args
    const dataWithRelatedFields = { ...fieldsChanges }

    // If any of the related fields has changed, then all unchanged related fields must be put in the result data
    for (const relatedFields of relatedFieldsList) {
        const relatedFieldsKeys = keys(relatedFields)
        const changedFieldKeyInRelatedFields = relatedFieldsKeys.find(relatedFieldsKey => isFieldChanged(fieldsChanges, relatedFieldsKey))

        if (changedFieldKeyInRelatedFields) {
            const unchangedRelatedFieldKeys = relatedFieldsKeys.filter(relatedFieldsKey => !isFieldChanged(fieldsChanges, relatedFieldsKey))
            const unchangedRelatedFields = pick(relatedFields, [...unchangedRelatedFieldKeys])

            await Promise.all(unchangedRelatedFieldKeys.map(async (key) => {
                const field = unchangedRelatedFields[key]
                const existingField = existingItem[key]
                if (isScalar(field)) {
                    dataWithRelatedFields[`${key}From`] = existingField
                    dataWithRelatedFields[`${key}To`] = existingField
                } else if (isRelationSingle(field)) {
                    const existingFieldDisplayName = await displayNameResolvers[key](existingItem[key])
                    dataWithRelatedFields[`${key}IdFrom`] = existingField
                    dataWithRelatedFields[`${key}IdTo`] = existingField
                    dataWithRelatedFields[`${key}DisplayNameFrom`] = existingFieldDisplayName
                    dataWithRelatedFields[`${key}DisplayNameTo`] = existingFieldDisplayName
                }
            }))
        }
    }

    return dataWithRelatedFields
}

const isRelationField = (field) => get(field, 'type') === 'Relationship'
    || get(field, 'type.type') === 'Relationship'
    || get(field, 'type.isRelationship') === true

const isScalar = (field) => !isRelationField(field)

const isRelationSingle = (field) => isRelationField(field) && !field.many

const isRelationMany = (field) => isRelationField(field) && field.many

const mapScalars = (acc, value, key) => {
    acc[`${key}From`] = mapScalar(value)
    acc[`${key}To`] = mapScalar(value)
}

const mapScalar = (field) => (
    // Fields `options` and `dataType` needs for Keystone fields of type `Select`
    pick(field, ['schemaDoc', 'type', 'options', 'dataType', 'sensitive'])
)

/**
 * TODO(DOMA-3286): take field localization from it's schema
 */


/**
 * Produces "Change storage set" of fields (see Terms) for a single relationship field
 * Used in lodash `transform` function
 * @param {Object} acc - final set all fields, composed using lodash `transform` function
 * @param {Object} value - Keystone field declaration
 * @param {String} key - key of a field being iterated
 * @param {Map} keysOfLocalizedDisplayNameTextFields - map of field keys to localization template string like 'ticket.status.*.name
 */
const mapRelationSingle = (acc, value, key, keysOfLocalizedDisplayNameTextFields) => {
    if (!keysOfLocalizedDisplayNameTextFields) keysOfLocalizedDisplayNameTextFields = new Map()
    acc[`${key}IdFrom`] = {
        schemaDoc: `Old id of related entity. ${value.schemaDoc}`,
        type: 'Uuid',
    }
    acc[`${key}IdTo`] = {
        schemaDoc: `New id of related entity. ${value.schemaDoc}`,
        type: 'Uuid',
    }
    acc[`${key}DisplayNameFrom`] = {
        schemaDoc: `Old display name of related entity. ${value.schemaDoc}`,
        type: keysOfLocalizedDisplayNameTextFields.has(key) ? 'LocalizedText' : 'Text',
        ...(keysOfLocalizedDisplayNameTextFields.has(key) ? { template: keysOfLocalizedDisplayNameTextFields.get(key) } : {}),
    }
    acc[`${key}DisplayNameTo`] = {
        schemaDoc: `New display name of related entity. ${value.schemaDoc}`,
        type: keysOfLocalizedDisplayNameTextFields.has(key) ? 'LocalizedText' : 'Text',
        ...(keysOfLocalizedDisplayNameTextFields.has(key) ? { template: keysOfLocalizedDisplayNameTextFields.get(key) } : {}),
    }
}

/**
 * Produces "Change storage set" of fields (see Terms) for a "many" relationship field
 * Used in lodash `transform` function
 * @param {Object} acc - final set all fields, composed using lodash `transform` function
 * @param {Object} value - Keystone field declaration
 * @param {String} key - key of a field being iterated
 */
const mapRelationMany = (acc, value, key) => {
    acc[`${key}IdsFrom`] = {
        schemaDoc: `Old list of ids of related entities. ${value.schemaDoc}`,
        type: 'Json',
        defaultValue: [],
    }
    acc[`${key}IdsTo`] = {
        schemaDoc: `New list of ids of related entities. ${value.schemaDoc}`,
        type: 'Json',
        defaultValue: [],
    }
    acc[`${key}DisplayNamesFrom`] = {
        schemaDoc: `Old version of display names of related entities. ${value.schemaDoc}`,
        type: 'Json',
        defaultValue: [],
    }
    acc[`${key}DisplayNamesTo`] = {
        schemaDoc: `New version of display names of related entities. ${value.schemaDoc}`,
        type: 'Json',
        defaultValue: [],
    }
}

module.exports = {
    buildSetOfFieldsToTrackFrom,
    storeChangesIfUpdated,
    generateChangeTrackableFieldsFrom,
    ResolversValidationError,
}