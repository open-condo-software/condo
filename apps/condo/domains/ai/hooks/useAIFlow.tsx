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
import { createAnswerDisplayBuffer, type AnswerDisplayBuffer } from '@condo/domains/ai/utils/answerDisplayBuffer'
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
    aiSessionId?: string
}

type AIFlowTaskData<T> = {
    status: ExecutionAiFlowTask['status']
    aiSessionId: ExecutionAiFlowTask['aiSessionId']
    errorMessage?: ExecutionAiFlowTask['errorMessage']
    result: T
}

type AIFlowTaskResult<T> = {
    data: AIFlowTaskData<T> | null
    error: Error | null
    localizedErrorText: string | null
}

type StreamWaitResult<T> =
    | { type: 'done', outcome: AIFlowTaskResult<T> }
    | { type: 'timeout' }
    | { type: 'cancelled' }

type PendingCompletion<T> = {
    runId: number
    taskId: string
    settled: boolean
    resolve: (result: StreamWaitResult<T>) => void
}

type UseAIFlowResultType<T> = [
    {
        execute: (context?: object) => Promise<AIFlowTaskResult<T>>
        resume: (taskId: string) => Promise<AIFlowTaskResult<T>>
    },
    {
        loading: boolean
        data: AIFlowTaskData<T> | null
        error: Error | null
        currentTaskId: string | null
    },
]

const DEFAULT_TIMEOUT_MS = 10000
const TASK_FIRST_POLL_TIMEOUT_MS = 2000
const TASK_POLLING_INTERVAL_MS = 1000

function extractAnswerText (result: unknown): string {
    if (typeof result === 'string') {
        return result
    }
    if (result && typeof result === 'object' && 'answer' in result) {
        const answer = (result as { answer?: unknown }).answer
        if (typeof answer === 'string') {
            return answer
        }
    }
    return ''
}

function buildAnswerResult<T> (answerText: string): T {
    return { answer: answerText } as T
}

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
    const [getExecutionAIFlowTaskById] = useGetExecutionAiFlowTaskByIdLazyQuery()

    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<AIFlowTaskData<T> | null>(null)
    const [error, setError] = useState<Error | null>(null)
    const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)

    const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const pollingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const streamTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const runIdRef = useRef(0)
    const pendingCompletionRef = useRef<PendingCompletion<T> | null>(null)
    const displayBufferRef = useRef<AnswerDisplayBuffer | null>(null)

    const { useFlagValue } = useFeatureFlags()
    const aiStreamingEnabled = useFlagValue(AI_STREAMING)?.[flowType]

    const isActiveRun = useCallback((runId: number) => runId === runIdRef.current, [])

    const stopPollingTimers = useCallback(() => {
        if (pollingTimeoutRef.current) {
            clearTimeout(pollingTimeoutRef.current)
            pollingTimeoutRef.current = null
        }
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
        }
    }, [])

    const clearStreamTimeout = useCallback(() => {
        if (streamTimeoutRef.current) {
            clearTimeout(streamTimeoutRef.current)
            streamTimeoutRef.current = null
        }
    }, [])

    const invalidateActiveWork = useCallback(() => {
        runIdRef.current += 1
        stopPollingTimers()
        clearStreamTimeout()
        const pending = pendingCompletionRef.current
        if (pending && !pending.settled) {
            pending.settled = true
            pendingCompletionRef.current = null
            pending.resolve({ type: 'cancelled' })
        } else {
            pendingCompletionRef.current = null
        }
        return runIdRef.current
    }, [stopPollingTimers, clearStreamTimeout])

    const getDisplayBuffer = useCallback((recreate = false) => {
        if (recreate || !displayBufferRef.current) {
            displayBufferRef.current?.dispose()
            displayBufferRef.current = createAnswerDisplayBuffer({
                onFlush: (text) => {
                    setData({
                        status: TASK_STATUSES.PROCESSING as ExecutionAiFlowTask['status'],
                        aiSessionId: aiSessionId || null,
                        errorMessage: null,
                        result: buildAnswerResult<T>(text),
                    })
                },
            })
            if (recreate) {
                setData(null)
            }
        }
        return displayBufferRef.current
    }, [aiSessionId])

    const runningFlow = useCallback(() => {
        setData(null)
        setLoading(true)
        setError(null)
    }, [])

    const completeFlow = useCallback((result: AIFlowTaskResult<T>) => {
        setData(result.data)
        setLoading(false)
        setError(null)
        setCurrentTaskId(null)
    }, [])

    const failFlow = useCallback((err: Error | null) => {
        setData(null)
        setLoading(false)
        setError(err)
        setCurrentTaskId(null)
    }, [])

    const settlePendingCompletion = useCallback((runId: number, outcome: AIFlowTaskResult<T>) => {
        const pending = pendingCompletionRef.current
        if (!pending || pending.settled || pending.runId !== runId || !isActiveRun(runId)) return
        pending.settled = true
        pendingCompletionRef.current = null
        clearStreamTimeout()
        pending.resolve({ type: 'done', outcome })
    }, [clearStreamTimeout, isActiveRun])

    const { connection, isConnected, userId } = useMessagingConnection({
        enabled: !!aiStreamingEnabled,
        autoConnect: true,
        wsUrl: messagingWsUrl,
    })

    const { channels } = useMessagingChannels({ enabled: !!aiStreamingEnabled })

    const topic = useMemo(() => {
        if (aiStreamingEnabled && currentTaskId && user?.id === userId) {
            const userChannel = channels.find((channel) => channel.name === 'user')
            if (!userChannel?.topicPrefix) return
            return `${userChannel.topicPrefix}.executionAIFlowTask.${currentTaskId}`
        }
    }, [aiStreamingEnabled, currentTaskId, user?.id, userId, channels])

    const onMessage = useCallback((message: StreamMessageType) => {
        const pending = pendingCompletionRef.current
        if (!pending || pending.settled || !isActiveRun(pending.runId)) return

        const { runId } = pending
        const buffer = getDisplayBuffer()

        if (message.type === CHUNK_TYPES.FLOW_ITEM && message?.item) {
            buffer.append(message.item)
        } else if (message.type === CHUNK_TYPES.TASK_ERROR) {
            const err = message.error ?? new Error('Stream task error')
            failFlow(err)
            settlePendingCompletion(runId, { data: null, error: err, localizedErrorText: null })
        } else if (message.type === CHUNK_TYPES.TASK_END) {
            const answerText = buffer.getText()
            const combinedResult: AIFlowTaskResult<T> = {
                data: {
                    status: TASK_STATUSES.COMPLETED as ExecutionAiFlowTask['status'],
                    aiSessionId: aiSessionId || null,
                    errorMessage: null,
                    result: buildAnswerResult<T>(answerText),
                },
                error: null,
                localizedErrorText: null,
            }

            buffer.finish(() => {
                if (!isActiveRun(runId) || pendingCompletionRef.current?.runId !== runId) return
                completeFlow(combinedResult)
                settlePendingCompletion(runId, combinedResult)
            })
        }
    }, [aiSessionId, getDisplayBuffer, completeFlow, failFlow, settlePendingCompletion, isActiveRun])

    useMessagingSubscription<StreamMessageType>({
        topic,
        connection,
        isConnected,
        userId,
        enabled: !!aiStreamingEnabled,
        onMessage,
    })

    const startPollingForResult = useCallback(async (taskId: string, runId: number): Promise<AIFlowTaskResult<T>> => {
        stopPollingTimers()

        return new Promise((resolve) => {
            const startTime = Date.now()
            let hasResolved = false

            const resolveOnce = (value: AIFlowTaskResult<T>) => {
                if (hasResolved || !isActiveRun(runId)) return
                hasResolved = true
                stopPollingTimers()
                resolve(value)
            }

            const poll = async () => {
                if (hasResolved || !isActiveRun(runId)) return

                if (Date.now() - startTime >= timeout) {
                    const timeoutError = new Error('Flow timed out')
                    failFlow(timeoutError)
                    resolveOnce({ data: null, error: timeoutError, localizedErrorText: null })
                    return
                }

                try {
                    const pollResult = await getExecutionAIFlowTaskById({
                        variables: { id: taskId },
                        fetchPolicy: 'no-cache',
                    })

                    if (hasResolved || !isActiveRun(runId)) return

                    if (!pollResult?.data?.task) {
                        const notFoundError = new Error('Task not found')
                        failFlow(notFoundError)
                        resolveOnce({ data: null, error: notFoundError, localizedErrorText: null })
                        return
                    }

                    const task = Array.isArray(pollResult.data.task) ? pollResult.data.task[0] : pollResult.data.task
                    if (!task) {
                        const notFoundError = new Error('Task not found')
                        failFlow(notFoundError)
                        resolveOnce({ data: null, error: notFoundError, localizedErrorText: null })
                        return
                    }

                    if (task.status === TASK_STATUSES.COMPLETED) {
                        const result = task.result as T
                        const answerText = extractAnswerText(result)
                        getDisplayBuffer().set(answerText)
                        const combinedResult: AIFlowTaskResult<T> = {
                            data: {
                                status: task.status,
                                aiSessionId: task.aiSessionId,
                                errorMessage: task.errorMessage,
                                result,
                            },
                            error: null,
                            localizedErrorText: null,
                        }
                        completeFlow(combinedResult)
                        resolveOnce(combinedResult)
                        return
                    } else if (task.status === TASK_STATUSES.ERROR || task.status === TASK_STATUSES.CANCELLED) {
                        failFlow(new Error(`Task in ${task.status} state`))
                        resolveOnce({
                            data: null,
                            error: new Error(`Task in ${task.status} state`),
                            localizedErrorText: task.errorMessage || null,
                        })
                        return
                    }
                } catch (pollError) {
                    if (hasResolved || !isActiveRun(runId)) return
                    const err = pollError instanceof Error ? pollError : new Error(String(pollError))
                    failFlow(err)
                    resolveOnce({ data: null, error: err, localizedErrorText: null })
                }
            }

            pollingTimeoutRef.current = setTimeout(() => {
                if (hasResolved || !isActiveRun(runId)) return
                pollingIntervalRef.current = setInterval(poll, TASK_POLLING_INTERVAL_MS)
                void poll()
            }, TASK_FIRST_POLL_TIMEOUT_MS)
        })
    }, [timeout, getExecutionAIFlowTaskById, stopPollingTimers, getDisplayBuffer, completeFlow, failFlow, isActiveRun])

    useEffect(() => {
        invalidateActiveWork()
        setLoading(false)
        setCurrentTaskId(null)
        setData(null)
        getDisplayBuffer(true)
        setError(null)
    }, [aiSessionId, invalidateActiveWork, getDisplayBuffer])

    useEffect(() => {
        return () => {
            invalidateActiveWork()
            displayBufferRef.current?.dispose()
            displayBufferRef.current = null
        }
    }, [invalidateActiveWork])

    const waitForTaskResult = useCallback(async (taskId: string, runId: number): Promise<AIFlowTaskResult<T>> => {
        if (aiStreamingEnabled && isConnected) {
            const streamWait = await new Promise<StreamWaitResult<T>>((resolve) => {
                pendingCompletionRef.current = {
                    runId,
                    taskId,
                    settled: false,
                    resolve,
                }
                streamTimeoutRef.current = setTimeout(() => {
                    const pending = pendingCompletionRef.current
                    if (!pending || pending.settled || pending.runId !== runId || !isActiveRun(runId)) return
                    pending.settled = true
                    pendingCompletionRef.current = null
                    streamTimeoutRef.current = null
                    resolve({ type: 'timeout' })
                }, timeout)
            })

            if (streamWait.type === 'done') {
                return streamWait.outcome
            }
            if (streamWait.type === 'cancelled') {
                return { data: null, error: new Error('Flow cancelled'), localizedErrorText: null }
            }
        }

        return startPollingForResult(taskId, runId)
    }, [
        aiStreamingEnabled,
        isConnected,
        timeout,
        startPollingForResult,
        isActiveRun,
    ])

    const execute = useCallback(async (context: object = {}): Promise<AIFlowTaskResult<T>> => {
        if (!user?.id) {
            const err = new Error('User is not authenticated')
            failFlow(err)
            return { data: null, error: err, localizedErrorText: null }
        }

        const runId = invalidateActiveWork()
        runningFlow()
        getDisplayBuffer(true)

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

            if (!isActiveRun(runId)) {
                return { data: null, error: new Error('Flow cancelled'), localizedErrorText: null }
            }

            const createdTaskId = createResult.data?.task?.id
            if (!createdTaskId) {
                failFlow(new Error('Failed to create a task'))
                return { data: null, error: new Error('Failed to create a task'), localizedErrorText: null }
            }

            setCurrentTaskId(createdTaskId)
            return await waitForTaskResult(createdTaskId, runId)
        } catch (err: unknown) {
            if (!isActiveRun(runId)) {
                return { data: null, error: new Error('Flow cancelled'), localizedErrorText: null }
            }
            const wrappedErr = err instanceof Error ? err : new Error(String(err))
            failFlow(wrappedErr)
            return { data: null, error: wrappedErr, localizedErrorText: null }
        } finally {
            if (isActiveRun(runId)) {
                setLoading(false)
            }
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
        waitForTaskResult,
        getDisplayBuffer,
        runningFlow,
        failFlow,
        invalidateActiveWork,
        isActiveRun,
    ])

    const resume = useCallback(async (taskId: string): Promise<AIFlowTaskResult<T>> => {
        const runId = invalidateActiveWork()
        runningFlow()
        getDisplayBuffer(true)

        try {
            setCurrentTaskId(taskId)
            return await waitForTaskResult(taskId, runId)
        } catch (err: unknown) {
            if (!isActiveRun(runId)) {
                return { data: null, error: new Error('Flow cancelled'), localizedErrorText: null }
            }
            const wrappedErr = err instanceof Error ? err : new Error(String(err))
            failFlow(wrappedErr)
            return { data: null, error: wrappedErr, localizedErrorText: null }
        } finally {
            if (isActiveRun(runId)) {
                setLoading(false)
            }
        }
    }, [waitForTaskResult, getDisplayBuffer, runningFlow, failFlow, invalidateActiveWork, isActiveRun])

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
