import {
    parseMessage,
    NOTIFICATION_MESSAGE_TYPE,
    REQUIREMENT_MESSAGE_TYPE,
    LOADED_STATUS_MESSAGE_TYPE,
    ERROR_MESSAGE_TYPE,
    RESIZE_MESSAGE_TYPE,
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
            ['Invalid notification type', { type: NOTIFICATION_MESSAGE_TYPE, notificationType: 'importantInformation', message: 'Hello, world!' }],
            ['No notification message', { type: NOTIFICATION_MESSAGE_TYPE, notificationType: 'warning' }],
            ['No notification type', { type: NOTIFICATION_MESSAGE_TYPE, message: 'Hello, world!' }],
            ['Invalid requirement', { type: REQUIREMENT_MESSAGE_TYPE, requirement: 'cup of tea' }],
            ['Invalid loading status', { type: LOADED_STATUS_MESSAGE_TYPE, status: 'undone' }],
            ['No loading status', { type: LOADED_STATUS_MESSAGE_TYPE }],
            ['Height is not number', { type: RESIZE_MESSAGE_TYPE, height: '1230123' }],
            ['No height', { type: RESIZE_MESSAGE_TYPE, height: '1230123' }],
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