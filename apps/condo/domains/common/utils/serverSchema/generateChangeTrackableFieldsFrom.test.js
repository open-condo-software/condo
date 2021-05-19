const { generateChangeTrackableFieldsFrom } = require('./generateChangeTrackableFieldsFrom')
const { GQLListSchema } = require('@core/keystone/schema')
const { Text, Relationship } = require('@keystonejs/fields')
const { Json } = require('@core/keystone/fields')

const House = new GQLListSchema('House', {
    schemaDoc: 'Sample house, where a person will live',
    fields: {
        name: {
            schemaDoc: 'Name of a house',
            type: Text,
        },
        address: {
            schemaDoc: 'Where this house is located',
            type: Text,
            isRequired: true,
        },
    },
    access: {
        read: true,
        create: true,
        update: true,
        delete: false,
        auth: true,
    },
})

const Person = new GQLListSchema('Ticket', {
    schemaDoc: 'Sample person',
    fields: {
        name: {
            schemaDoc: 'Name of a person',
            type: Text,
            isRequired: true,
            defaultValue: 0,
            access: {
                read: true,
                update: false,
                create: false,
            },
        },
        homes: {
            schemaDoc: 'Where a person lives',
            type: Relationship,
            ref: 'House',
            many: true,
        },
    },
    access: {
        read: true,
        create: true,
        update: true,
        delete: false,
        auth: true,
    },
})

describe('generateChangeTrackableFieldsFrom', () => {
    it('generates fields for scalars', () => {
        const fields = generateChangeTrackableFieldsFrom(House.schema)

        expect(fields).toMatchObject({
            nameFrom: {
                schemaDoc: 'Name of a house',
                type: Text,
            },
            nameTo: {
                schemaDoc: 'Name of a house',
                type: Text,
            },
            addressFrom: {
                schemaDoc: 'Where this house is located',
                type: Text,
            },
            addressTo: {
                schemaDoc: 'Where this house is located',
                type: Text,
            },
        })
    })

    it('generates fields for relations', () => {
        const fields = generateChangeTrackableFieldsFrom(Person.schema)

        expect(fields).toMatchObject({
            nameFrom: {
                schemaDoc: 'Name of a person',
                type: Text,
            },
            nameTo: {
                schemaDoc: 'Name of a person',
                type: Text,
            },
            homesIdsFrom: {
                schemaDoc: 'Old list of ids of related entities. Where a person lives',
                type: Json,
                defaultValue: [],
            },
            homesIdsTo: {
                schemaDoc: 'New list of ids of related entities. Where a person lives',
                type: Json,
                defaultValue: [],
            },
            homesDisplayNamesFrom: {
                schemaDoc: 'Old version of display names of related entities. Where a person lives',
                type: Json,
                defaultValue: [],
            },
            homesDisplayNamesTo: {
                schemaDoc: 'New version of display names of related entities. Where a person lives',
                type: Json,
                defaultValue: [],
            },
        })
    })
})