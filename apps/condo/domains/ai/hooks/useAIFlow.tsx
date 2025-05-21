import { useCallback } from 'react'

import { getClientSideSenderInfo } from '@open-condo/codegen/utils/userId'
import { useAuth } from '@open-condo/next/auth'

import {
    useCreateExecutionAiFlowTaskMutation,
    useGetExecutionAiFlowTaskByIdLazyQuery,
} from '../../../gql'

type UseAIFlowPropsType = {
    flowType: string
    defaultContext: object
    timeout?: number
}

type RunFlowResultType = {
    result: object | null
    isError: boolean
    errorMessage: string
}

export function isAIEnabled () {
    return true
}

export function useAIFlow ({ flowType, defaultContext = {}, timeout = 10000 }: UseAIFlowPropsType): [(context: object) => Promise<RunFlowResultType>] {
    const [createExecutionAIFlowMutation] = useCreateExecutionAiFlowTaskMutation()
    const [getExecutionAiFlowTaskById] = useGetExecutionAiFlowTaskByIdLazyQuery()

    const { user } = useAuth()

    const runAIFlow = useCallback(async (context: object): Promise<RunFlowResultType> => {
        let isError = false
        let result: object | null = null
        let errorMessage = ''

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

            console.log(taskId)

            if (!taskId) throw new Error('Failed to create task')

            const startTime = Date.now()

            const timeoutIsNotPassed = Date.now() - startTime < timeout

            while (timeoutIsNotPassed) {
                console.log(`Running Poll: ${timeoutIsNotPassed}`)

                const pollResult = await getExecutionAiFlowTaskById({
                    variables: { id: taskId },
                    fetchPolicy: 'no-cache',
                })

                const [task] = pollResult.data.task

                if (!task) {
                    throw new Error('Task does not exist or it was deleted')
                }

                if (task.status === 'completed') {
                    result = task.result ? JSON.parse(task.result) : null
                    break
                }

                if (task.status === 'error') {
                    throw new Error(`Task failed to complete, ${task.errorMessage}`)
                }

                if (task.status === 'cancelled') {
                    throw new Error(`Task was cancelled`)
                }

                if (task.status === 'processing') {
                    await new Promise(resolve => setTimeout(resolve, 1000))
                }

                throw new Error('Unknown status!')
            }
        } catch (err) {
            isError = true
            errorMessage = err.toString()
        }

        return { result, isError, errorMessage }
    }, [flowType, timeout, createExecutionAIFlowMutation, getExecutionAiFlowTaskById])

    return [runAIFlow]
}
