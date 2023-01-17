import faker from 'faker'
import {
    parseMessage,
    TASK_MESSAGE_TYPE,
    RESIZE_MESSAGE_TYPE,
} from './iframe.utils'

describe('parseMessage', () => {
    describe('Should parse valid system messages', () => {
        const validCases: Array<any> = [
            ['Size message', { type: RESIZE_MESSAGE_TYPE, height: 500 }],
            ['Create task progress', { type: TASK_MESSAGE_TYPE, taskId: faker.datatype.uuid(), taskTitle: faker.datatype.string(), taskDescription: faker.datatype.string(), taskProgress: 50, taskStatus: 'processing', taskOperation: 'create' }],
            ['Update task progress', { type: TASK_MESSAGE_TYPE, id: faker.datatype.uuid(), taskId: faker.datatype.uuid(), taskTitle: faker.datatype.string(), taskDescription: faker.datatype.string(), taskProgress: 50, taskStatus: 'processing', taskOperation: 'update' }],
            ['Get task progress', { type: TASK_MESSAGE_TYPE, taskOperation: 'get' }],

        ]
        test.each(validCases)('%p', (message, payload) => {
            const result = parseMessage(payload)
            expect(result).toBeDefined()
            expect(result).toHaveProperty('type', 'system')
            expect(result).toHaveProperty('message', expect.objectContaining(payload))
        })
    })
    describe('Should not parse invalid system messages', () => {
        const invalidCases: Array<any> = [
            ['Height is not number', { type: RESIZE_MESSAGE_TYPE, height: '1230123' }],
            ['No height', { type: RESIZE_MESSAGE_TYPE }],
            ['Invalid task status type', { type: TASK_MESSAGE_TYPE, taskId: faker.datatype.uuid(), taskTitle: faker.datatype.string(), taskDescription: faker.datatype.string(), taskProgress: 50, taskStatus: 'processing', taskOperation: 'delete' }],
            ['Invalid task status', { type: TASK_MESSAGE_TYPE, taskId: faker.datatype.uuid(), taskTitle: faker.datatype.string(), taskDescription: faker.datatype.string(), taskProgress: 50, taskStatus: 'pending', taskOperation: 'create' }],
            ['Invalid taskOperation', { type: TASK_MESSAGE_TYPE, taskId: faker.datatype.uuid(), taskTitle: faker.datatype.string(), taskDescription: faker.datatype.string(), taskProgress: 50, taskStatus: 'processing', taskOperation: 'delete' }],
            ['No id at task update action', { type: TASK_MESSAGE_TYPE, taskId: faker.datatype.uuid(), taskTitle: faker.datatype.string(), taskDescription: faker.datatype.string(), taskProgress: 50, taskStatus: 'processing', taskOperation: 'update' }],
        ]
        test.each(invalidCases)('%p', (message, payload) => {
            const result = parseMessage(payload)
            expect(result).toBeNull()
        })
    })
    describe('Should bypass custom messages', () => {
        const customCases: Array<any> = [
            ['1', { type: 'MyType', parameter: 1, a: 123.5 }],
            ['2', { message: 'June Farber' }],
        ]
        test.each(customCases)('%p', (message, payload) => {
            const result = parseMessage(payload)
            expect(result).toBeDefined()
            expect(result).toHaveProperty('type', 'custom')
            expect(result).toHaveProperty('message', expect.objectContaining(payload))
        })
    })
    describe('Should not parse falsy values and non-objects', () => {
        const cases: Array<any> = [
            ['Null', null],
            ['Undefined', undefined],
            ['Number', 123],
            ['String', '123'],
            ['Array', [1, 2]],
        ]
        test.each(cases)('%p', (message, payload) => {
            expect(parseMessage(payload)).toBeNull()
        })
    })
})
