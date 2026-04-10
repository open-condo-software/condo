import {
    useCreateExecutionAiFlowTaskMutation,
    useGetExecutionAiFlowTaskByIdLazyQuery,
} from '@app/condo/gql'
import { ExecutionAiFlowTask } from '@app/condo/schema'
import getConfig from 'next/config'
import { useState, useMemo, useCallback, useEffect, useRef } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useMessagingConnection, useMessagingChannels, useMessagingSubscription } from '@open-condo/messaging/hooks'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'

import { 
    FLOW_TYPES_LIST, 
    TASK_STATUSES,
    CHUNK_TYPES_LIST,
    CHUNK_TYPES,
} from '@condo/domains/ai/constants'
import {
    UI_AI_GENERATE_NEWS_BY_INCIDENT,
    UI_AI_REWRITE_NEWS_TEXT,
    UI_AI_REWRITE_TEXT,
    UI_AI_REWRITE_TICKET_COMMENT,
    UI_AI_REWRITE_INCIDENT_TEXT_FOR_RESIDENT,
    AI_STREAMING,
} from '@condo/domains/common/constants/featureflags'


type ChunkType = typeof CHUNK_TYPES_LIST[number]
type StreamMessageType = {
    type: ChunkType
    item?: string
    meta?: object
    error?: Error
}

type FlowType = typeof FLOW_TYPES_LIST[number]
type UseAIFlowPropsType = {
    flowType: FlowType
    itemId?: string
    modelName?: string
    defaultContext?: object
    timeout?: number
    aiSessionId?: string // Optional session id to group AI requests in one session
}

type UseAIFlowResult<T> = {
    status: ExecutionAiFlowTask['status']
    aiSessionId: ExecutionAiFlowTask['aiSessionId']
    errorMessage?: ExecutionAiFlowTask['errorMessage']
    result: T
}

type UseAIFlowResultType<T> = [
    {
        execute: (context?: object) => Promise<{ data: UseAIFlowResult<T>, error: object, localizedErrorText: string }>
        resume: (taskId: string) => Promise<{ data: UseAIFlowResult<T>, error: object, localizedErrorText: string }>
    },
    {
        loading: boolean
        data: UseAIFlowResult<T> | null
        streamDataText: string
        error: Error | null
        currentTaskId: string | null
    },
]

const DEFAULT_TIMEOUT_MS = 10000
const TASK_FIRST_POLL_TIMEOUT_MS = 2000
const TASK_POLLING_INTERVAL_MS = 1000

export function useAIFlow<T = object> ({
    flowType,
    modelName,
    itemId,
    defaultContext = {},
    timeout = DEFAULT_TIMEOUT_MS,
    aiSessionId,
}: UseAIFlowPropsType): UseAIFlowResultType<T> {
    const { user } = useAuth()
    const { organization } = useOrganization()

    const { publicRuntimeConfig: { messagingWsUrl } } = getConfig()
    
    const [createExecutionAIFlowMutation] = useCreateExecutionAiFlowTaskMutation()
    const [getExecutionAiFlowTaskById] = useGetExecutionAiFlowTaskByIdLazyQuery()

    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<UseAIFlowResult<T> | null>(null)
    const [streamDataText, setStreamDataText] = useState('')
    const [error, setError] = useState<Error | null>(null)
    const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const { useFlagValue } = useFeatureFlags()
    const aiStreamingEnabled = useFlagValue(AI_STREAMING)?.[flowType]

    const { connection, isConnected, userId } = useMessagingConnection({
        enabled: !!aiStreamingEnabled,
        autoConnect: true,
        wsUrl: messagingWsUrl,
    })

    const { channels } = useMessagingChannels({ enabled: !!aiStreamingEnabled }) 

    const topic = useMemo(() => {
        if (aiStreamingEnabled && currentTaskId && user?.id === userId) {
            const userChannel = channels.find((channel) => channel.name === 'user')
            return `${userChannel.topicPrefix}.executionAIFlowTask.${currentTaskId}`
        }
    }, [aiStreamingEnabled, currentTaskId, user?.id, userId, channels])

    const onMessage = useCallback((message: StreamMessageType) => {
        if (message.type === CHUNK_TYPES.FLOW_ITEM && message?.item) {
            setStreamDataText(prev => prev + message.item)
        } else if (message.type === CHUNK_TYPES.TASK_ERROR) {
            setLoading(false)
            setError(message.error)
        } else if (message.type === CHUNK_TYPES.TASK_END) {
            setLoading(false)
        }
    }, [])

    useMessagingSubscription<StreamMessageType>({
        topic,
        connection,
        isConnected,
        userId,
        enabled: !!aiStreamingEnabled,
        onMessage,
    })

    const stopPollingForResult = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }
    }, [])


    useEffect(() => {
        stopPollingForResult()
        setLoading(false)
        setCurrentTaskId(null)
        setData(null)
        setError(null)
    }, [aiSessionId, stopPollingForResult])

    useEffect(() => {
        return () => {
            stopPollingForResult()
        }
    }, [])

    const startPollingForResult = useCallback(async (taskId: string): Promise<{ data: UseAIFlowResult<T>, error: object, localizedErrorText: string }> => {
        return new Promise((resolve) => {
            const startTime = Date.now()
            let hasResolved = false

            const poll = async () => {
                if (hasResolved) return

                if (Date.now() - startTime >= timeout) {
                    hasResolved = true
                    stopPollingForResult()
                    setError(new Error('Flow timed out'))
                    setCurrentTaskId(null)
                    resolve({ data: null, error: new Error('Flow timed out'), localizedErrorText: null })
                    return
                }

                try {
                    const pollResult = await getExecutionAiFlowTaskById({
                        variables: { id: taskId },
                        fetchPolicy: 'no-cache',
                    })

                    if (!pollResult?.data?.task) {
                        hasResolved = true
                        stopPollingForResult()
                        resolve({ data: null, error: new Error('Task not found'), localizedErrorText: null })
                        return
                    }

                    const task = Array.isArray(pollResult.data.task) ? pollResult.data.task[0] : pollResult.data.task
                    if (!task) {
                        hasResolved = true
                        stopPollingForResult()
                        resolve({ data: null, error: new Error('Task not found'), localizedErrorText: null })
                        return
                    }

                    if (task.status === TASK_STATUSES.COMPLETED) {
                        hasResolved = true
                        stopPollingForResult()
                        const result = task.result as T
                        const combinedResult: UseAIFlowResult<T> = {
                            status: task.status,
                            aiSessionId: task.aiSessionId,
                            errorMessage: task.errorMessage,
                            result,
                        }
                        setData(combinedResult)
                        setCurrentTaskId(null)
                        resolve({ data: combinedResult, error: null, localizedErrorText: null })
                        return
                    } else if (task.status === TASK_STATUSES.ERROR || task.status === TASK_STATUSES.CANCELLED) {
                        hasResolved = true
                        stopPollingForResult()
                        setCurrentTaskId(null)
                        resolve({ data: null, error: new Error(`Task in ${task.status} state`), localizedErrorText: task.errorMessage || null })
                        return
                    }
                } catch (error) {
                    hasResolved = true
                    stopPollingForResult()
                    resolve({ data: null, error, localizedErrorText: null })
                    return
                }
            }

            setTimeout(() => {
                if (!hasResolved) {
                    intervalRef.current = setInterval(poll, TASK_POLLING_INTERVAL_MS)
                    poll()
                }
            }, TASK_FIRST_POLL_TIMEOUT_MS)
        })
    }, [timeout, getExecutionAiFlowTaskById, stopPollingForResult])

    const execute = useCallback(async (context: object = {}): Promise<{ data: UseAIFlowResult<T>, error: object, localizedErrorText: string }> => {
        if (!user?.id) {
            const err = new Error('User is not authenticated')
            setError(err)
            return { data: null, error: err, localizedErrorText: null }
        }

        setLoading(true)
        setError(null)
        setData(null)
        setStreamDataText('')

        try {
            const data = {
                dv: 1,
                sender: getClientSideSenderInfo(),
                flowType,
                modelName,
                itemId,
                organization: { connect: { id: organization.id } },
                user: { connect: { id: user.id } },
            }

            data['context'] = { ...defaultContext, ...context }
            if (aiSessionId) { data['aiSessionId'] = aiSessionId }

            const createResult = await createExecutionAIFlowMutation({
                variables: { data },
            })

            const createdTaskId = createResult.data?.task?.id
            if (!createdTaskId) { return { data: null, error: new Error('Failed to create a task'), localizedErrorText: null } }

            setCurrentTaskId(createdTaskId)

            if (aiStreamingEnabled && isConnected) {
                return { data: null, error: null, localizedErrorText: null }
            } else {
                return await startPollingForResult(createdTaskId)
            }
        } catch (err: any) {
            const wrappedErr = err instanceof Error ? err : new Error(err.toString())
            setError(wrappedErr)
            setCurrentTaskId(null)
            return { data: null, error: wrappedErr, localizedErrorText: null }
        } finally {
            if (!(aiStreamingEnabled && isConnected)) setLoading(false)
        }
    }, [
        flowType,
        defaultContext,
        createExecutionAIFlowMutation,
        user?.id,
        organization?.id,
        modelName,
        itemId,
        aiSessionId,
        startPollingForResult,
        aiStreamingEnabled,
        isConnected,
    ])

    const resume = useCallback(async (taskId: string): Promise<{ data: UseAIFlowResult<T>, error: object, localizedErrorText: string }> => {
        setLoading(true)
        setError(null)
        setData(null)
        setStreamDataText('')

        try {
            setCurrentTaskId(taskId)
            if (aiStreamingEnabled && isConnected) {
                return { data: null, error: null, localizedErrorText: null }
            } else {
                return await startPollingForResult(taskId)
            }
        } catch (err: any) {
            const wrappedErr = err instanceof Error ? err : new Error(err.toString())
            setError(wrappedErr)
            setCurrentTaskId(null)
            return { data: null, error: wrappedErr, localizedErrorText: null }
        } finally {
            if (!(aiStreamingEnabled && isConnected)) setLoading(false)
        }
    }, [startPollingForResult, aiStreamingEnabled, isConnected])

    return [{ execute, resume }, { loading, data, streamDataText, error, currentTaskId }]
}

export function useAIConfig () {
    const { publicRuntimeConfig: { aiEnabled } } = getConfig()
    const { useFlag } = useFeatureFlags()

    const rewriteTicketComment = useFlag(UI_AI_REWRITE_TICKET_COMMENT)
    const rewriteText = useFlag(UI_AI_REWRITE_TEXT)
    const rewriteNewsText = useFlag(UI_AI_REWRITE_NEWS_TEXT)
    const generateNewsByIncident = useFlag(UI_AI_GENERATE_NEWS_BY_INCIDENT)
    const rewriteIncidentTextForResident = useFlag(UI_AI_REWRITE_INCIDENT_TEXT_FOR_RESIDENT)

    return {
        enabled: aiEnabled,
        features: {
            rewriteTicketComment,
            rewriteText,
            rewriteNewsText,
            rewriteIncidentTextForResident,
            generateNewsByIncident,
        },
    }
}