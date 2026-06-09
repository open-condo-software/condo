const Ajv = require('ajv')

const conf = require('@open-condo/config')
const { FileRecord } = require('@open-condo/files/schema/utils/serverSchema')
const { safeFormatError } = require('@open-condo/keystone/apolloErrorFormatter')
const FileAdapter = require('@open-condo/keystone/fileAdapter/fileAdapter')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { i18n } = require('@open-condo/locales/loader')
const { buildUserTopic, publish } = require('@open-condo/messaging')

const { FlowiseAdapter, N8NAdapter } = require('@condo/domains/ai/adapters')
const {
    TASK_STATUSES,
    FLOW_ADAPTERS: FLOW_ADAPTER_NAMES,
    CHAT_WITH_CONDO_FLOW_TYPE,
    EXECUTION_AI_FLOW_TASK_FILE_MODEL_NAME,
} = require('@condo/domains/ai/constants')
const { CUSTOM_FLOW_TYPES_LIST, AI_FLOWS_CONFIG } = require('@condo/domains/ai/utils/flowsConfig')
const { ExecutionAIFlowTask } = require('@condo/domains/ai/utils/serverSchema')
const { restoreSensitiveData, removeSensitiveDataFromObj } = require('@condo/domains/ai/utils/serverSchema/removeSensitiveDataFromObj')
const { TASK_WORKER_FINGERPRINT } = require('@condo/domains/common/constants/tasks')

const {
    FLOW_META_SCHEMAS,
    CUSTOM_FLOW_TYPE,
    EVENT_TYPES,
    CHUNK_TYPES,
} = require('../constants')

const BASE_ATTRIBUTES = { dv: 1, sender: { dv: 1, fingerprint: TASK_WORKER_FINGERPRINT } }

const FLOW_ADAPTERS = {
    [FLOW_ADAPTER_NAMES.FLOWISE]: new FlowiseAdapter(),
    [FLOW_ADAPTER_NAMES.N8N]: new N8NAdapter(),
}

const ajv = new Ajv()

const taskLogger = getLogger()

const FILE_RECORD_FIELDS = 'id user { id } fileMimeType fileSize fileMeta { filename originalFilename mimetype meta { fileClientId sourceFileClientId modelNames } } fileAdapter'

const executeAIFlow = async (executionAIFlowTask, additionalContext = {}) => {
    const task = executionAIFlowTask
    const executionAIFlowTaskId = task?.id

    if (!executionAIFlowTaskId) {
        taskLogger.error({
            msg: 'unknown executionAIFlowTaskId!',
        })
        throw new Error('Unknown executionAIFlowTaskId!')
    }

    const { keystone: context } = getSchemaCtx('ExecutionAIFlowTask')

    try {
        if (!task || task.deletedAt) {
            throw new Error(`No task with id "${executionAIFlowTaskId}"`)
        }

        if (task.status !== TASK_STATUSES.PROCESSING) {
            throw new Error(`Task with id "${executionAIFlowTaskId}" has status "${task.status}" already!`)
        }

        const isCustomFlow = CUSTOM_FLOW_TYPES_LIST.includes(task.flowType)
        const adapterConfig = AI_FLOWS_CONFIG?.[isCustomFlow ? 'custom' : 'default']?.[task.flowType]
        if (!adapterConfig) throw new Error(`Cannot find AI flow adapter config for flow "${task.flowType}"!`)

        const adapterName = adapterConfig.adapter
        if (!adapterName) throw new Error(`Unknown AI flow adapter for flow "${task.flowType}"!`)

        const adapter = FLOW_ADAPTERS[adapterName]
        if (!adapter) throw new Error(`Unexpected AI flow adapter "${adapterName}"!`)
        if (!adapter.isConfigured) throw new Error(`Adapter "${adapterName}" not configured!`)

        const predictionUrl = adapterConfig.predictionUrl
        if (!predictionUrl) throw new Error(`Unknown prediction url for flow "${task.flowType}"!`)

        const streaming = adapterConfig.streaming || false

        const topic = buildUserTopic(task.user.id, `executionAIFlowTask.${task.id}`)

        void publish({
            topic,
            data: {
                type: CHUNK_TYPES.TASK_START,
            },
        })

        const fullContext = {
            ...task.cleanContext,
            locale: task.locale,
            aiSessionId: task.aiSessionId,
            ...additionalContext,
        }

        // TODO (DOMA-13305): Remove this when we persist attachments on a model and can fetch publicUrl via GraphQL.
        if (
            task.flowType === CHAT_WITH_CONDO_FLOW_TYPE
            && Array.isArray(fullContext.attachments)
            && fullContext.attachments.length > 0
        ) {
            const resolvedAttachments = []
            
            for (const attachment of fullContext.attachments) {
                const fileRecord = await FileRecord.getOne(
                    context.createContext({ skipAccessControl: true }),
                    {
                        id: attachment.id,
                        deletedAt: null,
                        user: { id: task.user.id },
                    },
                    FILE_RECORD_FIELDS,
                )

                if (!fileRecord) {
                    throw new Error(`File not found or access denied: ${attachment.id}`)
                }

                const modelNames = fileRecord.fileMeta?.meta?.modelNames || []
                if (!modelNames.includes(EXECUTION_AI_FLOW_TASK_FILE_MODEL_NAME)) {
                    throw new Error(`File ${attachment.id} is not an ExecutionAIFlowTaskFile`)
                }

                const fileMeta = fileRecord.fileMeta || {}
                const meta = fileMeta.meta || {}
                const fileClientId = meta.sourceFileClientId || meta.fileClientId

                if (!fileClientId || !fileMeta.filename) {
                    throw new Error(`Invalid file metadata for: ${attachment.id}`)
                }

                const fileAdapter = new FileAdapter(fileClientId)
                const originalFilename = fileMeta.originalFilename || attachment.name
                const fileSize = Number(fileRecord.fileSize)

                const url = fileAdapter.publicUrl({
                    id: fileRecord.id,
                    filename: fileMeta.filename,
                    originalFilename,
                    meta,
                }, { id: task.user.id })

                resolvedAttachments.push({
                    id: attachment.id,
                    name: originalFilename,
                    mimeType: fileRecord.fileMimeType || fileMeta.mimetype,
                    url,
                    ...(fileSize ? { size: fileSize } : {}),
                })
            }

            fullContext.attachments = resolvedAttachments
        }

        let prediction
        if (streaming) {
            prediction = await adapter.execute(predictionUrl, fullContext, task.flowType, async (event) => {
                if (!event) return

                switch (event.type) {
                    case EVENT_TYPES.START:
                        void publish({
                            topic,
                            data: {
                                type: CHUNK_TYPES.FLOW_START,
                            },
                        })
                        return
                    case EVENT_TYPES.ITEM:
                        void publish({
                            topic,
                            data: {
                                type: CHUNK_TYPES.FLOW_ITEM,
                                item: event.content,
                            },
                        })
                        return
                    case EVENT_TYPES.END:
                        void publish({
                            topic,
                            data: {
                                type: CHUNK_TYPES.FLOW_END,
                            },
                        })
                        return
                    case EVENT_TYPES.ERROR:
                        void publish({
                            topic,
                            data: {
                                type: CHUNK_TYPES.FLOW_ERROR,
                                error: event.error,
                            },
                        })
                        return
                    default:
                        void publish({
                            topic,
                            data: {
                                type: CHUNK_TYPES.FLOW_ERROR,
                                error: `Unknown event type: ${event.type}`,
                            },
                        })
                }
            })
        } else {
            prediction = await adapter.execute(predictionUrl, fullContext, task.flowType)
        }

        const schema = FLOW_META_SCHEMAS[isCustomFlow ? CUSTOM_FLOW_TYPE : task.flowType]?.output ?? { type: 'object' }
        const validatePrediction = ajv.compile(schema)

        if (!validatePrediction(prediction.result)) {
            const validationErrors = validatePrediction.errors.map(error => ({
                message: error.message,
                path: error.instancePath,
            }))

            taskLogger.error({
                msg: 'Failed to execute AI flow',
                data: { flowType: task?.flowType },
                err: 'The prediction format is not valid!',
                entityId: executionAIFlowTaskId,
                entity: 'ExecutionAIFlowTask',
            })

            await ExecutionAIFlowTask.update(context, executionAIFlowTaskId, {
                ...BASE_ATTRIBUTES,
                error: JSON.stringify({ message: 'The prediction format is not valid!', validationErrors }),
                errorMessage: i18n('api.ai.executionAIFlowTask.FAILED_TO_COMPLETE_REQUEST', { locale: task?.locale || conf.DEFAULT_LOCALE }),
                meta: {
                    response: prediction._response,
                },
                status: TASK_STATUSES.ERROR,
            })

            void publish({
                topic,
                data: {
                    type: CHUNK_TYPES.TASK_ERROR,
                    error: JSON.stringify({ message: 'The prediction format is not valid!', validationErrors }),
                    errorMessage: i18n('api.ai.executionAIFlowTask.FAILED_TO_COMPLETE_REQUEST', { locale: task?.locale || conf.DEFAULT_LOCALE }),
                },
            })

            return
        }

        const { replacements } = removeSensitiveDataFromObj(task.context)
        const resultWithRestoredPII = restoreSensitiveData(prediction.result, replacements)

        let updateData = {
            ...BASE_ATTRIBUTES,
            result: resultWithRestoredPII,
            meta: {
                ...prediction.result,
                response: prediction._response,
            },
            status: TASK_STATUSES.COMPLETED,
        }

        await ExecutionAIFlowTask.update(context, executionAIFlowTaskId, updateData)

        void publish({
            topic,
            data: {
                type: CHUNK_TYPES.TASK_END,
            },
        })
    } catch (error) {
        taskLogger.error({
            msg: 'Failed to execute AI flow',
            data: { flowType: task?.flowType },
            entityId: executionAIFlowTaskId,
            entity: 'ExecutionAIFlowTask',
            err: error,
        })

        await ExecutionAIFlowTask.update(context, executionAIFlowTaskId, {
            ...BASE_ATTRIBUTES,
            status: TASK_STATUSES.ERROR,
            error: safeFormatError(error, false),
            meta: error?._response ? { response: error._response } : null,
            errorMessage: i18n('api.ai.executionAIFlowTask.FAILED_TO_COMPLETE_REQUEST', { locale: task?.locale || conf.DEFAULT_LOCALE }),
        })

        void publish({
            topic: buildUserTopic(task.user.id, `executionAIFlowTask.${task.id}`),
            data: {
                type: CHUNK_TYPES.TASK_ERROR,
                error: safeFormatError(error, true),
                errorMessage: i18n('api.ai.executionAIFlowTask.FAILED_TO_COMPLETE_REQUEST', { locale: task?.locale || conf.DEFAULT_LOCALE }),
            },
        })

        throw error
    }
}

module.exports = {
    executeAIFlow,
}
