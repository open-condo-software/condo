const { Text, CalendarDay, Checkbox, Relationship } = require('@keystonejs/fields')
const { GQLListSchema } = require('@core/keystone/schema')

const { Stars } = require('../custom-fields')

module.exports = new GQLListSchema('Todo', {
    fields: {
        // existing fields
        description: {
            factory: () => 'fake description',
            type: Text,
            isRequired: true,
        },
        isComplete: {
            factory: () => false,
            type: Checkbox,
            defaultValue: false,
        },
        // added fields
        deadline: {
            factory: () => new Date(),
            type: CalendarDay,
            format: 'Do MMMM YYYY',
            yearRangeFrom: '2010',
            yearRangeTo: '2039',
            isRequired: false,
            defaultValue: new Date().toISOString('YYYY-MM-DD').substring(0, 10),
        },
        assignee: { type: Relationship, ref: 'User', isRequired: true },
        stars: { type: Stars, starCount: 5 },
    },
    access: {
        read: true,
        create: true,
        update: true,
        delete: true,
        auth: true,
    },
})
