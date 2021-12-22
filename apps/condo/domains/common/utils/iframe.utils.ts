import get from 'lodash/get'

const Ajv = require('ajv')
const ajv = new Ajv()

export const NOTIFICATION_MESSAGE_TYPE = 'notification'
export const REQUIREMENT_MESSAGE_TYPE = 'requirement'
export const LOADED_STATUS_MESSAGE_TYPE = 'loading'
export const ERROR_MESSAGE_TYPE = 'error'

export type NotificationType = 'info' | 'warning' | 'error' | 'success'
export type RequirementType = 'auth' | 'organization'
export type LoadingStatuses = 'done'

type NotificationMessageType = {
    type: 'notification',
    notificationType: NotificationType,
    message: string,
}

type RequirementMessageType = {
    type: 'requirement'
    requirement: RequirementType,
}

type LoadedStatusMessageType = {
    type: 'loading',
    status: LoadingStatuses,
}

type ErrorMessageType = {
    type: 'error',
    message: string,
    requestMessage?: Record<string, unknown>,
}

type ParsedMessageType = {
    message?: RequirementMessageType | NotificationMessageType | LoadedStatusMessageType | ErrorMessageType,
    errors?: Array<string>,
}

type parseMessageType = (data: any) => ParsedMessageType

const AvailableMessageTypes = [
    NOTIFICATION_MESSAGE_TYPE,
    REQUIREMENT_MESSAGE_TYPE,
    LOADED_STATUS_MESSAGE_TYPE,
    ERROR_MESSAGE_TYPE,
]

const MessagesRequiredProperties = {
    [NOTIFICATION_MESSAGE_TYPE]: ['notificationType', 'message'],
    [REQUIREMENT_MESSAGE_TYPE]: ['requirement'],
    [LOADED_STATUS_MESSAGE_TYPE]: ['status'],
    [ERROR_MESSAGE_TYPE]: ['message'],
}

const MessageSchema = {
    type: 'object',
    properties: {
        type: { enum: AvailableMessageTypes },
        notificationType: { enum: ['info', 'warning', 'error', 'success'] },
        message: { type: 'string' },
        requirement: { enum: ['auth', 'organization'] },
        status: { const: 'done' },
        requestMessage: {  type: 'object' },
    },
    additionalProperties: false,
    required: ['type'],
    allOf: Object.keys(MessagesRequiredProperties).map(messageType => ({
        anyOf: [
            { not: { properties: { type: { const: messageType } } } },
            { required: MessagesRequiredProperties[messageType] },
        ],
    })),
}

const validator = ajv.compile(MessageSchema)

export const parseMessage: parseMessageType = (data) => {
    if (!validator(data)) {
        return { errors: validator.errors.map(error => `JSON validation error. SchemaPath ${error.schemaPath}, message: ${error.message}`) }
    }
    if (data.type === NOTIFICATION_MESSAGE_TYPE) {
        return {
            message: {
                type: NOTIFICATION_MESSAGE_TYPE,
                notificationType: data.notificationType,
                message: data.message,
            },
        }
    }
    if (data.type === REQUIREMENT_MESSAGE_TYPE) {
        return {
            message: {
                type: REQUIREMENT_MESSAGE_TYPE,
                requirement: data.requirement,
            },
        }
    }
    if (data.type === LOADED_STATUS_MESSAGE_TYPE) {
        return {
            message: {
                type: LOADED_STATUS_MESSAGE_TYPE,
                status: data.status,
            },
        }
    }
    if (data.type === ERROR_MESSAGE_TYPE) {
        return {
            message: {
                type: ERROR_MESSAGE_TYPE,
                message: data.message,
                requestMessage: get(data, 'requestMessage'),
            },
        }
    }
    return { errors: ['UNKNOWN MESSAGE TYPE'] }
}