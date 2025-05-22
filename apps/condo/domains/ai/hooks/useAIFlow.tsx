import { useState, useCallback, useEffect } from 'react'

import { getClientSideSenderInfo } from '@open-condo/codegen/utils/userId'
import { useAuth } from '@open-condo/next/auth'

import {
    useCreateExecutionAiFlowTaskMutation,
    useGetExecutionAiFlowTaskByIdLazyQuery,
} from '../../../gql'

type UseAIFlowPropsType = {
    flowType: string
    defaultContext?: object
    timeout?: number
}

type UseAIFlowResultType = [
    (params?: { context?: object }) => Promise<{ data: object, error: object, localizedErrorText: string } | null>,
    {
        loading: boolean
        data: object | null
        error: Error | null
        cancel: () => void
    },
]

export function useAIFlow ({
    flowType,
    defaultContext = {},
    timeout = 10000,
}: UseAIFlowPropsType): UseAIFlowResultType {
    const { user } = useAuth()
    const [createExecutionAIFlowMutation] = useCreateExecutionAiFlowTaskMutation()
    const [getExecutionAiFlowTaskById] = useGetExecutionAiFlowTaskByIdLazyQuery()

    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<object | null>(null)
    const [error, setError] = useState<Error | null>(null)
    const [cancelled, setCancelled] = useState(false)

    const cancel = useCallback(() => {
        setCancelled(true)
    }, [])

    useEffect(() => {
        console.log(data)
    }, [data])

    const getAIFlowResult = useCallback(async ({ context = {} }): Promise<{ data: object, error: object, localizedErrorText: string } | null> => {
        if (!user?.id) {
            const err = new Error('User is not authenticated')
            setError(err)
            return null
        }

        setLoading(true)
        setCancelled(false)
        setError(null)
        setData(null)

        const fullContext = { ...defaultContext, ...context }

        try {
            console.log('Running AI Flow: ', fullContext)

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
            if (!taskId) throw new Error('Failed to create task')

            await new Promise(resolve => setTimeout(resolve, 500))

            const startTime = Date.now()

            while (Date.now() - startTime < timeout) {
                if (cancelled) throw new Error('AI flow was cancelled by user')

                const pollResult = await getExecutionAiFlowTaskById({
                    variables: { id: taskId },
                    fetchPolicy: 'no-cache',
                })

                const [task] = pollResult.data.task
                if (!task) throw new Error('Task not found')

                if (task.status === 'completed') {
                    const result = task.result
                    setData(result)
                    return { data: result, error: null, localizedErrorText: null }
                } else if (task.status === 'error') {
                    throw new Error(`Task failed: ${task.errorMessage || 'Unknown error'}`)
                } else if (task.status === 'cancelled') {
                    throw new Error('Task was cancelled on server')
                }

                await new Promise(resolve => setTimeout(resolve, 1000))
            }

            throw new Error('AI flow timed out')
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
        cancelled,
    ])

    return [getAIFlowResult, { loading, data, error, cancel }]
}

export function useAIConfig () {
    return {
        enabled: true,
    }
}