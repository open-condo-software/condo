import {
    useCreateExecutionAiFlowTaskMutation,
    useGetExecutionAiFlowTaskByIdLazyQuery,
} from '@app/condo/gql'
import getConfig from 'next/config'
import { useState, useCallback } from 'react'

import { getClientSideSenderInfo } from '@open-condo/codegen/utils/userId'
import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useAuth } from '@open-condo/next/auth'


import { FLOW_TYPES_LIST, TASK_STATUSES } from '../constants.js'

type FlowType = typeof FLOW_TYPES_LIST[number]

type UseAIFlowPropsType<T> = {
    flowType: FlowType
    defaultContext?: object
    timeout?: number
}

type UseAIFlowResultType<T> = [
    (params?: { context?: object }) => Promise<{ data: T, error: object, localizedErrorText: string } | null>,
    {
        loading: boolean
        data: T | null
        error: Error | null
    },
]

const DEFAULT_TIMEOUT_MS = 10000
const TASK_FIRST_POLL_TIMEOUT_MS = 500
const TASK_POLLING_INTERVAL_MS = 1000

export function useAIFlow<T = object> ({
    flowType,
    defaultContext = {},
    timeout = DEFAULT_TIMEOUT_MS,
}: UseAIFlowPropsType<T>): UseAIFlowResultType<T> {
    const { user } = useAuth()
    const [createExecutionAIFlowMutation] = useCreateExecutionAiFlowTaskMutation()
    const [getExecutionAiFlowTaskById] = useGetExecutionAiFlowTaskByIdLazyQuery()

    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<T | null>(null)
    const [error, setError] = useState<Error | null>(null)

    const getAIFlowResult = useCallback(async ({ context = {} }): Promise<{ data: T, error: object, localizedErrorText: string }> => {
        if (!user?.id) {
            const err = new Error('User is not authenticated')
            setError(err)
            return { data: null, error: err, localizedErrorText: null }
        }

        setLoading(true)
        setError(null)
        setData(null)

        const fullContext = { ...defaultContext, ...context }

        try {
            const createResult = await createExecutionAIFlowMutation({
                variables: {
                    data: {
                        dv: 1,
                        sender: getClientSideSenderInfo(),
                        flowType,
                        context: fullContext,
                        user: { connect: { id: user.id } },
                    },
                },
            })

            const taskId = createResult.data?.task?.id
            if (!taskId) { return { data: null, error: new Error('Failed to create a task'), localizedErrorText: null } }

            await new Promise(resolve => setTimeout(resolve, TASK_FIRST_POLL_TIMEOUT_MS))

            const startTime = Date.now()

            while (Date.now() - startTime < timeout) {
                const pollResult = await getExecutionAiFlowTaskById({
                    variables: { id: taskId },
                    fetchPolicy: 'no-cache',
                })

                const [task] = pollResult.data.task
                if (!task) { return { data: null, error: new Error('Task not found'), localizedErrorText: null } }

                if (task.status === TASK_STATUSES.COMPLETED) {
                    const result = task.result as T
                    setData(result)
                    return { data: result, error: null, localizedErrorText: null }
                } else if (task.status === TASK_STATUSES.ERROR || task.status === TASK_STATUSES.CANCELLED) {
                    return { data: null, error: new Error(`Task in ${task.status} state`), localizedErrorText: task.errorMessage || null }
                }

                await new Promise(resolve => setTimeout(resolve, TASK_POLLING_INTERVAL_MS))
            }

            setError(new Error('Flow timed out'))
            return { data: null, error: new Error('Flow timed out'), localizedErrorText: null }
        } catch (err: any) {
            const wrappedErr = err instanceof Error ? err : new Error(err.toString())
            setError(wrappedErr)
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
    ])

    return [getAIFlowResult, { loading, data, error }]
}

export function useAIConfig () {
    const { publicRuntimeConfig: { aiEnabled } } = getConfig()
    const { useFlag } = useFeatureFlags()

    const rewriteTicketComment = useFlag('ui-ai-ticket-rewrite-comment')
    const rewriteText = useFlag('ui-ai-rewrite-text')
    const rewriteNewsText = useFlag('ui-ai-news-rewrite-text')

    return {
        enabled: aiEnabled,
        features: {
            rewriteTicketComment,
            rewriteText,
            rewriteNewsText,
        },
    }
}