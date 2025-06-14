const { GQLListSchema } = require('@open-condo/keystone/schema')
const { catchErrorFrom } = require('@open-condo/keystone/test.utils')

const { generateChangeTrackableFieldsFrom, ResolversValidationError } = require('./changeTrackable')

const House = new GQLListSchema('House', {
    schemaDoc: 'Sample house, where a person will live',
    fields: {
        name: {
            schemaDoc: 'Name of a house',
            type: 'Text',
        },
        address: {
            schemaDoc: 'Where this house is located',
            type: 'Text',
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

const Person = new GQLListSchema('Person', {
    schemaDoc: 'Sample person',
    fields: {
        name: {
            schemaDoc: 'Name of a person',
            type: 'Text',
            isRequired: true,
            defaultValue: 0,
            access: {
                read: true,
                update: false,
                create: false,
            },
        },
        currentHome: {
            schemaDoc: 'Where a person currently located',
            type: 'Relationship',
            ref: 'House',
            many: false,
        },
        homes: {
            schemaDoc: 'Where a person lives',
            type: 'Relationship',
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

const personDisplayNameSingleRelationshipResolvers = {
    currentHome: () => 'stub',
}

const personDisplayNameManyRelationshipResolvers = {
    homes: () => 'stub',
}

describe('changeTrackable', () => {
    describe('generateChangeTrackableFieldsFrom', () => {
        describe('fields generation', () => {
            it('generates fields for scalars', () => {
                const fields = generateChangeTrackableFieldsFrom(
                    House.schema.fields,
                    personDisplayNameSingleRelationshipResolvers,
                    personDisplayNameManyRelationshipResolvers
                )

                expect(fields).toMatchObject({
                    nameFrom: {
                        schemaDoc: 'Name of a house',
                        type: 'Text',
                    },
                    nameTo: {
                        schemaDoc: 'Name of a house',
                        type: 'Text',
                    },
                    addressFrom: {
                        schemaDoc: 'Where this house is located',
                        type: 'Text',
                    },
                    addressTo: {
                        schemaDoc: 'Where this house is located',
                        type: 'Text',
                    },
                })
            })

            it('generates fields for relations', () => {
                const fields = generateChangeTrackableFieldsFrom(
                    Person.schema.fields,
                    personDisplayNameSingleRelationshipResolvers,
                    personDisplayNameManyRelationshipResolvers,
                    new Map([
                        ['currentHome', 'house.name'],
                    ])
                )

                expect(fields).toMatchObject({
                    nameFrom: {
                        schemaDoc: 'Name of a person',
                        type: 'Text',
                    },
                    nameTo: {
                        schemaDoc: 'Name of a person',
                        type: 'Text',
                    },
                    currentHomeIdFrom: {
                        schemaDoc: 'Old id of related entity. Where a person currently located',
                        type: 'Uuid',
                    },
                    currentHomeIdTo: {
                        schemaDoc: 'New id of related entity. Where a person currently located',
                        type: 'Uuid',
                    },
                    currentHomeDisplayNameFrom: {
                        schemaDoc: 'Old display name of related entity. Where a person currently located',
                        type: 'LocalizedText',
                        template: 'house.name',
                    },
                    currentHomeDisplayNameTo: {
                        schemaDoc: 'New display name of related entity. Where a person currently located',
                        type: 'LocalizedText',
                        template: 'house.name',
                    },
                    homesIdsFrom: {
                        schemaDoc: 'Old list of ids of related entities. Where a person lives',
                        type: 'Json',
                        defaultValue: [],
                    },
                    homesIdsTo: {
                        schemaDoc: 'New list of ids of related entities. Where a person lives',
                        type: 'Json',
                        defaultValue: [],
                    },
                    homesDisplayNamesFrom: {
                        schemaDoc: 'Old version of display names of related entities. Where a person lives',
                        type: 'Json',
                        defaultValue: [],
                    },
                    homesDisplayNamesTo: {
                        schemaDoc: 'New version of display names of related entities. Where a person lives',
                        type: 'Json',
                        defaultValue: [],
                    },
                })
            })
        })

        describe('resolvers validation', () => {
            it('throws error when display name resolvers is missing for some single-relationship fields', async () => {
                await catchErrorFrom(async () => {
                    generateChangeTrackableFieldsFrom(
                        Person.schema.fields,
                        {},
                        {}
                    )
                }, (error) => {
                    expect(error instanceof ResolversValidationError).toBe(true)
                    expect(error).toMatchObject({
                        message: 'Missing display name resolvers for some fields',
                        fields: ['currentHome', 'homes'],
                    })
                })
            })
        })
    })
})