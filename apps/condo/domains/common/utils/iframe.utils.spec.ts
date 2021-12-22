import {
    parseMessage,
    NOTIFICATION_MESSAGE_TYPE,
    REQUIREMENT_MESSAGE_TYPE,
    LOADED_STATUS_MESSAGE_TYPE,
    ERROR_MESSAGE_TYPE,
} from './iframe.utils'

describe('parseMessage', () => {
    const validCases: Array<any> = [
        ['Info notification', { type: NOTIFICATION_MESSAGE_TYPE, notificationType: 'info', message: 'Hello, world!' }],
        ['Warning notification', { type: NOTIFICATION_MESSAGE_TYPE, notificationType: 'warning', message: 'Hello, world!' }],
        ['Success notification', { type: NOTIFICATION_MESSAGE_TYPE, notificationType: 'success', message: 'Hello, world!' }],
        ['Error notification', { type: NOTIFICATION_MESSAGE_TYPE, notificationType: 'error', message: 'Hello, world!' }],
        ['Auth requirement', { type: REQUIREMENT_MESSAGE_TYPE, requirement: 'auth' }],
        ['Organization requirement', { type: REQUIREMENT_MESSAGE_TYPE, requirement: 'organization' }],
        ['Loading message', { type: LOADED_STATUS_MESSAGE_TYPE, status: 'done' }],
        ['Error message', { type: ERROR_MESSAGE_TYPE, message: 'Validation failure error' }],
    ]
    const invalidCases: Array<any> = [
        ['Invalid notification type', { type: NOTIFICATION_MESSAGE_TYPE, notificationType: 'importantInformation', message: 'Hello, world!' }],
        ['No message', { type: NOTIFICATION_MESSAGE_TYPE, notificationType: 'warning' }],
        ['No type', { type: NOTIFICATION_MESSAGE_TYPE, message: 'Hello, world!' }],
        ['Invalid requirement', { type: REQUIREMENT_MESSAGE_TYPE, requirement: 'cup of tea' }],
        ['Invalid type', { type: 'IMPORTANT', requirement: 'auth' }],
    ]
    test.each(validCases)('Valid: %p', (message, payload) => {
        const result = parseMessage(payload)
        expect(result).toBeDefined()
        expect(result).toHaveProperty('message', expect.objectContaining(payload))
        expect(result).not.toHaveProperty('errors')
    })
    test.each(invalidCases)('Invalid: %p', (message, payload) => {
        const result = parseMessage(payload)
        expect(result).toBeDefined()
        expect(result).not.toHaveProperty('message')
        expect(result).toHaveProperty('errors')
        expect(result.errors).not.toHaveLength(0)
    })
})