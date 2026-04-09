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
} from '@condo/domains/ai/constants'
import {
    UI_AI_GENERATE_NEWS_BY_INCIDENT,
    UI_AI_REWRITE_NEWS_TEXT,
    UI_AI_REWRITE_TEXT,
    UI_AI_REWRITE_TICKET_COMMENT,
    UI_AI_REWRITE_INCIDENT_TEXT_FOR_RESIDENT,
} from '@condo/domains/common/constants/featureflags'


type ChunkType = typeof CHUNK_TYPES_LIST[number]
export type StreamMessageType = {
    type: ChunkType
    item?: string
    meta?: object
    error?: string
}

type FlowType = typeof FLOW_TYPES_LIST[number]
type UseAIFlowPropsType = {
    flowType: FlowType
    itemId?: string
    modelName?: string
    defaultContext?: object
    timeout?: number
    aiSessionId?: string // Optional session id to group AI requests in one session
    onChunk?: (message: StreamMessageType) => void
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
    onChunk,
}: UseAIFlowPropsType): UseAIFlowResultType<T> {
    const { user } = useAuth()
    const { organization } = useOrganization()

    const { publicRuntimeConfig: { messagingWsUrl } } = getConfig()
    
    const [createExecutionAIFlowMutation] = useCreateExecutionAiFlowTaskMutation()
    const [getExecutionAiFlowTaskById] = useGetExecutionAiFlowTaskByIdLazyQuery()

    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<UseAIFlowResult<T> | null>(null)
    const [error, setError] = useState<Error | null>(null)
    const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const { connection, isConnected, userId } = useMessagingConnection({
        enabled: !!onChunk,
        autoConnect: true,
        wsUrl: messagingWsUrl,
    })
    console.log('useMessagingConnection', connection)

    const { channels } = useMessagingChannels({ enabled: !!onChunk }) 

    const topic = useMemo(() => {
        if (currentTaskId && user?.id === userId) {
            const userChannel = channels.find((channel) => channel.name === 'user')
            const t = `${userChannel.topicPrefix}.executionAIFlowTask.${currentTaskId}`
            console.log('topic', t)
            return t
        }
    }, [currentTaskId, user?.id, userId, channels])

    const { isSubscribed, error: ooo } = useMessagingSubscription<StreamMessageType>({
        topic,
        connection,
        isConnected,
        userId,
        enabled: !!onChunk && !!topic,
        onMessage: onChunk,
    })
    console.log('useMessagingSubscription', isSubscribed)
    console.log('useMessagingSubscription - ooo', ooo)

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

            if (isConnected) {
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
            setLoading(false)
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
        isConnected,
    ])

    const resume = useCallback(async (taskId: string): Promise<{ data: UseAIFlowResult<T>, error: object, localizedErrorText: string }> => {
        setLoading(true)
        setError(null)
        setData(null)

        try {
            setCurrentTaskId(taskId)
            if (isConnected) {
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
            setLoading(false)
        }
    }, [startPollingForResult, isConnected])

    return [{ execute, resume }, { loading, data, error, currentTaskId }]
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