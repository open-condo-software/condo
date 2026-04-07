const Ajv = require('ajv')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { i18n } = require('@open-condo/locales/loader')
const { buildUserTopic, publish } = require('@open-condo/messaging')


const { FlowiseAdapter, N8NAdapter } = require('@condo/domains/ai/adapters')
const {
    TASK_STATUSES,
    FLOW_ADAPTERS: FLOW_ADAPTER_NAMES,
} = require('@condo/domains/ai/constants')
const { CUSTOM_FLOW_TYPES_LIST, AI_FLOWS_CONFIG } = require('@condo/domains/ai/utils/flowsConfig')
const { ExecutionAIFlowTask } = require('@condo/domains/ai/utils/serverSchema')
const { restoreSensitiveData, removeSensitiveDataFromObj } = require('@condo/domains/ai/utils/serverSchema/removeSensitiveDataFromObj')
const { TASK_WORKER_FINGERPRINT } = require('@condo/domains/common/constants/tasks')

const { FLOW_META_SCHEMAS, CUSTOM_FLOW_TYPE } = require('../constants')

const BASE_ATTRIBUTES = { dv: 1, sender: { dv: 1, fingerprint: TASK_WORKER_FINGERPRINT } }

const FLOW_ADAPTERS = {
    [FLOW_ADAPTER_NAMES.FLOWISE]: new FlowiseAdapter(),
    [FLOW_ADAPTER_NAMES.N8N]: new N8NAdapter(),
}

const ajv = new Ajv()

const taskLogger = getLogger()

const executeAIFlow = async (executionAIFlowTaskId) => {
    if (!executionAIFlowTaskId) {
        taskLogger.error({
            msg: 'unknown executionAIFlowTaskId!',
        })
        throw new Error('Unknown executionAIFlowTaskId!')
    }

    const { keystone: context } = getSchemaCtx('ExecutionAIFlowTask')

    const task = await ExecutionAIFlowTask.getOne(context, { id: executionAIFlowTaskId }, 'id flowType context cleanContext locale status user { id } aiSessionId flowStage')

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

        const flowStage = task.flowStage ?? 'default'
        const stageConfig = adapterConfig.stages[flowStage]
        if (!stageConfig || !stageConfig?.predictionUrl) throw new Error(`Unknown prediction url for flow "${task.flowType}" and stage "${flowStage}"!`)

        const topic = buildUserTopic(task.user.id, `executionAIFlowTask.${task.id}`)

        await publish({
            topic,
            data: {
                type: 'task_start',
            },
        })

        const fullContext = {
            ...task.cleanContext,
            locale: task.locale,
        }

        let prediction = null
        if (stageConfig?.hasStream) {
            prediction = await adapter.execute(task.flowType, stageConfig.predictionUrl, fullContext, async (event) => {
                if (!event) return
    
                switch (event.type) {
                    case 'start':
                        await publish({
                            topic,
                            data: {
                                type: 'flow_start',
                            },
                        })
                        return
                    case 'item':
                        await publish({
                            topic,
                            data: {
                                type: 'flow_item',
                                item: event.content,
                            },
                        })
                        return
                    case 'end':
                        await publish({
                            topic,
                            data: {
                                type: 'flow_end',
                            },
                        })
                        return
                    case 'error':
                        await publish({
                            topic,
                            data: {
                                type: 'flow_error',
                                error: event.error,
                            },
                        })
                        return
                    default: 
                        await publish({
                            topic,
                            data: {
                                type: 'flow_error',
                                error: `Unknown event type: ${event.type}`,
                            },
                        })
                }
            })
        } else {
            prediction = await adapter.execute(task.flowType, stageConfig.predictionUrl, fullContext)
        }

        const schema = FLOW_META_SCHEMAS[isCustomFlow ? CUSTOM_FLOW_TYPE : task.flowType]?.output ?? { type: 'object' }
        const validatePrediction = ajv.compile(schema)

        if (!validatePrediction(prediction?.result)) {
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
                    response: prediction?._response,
                },
                status: TASK_STATUSES.ERROR,
            })

            await publish({
                topic,
                data: {
                    type: 'task_error',
                    error: JSON.stringify({ message: 'The prediction format is not valid!', validationErrors }),
                    errorMessage: i18n('api.ai.executionAIFlowTask.FAILED_TO_COMPLETE_REQUEST', { locale: task?.locale || conf.DEFAULT_LOCALE }),
                },
            })

            return
        }

        const { replacements } = removeSensitiveDataFromObj(task.context)
        const resultWithRestoredPII = restoreSensitiveData(prediction?.result, replacements)

        let updateData = {
            ...BASE_ATTRIBUTES,
            result: resultWithRestoredPII,
            meta: {
                ...prediction?.result,
                response: prediction?._response,
            },
            status: TASK_STATUSES.COMPLETED,
        }

        await ExecutionAIFlowTask.update(context, executionAIFlowTaskId, updateData)

        await publish({
            topic,
            data: {
                type: 'task_end',
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
            error: { ...error },
            meta: {
                response: error?._response,
            },
            errorMessage: i18n('api.ai.executionAIFlowTask.FAILED_TO_COMPLETE_REQUEST', { locale: task?.locale || conf.DEFAULT_LOCALE }),
        })

        await publish({
            topic: buildUserTopic(task.user.id, `executionAIFlowTask.${task.id}`),
            data: {
                type: 'task_error',
                error: { ...error },
                errorMessage: i18n('api.ai.executionAIFlowTask.FAILED_TO_COMPLETE_REQUEST', { locale: task?.locale || conf.DEFAULT_LOCALE }),
            },
        })

        throw error
    }
}

module.exports = {
    executeAIFlow,
}