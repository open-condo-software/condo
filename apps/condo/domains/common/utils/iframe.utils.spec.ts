import faker from 'faker'
import {
    parseMessage,
    TASK_MESSAGE_TYPE,
    NOTIFICATION_MESSAGE_TYPE,
    REQUIREMENT_MESSAGE_TYPE,
    LOADED_STATUS_MESSAGE_TYPE,
    ERROR_MESSAGE_TYPE,
    RESIZE_MESSAGE_TYPE,
    REDIRECT_MESSAGE_TYPE,
    IFRAME_MODAL_ACTION_MESSAGE_TYPE,
} from './iframe.utils'

describe('parseMessage', () => {
    describe('Should parse valid system messages', () => {
        const validCases: Array<any> = [
            ['Info notification', { type: NOTIFICATION_MESSAGE_TYPE, notificationType: 'info', message: 'Hello, world!' }],
            ['Warning notification', { type: NOTIFICATION_MESSAGE_TYPE, notificationType: 'warning', message: 'Hello, world!' }],
            ['Success notification', { type: NOTIFICATION_MESSAGE_TYPE, notificationType: 'success', message: 'Hello, world!' }],
            ['Error notification', { type: NOTIFICATION_MESSAGE_TYPE, notificationType: 'error', message: 'Hello, world!' }],
            ['Auth requirement', { type: REQUIREMENT_MESSAGE_TYPE, requirement: 'auth' }],
            ['Organization requirement', { type: REQUIREMENT_MESSAGE_TYPE, requirement: 'organization' }],
            ['Loading message', { type: LOADED_STATUS_MESSAGE_TYPE, status: 'done' }],
            ['Error message', { type: ERROR_MESSAGE_TYPE, message: 'Validation failure error' }],
            ['Error message', { type: ERROR_MESSAGE_TYPE, message: 'Validation failure error', requestMessage: { type: 'IMPORTANT', requirement: 'auth' } }],
            ['Size message', { type: RESIZE_MESSAGE_TYPE, height: 500 }],
            ['Redirect message', { type: REDIRECT_MESSAGE_TYPE, url: '/path' }],
            ['Open modal message', { type: IFRAME_MODAL_ACTION_MESSAGE_TYPE, action: 'open', url: 'https://github.com' }],
            ['Close modal message', { type: IFRAME_MODAL_ACTION_MESSAGE_TYPE, action: 'close', modalId: '123' }],
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
    describe('Should fulfil defaults for optional parameters',  () => {
        test('Open modal: closable', () => {
            expect(parseMessage({ type: IFRAME_MODAL_ACTION_MESSAGE_TYPE, action: 'open', url: 'https://github.com' }))
                .toHaveProperty(['message', 'closable'], true)
            expect(parseMessage({ type: IFRAME_MODAL_ACTION_MESSAGE_TYPE, action: 'open', url: 'https://github.com', closable: true }))
                .toHaveProperty(['message', 'closable'], true)
            expect(parseMessage({ type: IFRAME_MODAL_ACTION_MESSAGE_TYPE, action: 'open', url: 'https://github.com', closable: false }))
                .toHaveProperty(['message', 'closable'], false)
        })
    })
    describe('Should not parse invalid system messages', () => {
        const invalidCases: Array<any> = [
            ['Invalid notification type', { type: NOTIFICATION_MESSAGE_TYPE, notificationType: 'importantInformation', message: 'Hello, world!' }],
            ['No notification message', { type: NOTIFICATION_MESSAGE_TYPE, notificationType: 'warning' }],
            ['No notification type', { type: NOTIFICATION_MESSAGE_TYPE, message: 'Hello, world!' }],
            ['Invalid requirement', { type: REQUIREMENT_MESSAGE_TYPE, requirement: 'cup of tea' }],
            ['Invalid loading status', { type: LOADED_STATUS_MESSAGE_TYPE, status: 'undone' }],
            ['No loading status', { type: LOADED_STATUS_MESSAGE_TYPE }],
            ['Height is not number', { type: RESIZE_MESSAGE_TYPE, height: '1230123' }],
            ['No height', { type: RESIZE_MESSAGE_TYPE }],
            ['Open modal message without url', { type: IFRAME_MODAL_ACTION_MESSAGE_TYPE, action: 'open' }],
            ['Close modal message without modalId', { type: IFRAME_MODAL_ACTION_MESSAGE_TYPE, action: 'close' }],
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
