const _ = require('lodash')
const { Relationship } = require('@keystonejs/fields')
const { Json } = require('@core/keystone/fields')

/**
 * Options for fields generator
 * @typedef {Object} Options
 * @property {string[]} except - Fields, that should not take part of change tracking. Will not be presented in generated
 * @property {boolean} hasPower - Indicates whether the Power component is present.
 * @property {boolean} hasWisdom - Indicates whether the Wisdom component is present.
 */

/**
 * Generates modified versions of fields from provided schema, capable to store changes.
 * For each scalar field, a pair `…From`, `…To`, will be generated, where `…` – is original field name.
 * For each `Relationship` field, four fields will be generated:
 *  - `…IdsFrom` – old list of ids of related entities;
 *  - `…IdsTo` – new list of ids of related entities;
 *  - `…DisplayNamesFrom` – old list of display names of related entities;
 *  - `…DisplayNamesTo` – new list of display names of related entities.
 * Display name is a string representation of related entity for display in UI.
 *
 * @example
 *
 * // Schema for tracking changes of `Ticket`
 * const TicketChange = new GQLListSchema('TicketChange', {
 *      fields: {
 *          ...generateChangeTrackableFieldsFrom(Ticket.schema)
 *      }
 * })
 *
 * @param {GQLListSchema} schema
 * @param options {except: string[]}
 */
function generateChangeTrackableFieldsFrom (schema, options = {}) {
    const fields = _.omit(schema.fields, options.except || [])
    const scalars = _.transform(_.pickBy(fields, byScalars), mapScalars, {})
    const relations = _.transform(_.pickBy(fields, byRelations), mapRelations, {})
    return {
        ...scalars,
        ...relations,
    }
}

const byScalars = (field) => (
    field.type !== Relationship
)

const byRelations = (field) => (
    field.type === Relationship && field.many === true
)

const mapScalars = (acc, value, key) => {
    acc[`${key}From`] = mapScalar(value)
    acc[`${key}To`] = mapScalar(value)
}

const mapScalar = (field) => (
    _.pick(field, ['schemaDoc', 'type'])
)

const mapRelations = (acc, value, key) => {
    acc[`${key}IdsFrom`] = {
        schemaDoc: `Old list of ids of related entities. ${value.schemaDoc}`,
        type: Json,
        defaultValue: [],
    }
    acc[`${key}IdsTo`] = {
        schemaDoc: `New list of ids of related entities. ${value.schemaDoc}`,
        type: Json,
        defaultValue: [],
    }
    acc[`${key}DisplayNamesFrom`] = {
        schemaDoc: `Old version of display names of related entities. ${value.schemaDoc}`,
        type: Json,
        defaultValue: [],
    }
    acc[`${key}DisplayNamesTo`] = {
        schemaDoc: `New version of display names of related entities. ${value.schemaDoc}`,
        type: Json,
        defaultValue: [],
    }
}

module.exports = {
    generateChangeTrackableFieldsFrom,
}