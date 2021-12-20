const Ajv = require('ajv')
const ajv = new Ajv()

export const NOTIFICATION_TYPE = 'notification'
export const REQUIREMENT_TYPE = 'requirement'

type NotificationType = {
    type: 'notification',
    notificationType: 'info' | 'warning' | 'error',
    message: string,
}

type RequirementType = {
    type: 'requirement'
    requirement: 'auth' | 'organization',
}

type ParsedMessageType = {
    message?: RequirementType | NotificationType,
    errors?: Array<string>,
}

type parseMessageType = (data: any) => ParsedMessageType

const MessageSchema = {
    type: 'object',
    properties: {
        type: { enum: [NOTIFICATION_TYPE, REQUIREMENT_TYPE] },
        notificationType: { enum: ['info', 'warning', 'error'] },
        message: { type: 'string' },
        requirement: { enum: ['auth', 'organization'] },
    },
    additionalProperties: false,
    required: ['type'],
    allOf: [
        {
            anyOf: [
                {
                    not: {
                        properties: { type: { const: NOTIFICATION_TYPE } },
                    },
                },
                { required: ['notificationType', 'message'] },
            ],
        },
        {
            anyOf: [
                {
                    not: {
                        properties: { type: { const: REQUIREMENT_TYPE } },
                    },
                },
                { required: ['requirement'] },
            ],
        },
    ],
}

const validator = ajv.compile(MessageSchema)

export const parseMessage: parseMessageType = (data) => {
    if (!validator(data)) {
        return { errors: validator.errors.map(error => error.message) }
    }
    if (data.type === NOTIFICATION_TYPE) {
        return {
            message: {
                type: NOTIFICATION_TYPE,
                notificationType: data.notificationType,
                message: data.message,
            },
        }
    }
    if (data.type === REQUIREMENT_TYPE) {
        return {
            message: {
                type: REQUIREMENT_TYPE,
                requirement: data.requirement,
            },
        }
    }
    return { errors: ['UNKNOWN MESSAGE TYPE'] }
}