const Ajv = require('ajv')
const ajv = new Ajv()

export const NOTIFICATION_MESSAGE_TYPE = 'notification'
export const REQUIREMENT_MESSAGE_TYPE = 'requirement'
export const LOADED_STATUS_MESSAGE_TYPE = 'loading'

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

type ParsedMessageType = {
    message?: RequirementMessageType | NotificationMessageType | LoadedStatusMessageType,
    errors?: Array<string>,
}

type parseMessageType = (data: any) => ParsedMessageType

const MessageSchema = {
    type: 'object',
    properties: {
        type: { enum: [NOTIFICATION_MESSAGE_TYPE, REQUIREMENT_MESSAGE_TYPE, LOADED_STATUS_MESSAGE_TYPE] },
        notificationType: { enum: ['info', 'warning', 'error', 'success'] },
        message: { type: 'string' },
        requirement: { enum: ['auth', 'organization'] },
        status: { const: 'done' },
    },
    additionalProperties: false,
    required: ['type'],
    allOf: [
        {
            anyOf: [
                {
                    not: {
                        properties: { type: { const: NOTIFICATION_MESSAGE_TYPE } },
                    },
                },
                { required: ['notificationType', 'message'] },
            ],
        },
        {
            anyOf: [
                {
                    not: {
                        properties: { type: { const: REQUIREMENT_MESSAGE_TYPE } },
                    },
                },
                { required: ['requirement'] },
            ],
        },
        {
            anyOf: [
                {
                    not: {
                        properties: { type: { const: LOADED_STATUS_MESSAGE_TYPE } },
                    },
                },
                { required: ['status'] },
            ],
        },
    ],
}

const validator = ajv.compile(MessageSchema)

export const parseMessage: parseMessageType = (data) => {
    if (!validator(data)) {
        return { errors: validator.errors.map(error => error.message) }
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
    return { errors: ['UNKNOWN MESSAGE TYPE'] }
}