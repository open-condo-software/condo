import { TASK_STATUS } from '@condo/domains/common/components/tasks'

const Ajv = require('ajv')
const ajv = new Ajv()

// CONST DECLARATION BLOCK (for checking by external observer)
export const TASK_MESSAGE_TYPE = 'task'
export const RESIZE_MESSAGE_TYPE = 'resize'

export type TaskOperationType = 'create' | 'update' | 'get'

// TYPES DECLARATION BLOCK
export type TaskMessageType = {
    id?: string,
    type: 'task',
    taskId: string,
    taskTitle: string,
    taskDescription: string,
    taskProgress: number,
    taskStatus: TASK_STATUS,
    taskOperation: TaskOperationType,
}

export type TaskProgressPayloadType = Omit<TaskMessageType, 'type' | 'taskOperation'>

type TaskGetMessageType = {
    type: 'task',
    taskOperation: 'get',
}

type ResizeMessageType = {
    type: 'resize',
    height: number,
}

type SystemMessageType =
    | TaskMessageType
    | TaskGetMessageType
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
    TASK_MESSAGE_TYPE,
    RESIZE_MESSAGE_TYPE,
]

const MessagesRequiredProperties = {
    [TASK_MESSAGE_TYPE]: ['taskOperation'],
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
        {
            'if': {
                properties: {
                    type: { const: TASK_MESSAGE_TYPE },
                    taskOperation: { const: 'create' },
                },
                required: ['type', 'taskOperation' ],
            },
            then: {
                required: ['taskId', 'taskStatus', 'taskDescription', 'taskTitle', 'taskProgress'],
            },
        },
        {
            'if': {
                properties: {
                    type: { const: TASK_MESSAGE_TYPE },
                    taskOperation: { const: 'update' },
                },
                required: ['type', 'taskOperation'],
            },
            then: {
                required: ['id', 'taskId', 'taskStatus', 'taskDescription', 'taskTitle', 'taskProgress'],
            },
        },
        {
            'if': {
                properties: {
                    type: { const: TASK_MESSAGE_TYPE },
                    taskOperation: { const: 'get' },
                },
                required: ['type', 'taskOperation'],
            },
            then: {
                required: ['type', 'taskOperation'],
            },
        },
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
            case TASK_MESSAGE_TYPE: {
                if (data.taskOperation === 'create' || data.taskOperation === 'update') {
                    return {
                        type: 'system',
                        message: {
                            type: TASK_MESSAGE_TYPE,
                            id: data.id,
                            taskId: data.taskId,
                            taskTitle: data.taskTitle,
                            taskDescription: data.taskDescription,
                            taskProgress: data.taskProgress,
                            taskStatus: data.taskStatus,
                            taskOperation: data.taskOperation,
                        },
                    }
                } else if (data.taskOperation === 'get')
                    return {
                        type: 'system',
                        message: {
                            type: TASK_MESSAGE_TYPE,
                            taskOperation: data.taskOperation,
                        },
                    }

                return null
            }
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

// UTILS BLOCK
export const sendMessage = (message: Record<string, unknown>, receiver: Window, receiverOrigin: string): void => {
    if (receiver) {
        receiver.postMessage(message, receiverOrigin)
    }
}

export const sendCreateTaskProgress = (taskProgressPayload: TaskProgressPayloadType, receiver: Window, receiverOrigin: string): void => {
    sendMessage({
        type: TASK_MESSAGE_TYPE,
        taskOperation: 'create',
        ...taskProgressPayload,
    }, receiver, receiverOrigin)
}

export const sendUpdateTaskProgress = (taskProgressPayload: TaskProgressPayloadType, receiver: Window, receiverOrigin: string): void => {
    sendMessage({
        type: TASK_MESSAGE_TYPE,
        taskOperation: 'update',
        ...taskProgressPayload,
    }, receiver, receiverOrigin)
}

export const sendGetProcessingTasks = (receiver: Window, receiverOrigin: string): void => {
    sendMessage({
        type: TASK_MESSAGE_TYPE,
        taskOperation: 'get',
    }, receiver, receiverOrigin)
}
