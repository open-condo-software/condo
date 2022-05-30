import { convertToGQLInput } from './Division'

const faker = require('faker')

describe('convertToGQLInput', () => {
    it('adds `dv` and `fingerprint` fields', () => {
        const input = convertToGQLInput({})
        expect(input.dv).toBeDefined()
        expect(input.sender.dv).toBeDefined()
        expect(input.sender.fingerprint).toBeDefined()
    })

    describe('create input', () => {
        describe('single-relationship', () => {
            it('connects id of object, presented in form values', () => {
                const formValues = {
                    responsible: faker.datatype.uuid(),
                }
                const input = convertToGQLInput(formValues)
                expect(input).toMatchObject({
                    responsible: {
                        connect: { id: formValues.responsible },
                    },
                })
            })
        })

        describe('many-relationship', () => {
            it('connects ids of objects, presented in form values', () => {
                const formValues = {
                    properties: [
                        faker.datatype.uuid(),
                        faker.datatype.uuid(),
                    ],
                }
                const input = convertToGQLInput(formValues)
                expect(input).toMatchObject({
                    properties: {
                        connect: [
                            { id: formValues.properties[0] },
                            { id: formValues.properties[1] },
                        ],
                    },
                })
            })

            it('does not includes field for empty ids array in form values', () => {
                const formValues = {
                    executors: [],
                }
                const input = convertToGQLInput(formValues)
                expect(input.executors).toBeUndefined()
            })
        })

        test('all together', async () => {
            const formValues = {
                name: faker.lorem.word(),
                responsible: faker.datatype.uuid(),
                executors: [],
                properties: [
                    faker.datatype.uuid(),
                    faker.datatype.uuid(),
                ],
            }
            const input = convertToGQLInput(formValues)
            expect(input).toMatchObject({
                name: formValues.name,
                responsible: {
                    connect: { id: formValues.responsible },
                },
                properties: {
                    connect: [
                        { id: formValues.properties[0] },
                        { id: formValues.properties[1] },
                    ],
                },
            })
            expect(input.executors).toBeUndefined()
        })
    })

    describe('update', () => {
        describe('single-relationship', () => {
            it('connects id of another object', async () => {
                const someObligatoryFields = {
                    id:  faker.datatype.uuid(),
                    name: faker.lorem.word(),
                    properties: [],
                    executors: [],
                }
                const existingObj = {
                    ...someObligatoryFields,
                    responsible: faker.datatype.uuid(),
                }
                const formValues = {
                    responsible: faker.datatype.uuid(),
                }
                const input = convertToGQLInput(formValues, existingObj)
                expect(input).toMatchObject({
                    responsible: {
                        connect: { id: formValues.responsible },
                    },
                })
            })

            it('adds `disconnectAll` field if no id of object is specified', async () => {
                const someObligatoryFields = {
                    id:  faker.datatype.uuid(),
                    name: faker.lorem.word(),
                    properties: [],
                    executors: [],
                }
                const existingObj = {
                    ...someObligatoryFields,
                    responsible: faker.datatype.uuid(),
                }
                const formValues = {
                    responsible: null,
                }
                const input = convertToGQLInput(formValues, existingObj)
                expect(input).toMatchObject({
                    responsible: {
                        disconnectAll: true,
                    },
                })
            })
        })

        describe('many-relationship', () => {
            it('connects ids, presented in form values but missing in existing object', () => {
                const someObligatoryFields = {
                    id:  faker.datatype.uuid(),
                    name: faker.lorem.word(),
                    responsible: faker.datatype.uuid(),
                    executors: [],
                }
                const existingObj = {
                    ...someObligatoryFields,
                    properties: [
                        { id: faker.datatype.uuid() },
                        { id: faker.datatype.uuid() },
                    ],
                }
                const formValues = {
                    properties: [
                        existingObj.properties[0].id,
                        existingObj.properties[1].id,
                        faker.datatype.uuid(),
                    ],
                }
                const input = convertToGQLInput(formValues, existingObj)
                expect(input).toMatchObject({
                    properties: {
                        connect: [
                            { id: formValues.properties[2] },
                        ],
                    },
                })
                expect(input.properties.disconnect).toBeUndefined()
            })

            it('disconnects ids, missing in form values but presented in existing object', () => {
                const someObligatoryFields = {
                    id:  faker.datatype.uuid(),
                    name: faker.lorem.word(),
                    responsible: faker.datatype.uuid(),
                    executors: [],
                }
                const existingObj = {
                    ...someObligatoryFields,
                    properties: [
                        { id: faker.datatype.uuid() },
                        { id: faker.datatype.uuid() },
                    ],
                }
                const formValues = {
                    name: faker.lorem.word(),
                    responsible: faker.datatype.uuid(),
                    properties: [],
                }
                const input = convertToGQLInput(formValues, existingObj)
                expect(input).toMatchObject({
                    properties: {
                        disconnect: [
                            { id: existingObj.properties[0].id },
                            { id: existingObj.properties[1].id },
                        ],
                    },
                })
                expect(input.properties.connect).toBeUndefined()
            })
        })

        test('all together', () => {
            const existingObj = {
                id:  faker.datatype.uuid(),
                name: faker.lorem.word(),
                responsible: faker.datatype.uuid(),
                executors: [],
                properties: [
                    { id: faker.datatype.uuid() },
                    { id: faker.datatype.uuid() },
                ],
            }
            const formValues = {
                name: faker.lorem.word(),
                responsible: faker.datatype.uuid(),
                properties: [
                    existingObj.properties[1].id,
                    faker.datatype.uuid(),
                    faker.datatype.uuid(),
                ],
            }
            const input = convertToGQLInput(formValues, existingObj)
            expect(input).toMatchObject({
                name: formValues.name,
                properties: {
                    connect: [
                        { id: formValues.properties[1] },
                        { id: formValues.properties[2] },
                    ],
                    disconnect: [
                        { id: existingObj.properties[0].id },
                    ],
                },
            })
        })
    })
})