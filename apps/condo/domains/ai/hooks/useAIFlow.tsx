import {
    useCreateExecutionAiFlowTaskMutation,
    useGetExecutionAiFlowTaskByIdLazyQuery,
    useUpdateExecutionAiFlowTaskMutation,
} from '@app/condo/gql'
import { ExecutionAiFlowTask, ExecutionAiFlowTaskStatusType } from '@app/condo/schema'
import getConfig from 'next/config'
import { useState, useCallback, useEffect, useRef } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'

import { FLOW_TYPES_LIST, TASK_STATUSES } from '@condo/domains/ai/constants'
import {
    UI_AI_GENERATE_NEWS_BY_INCIDENT,
    UI_AI_REWRITE_NEWS_TEXT,
    UI_AI_REWRITE_TEXT,
    UI_AI_REWRITE_TICKET_COMMENT,
    UI_AI_REWRITE_INCIDENT_TEXT_FOR_RESIDENT,
} from '@condo/domains/common/constants/featureflags'

type FlowType = typeof FLOW_TYPES_LIST[number]

type UseAIFlowPropsType<T = object> = {
    flowType: FlowType
    flowStage?: string
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
        error: Error | null
        currentTaskId: string | null
    },
]

const DEFAULT_TIMEOUT_MS = 10000
const TASK_FIRST_POLL_TIMEOUT_MS = 2000
const TASK_POLLING_INTERVAL_MS = 1000

export function useAIFlow<T = object> ({
    flowType,
    flowStage,
    modelName,
    itemId,
    defaultContext = {},
    timeout = DEFAULT_TIMEOUT_MS,
    aiSessionId,
}: UseAIFlowPropsType<T>): UseAIFlowResultType<T> {
    const { user } = useAuth()
    const { organization } = useOrganization()

    const [createExecutionAIFlowMutation] = useCreateExecutionAiFlowTaskMutation()
    const [getExecutionAiFlowTaskById] = useGetExecutionAiFlowTaskByIdLazyQuery()
    const [updateExecutionAIFlowTaskMutation] = useUpdateExecutionAiFlowTaskMutation()

    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<UseAIFlowResult<T> | null>(null)
    const [error, setError] = useState<Error | null>(null)
    const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
                flowStage,
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
            return await startPollingForResult(createdTaskId)
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
        timeout,
        defaultContext,
        createExecutionAIFlowMutation,
        getExecutionAiFlowTaskById,
        user?.id,
        organization?.id,
        modelName,
        itemId,
        aiSessionId,
    ])

    const resume = useCallback(async (taskId: string): Promise<{ data: UseAIFlowResult<T>, error: object, localizedErrorText: string }> => {
        setLoading(true)
        setError(null)
        setData(null)

        try {
            setCurrentTaskId(taskId)
            return await startPollingForResult(taskId)
        } catch (err: any) {
            const wrappedErr = err instanceof Error ? err : new Error(err.toString())
            setError(wrappedErr)
            setCurrentTaskId(null)
            return { data: null, error: wrappedErr, localizedErrorText: null }
        } finally {
            setLoading(false)
        }
    }, [startPollingForResult])

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