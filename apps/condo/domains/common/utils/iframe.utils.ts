// TODO(DOMA-5142): Remove all of this legacy code as soon as contractors will be ready

const Ajv = require('ajv')
const ajv = new Ajv()

// CONST DECLARATION BLOCK (for checking by external observer)
export const RESIZE_MESSAGE_TYPE = 'resize'

export type TaskOperationType = 'create' | 'update' | 'get'

// TYPES DECLARATION BLOCK
type ResizeMessageType = {
    type: 'resize',
    height: number,
}

type SystemMessageType =
    | ResizeMessageType

type SystemMessageReturnType = {
    type: 'system'
    message: SystemMessageType
}

type CustomMessageReturnType = {
    type: 'custom'
    message: Record<string, unknown>
}

type ParsedMessageReturnType = SystemMessageReturnType | CustomMessageReturnType

type parseMessageType = (data: any) => ParsedMessageReturnType

// CONFIGURATION BLOCK
const AvailableMessageTypes = [
    RESIZE_MESSAGE_TYPE,
]

const MessagesRequiredProperties = {
    [RESIZE_MESSAGE_TYPE]: ['height'],
}

const SystemMessageDetectorSchema = {
    type: 'object',
    properties: {
        type: { enum: AvailableMessageTypes },
    },
    additionalProperties: true,
    required: ['type'],
}

const SystemMessageSchema = {
    type: 'object',
    properties: {
        type: { enum: AvailableMessageTypes },
        taskId: { type: 'string' },
        taskTitle: { type: 'string' },
        taskDescription: { type: 'string' },
        taskProgress: { type: 'number' },
        taskStatus: { enum: ['processing', 'completed', 'error'] },
        taskOperation: { enum: ['create', 'update', 'get'] },
        notificationType: { enum: ['info', 'warning', 'error', 'success'] },
        message: { type: 'string' },
        requirement: { enum: ['auth', 'organization'] },
        status: { const: 'done' },
        requestMessage: { type: 'object' },
        height: { type: 'number' },
        id: { type: 'string' },
        command: { type: 'string' },
        data: { type: 'object' },
        url: { type: 'string' },
        action: { enum: ['open', 'close'] },
        modalId: { type: 'string' },
        closable: { type: 'boolean' },
    },
    additionalProperties: false,
    required: ['type'],
    allOf: [
        ...Object.keys(MessagesRequiredProperties).map(messageType => ({
            anyOf: [
                { not: { properties: { type: { const: messageType } } } },
                { required: MessagesRequiredProperties[messageType] },
            ],
        })),
    ],
}

const systemMessageDetector = ajv.compile(SystemMessageDetectorSchema)
const systemMessageValidator = ajv.compile(SystemMessageSchema)

// PARSING PART
/**
 * @deprecated
 */
export const parseMessage: parseMessageType = (data) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null
    if (systemMessageDetector(data)) {
        if (!systemMessageValidator(data)) return null
        switch (data.type) {
            case RESIZE_MESSAGE_TYPE:
                return {
                    type: 'system',
                    message: {
                        type: RESIZE_MESSAGE_TYPE,
                        height: data.height,
                    },
                }
        }
    } else {
        return { type: 'custom', message: data }
    }
}
