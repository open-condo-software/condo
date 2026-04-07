import { useCreateExecutionAiFlowTaskMutation } from '@app/condo/gql'
import { ExecutionAiFlowTask } from '@app/condo/schema'
import getConfig from 'next/config'
import { useCallback, useMemo, useState } from 'react'

import { useMessagingChannels, useMessagingConnection, useMessagingSubscription } from '@open-condo/messaging/hooks'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'


type UseAIFlowStreamPropsType = {
    flowType: string
    flowStage?: string
    itemId?: string
    modelName?: string
    defaultContext?: object
    timeout?: number
    onChunk: (message: StreamMessageType) => void
}

type UseAIFlowResult<T> = {
    status: ExecutionAiFlowTask['status']
    aiSessionId: ExecutionAiFlowTask['aiSessionId']
    errorMessage?: ExecutionAiFlowTask['errorMessage']
    result: T
}

type StreamMessageType = {
    type: 'task_start' | 'flow_start' | 'flow_item' | 'flow_end' | 'flow_error' | 'task_end' | 'task_error'
    item?: string
    meta?: object
    error?: string
}

type ExecuteAIFlowStreamParamsType = {
    context?: object
}

type UseAIFlowStreamResultType<T> = [
    (params?: ExecuteAIFlowStreamParamsType) => Promise<{ data: UseAIFlowResult<T>, error: object, localizedErrorText: string } | null>,
    {
        loading: boolean
        data: UseAIFlowResult<T> | null
        error: Error | null
        currentTaskId: string | null
        isRealtimeReady: boolean
    },
]

const DEFAULT_TIMEOUT_MS = 10000
const USER_CHANNEL_NAME = 'user'

export function useAIFlowStream<T = object> ({
    flowType,
    flowStage,
    modelName,
    itemId,
    defaultContext = {},
    onChunk,
    timeout = DEFAULT_TIMEOUT_MS,
}: UseAIFlowStreamPropsType): UseAIFlowStreamResultType<T> {
    const { user } = useAuth()
    const { organization } = useOrganization()
    const { publicRuntimeConfig: { messagingWsUrl } } = getConfig()

    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<UseAIFlowResult<T> | null>(null)
    const [error, setError] = useState<Error | null>(null)
    const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)

    const [createExecutionAIFlowMutation] = useCreateExecutionAiFlowTaskMutation()

    const { connection, isConnected, userId } = useMessagingConnection({
        enabled: !!user?.id,
        autoConnect: true,
        wsUrl: messagingWsUrl,
    })
    
    const { channels } = useMessagingChannels({ enabled: !!user?.id })
    
    const streamTopic = useMemo(() => {
        const userChannel = channels.find(channel => channel.name === USER_CHANNEL_NAME)
        const topic = (userChannel?.topicPrefix && currentTaskId) ? `${userChannel.topicPrefix}.executionAIFlowTask.${currentTaskId}` : null
        console.log('streamTopic', topic)
        return topic
    }, [channels, currentTaskId])

    useMessagingSubscription<StreamMessageType>({
        topic: streamTopic,
        connection,
        isConnected,
        userId,
        enabled: !!streamTopic && !!user?.id && isConnected && !!currentTaskId,
        onMessage: async (message) => {
            onChunk(message)
        },
    })

    const getAIFlowStreamResult = useCallback(async ({
        context = {},
    }: ExecuteAIFlowStreamParamsType = {}): Promise<{ data: UseAIFlowResult<T>, error: object, localizedErrorText: string }> => {
        if (!user?.id) {
            const err = new Error('User is not authenticated')
            setError(err)
            return { data: null, error: err, localizedErrorText: null }
        }

        const isRealtimeReady = !!(streamTopic && isConnected && connection) 
        if (!isRealtimeReady) {
            console.error('Not connected to the realtime server', isRealtimeReady)
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
                        flowStage,
                        modelName,
                        itemId,
                        organization: { connect: { id: organization.id } },
                        context: fullContext,
                        user: { connect: { id: user.id } },
                    },
                },
            })

            const taskId = createResult.data?.task?.id
            if (!taskId) {
                const createError = new Error('Failed to create a task')
                setError(createError)
                setLoading(false)
                return { data: null, error: createError, localizedErrorText: null }
            }

            setCurrentTaskId(taskId)
        } catch (err: unknown) {
            const wrappedErr = err instanceof Error ? err : new Error(String(err))
            setError(wrappedErr)
            setCurrentTaskId(null)
            setLoading(false)
            return { data: null, error: wrappedErr, localizedErrorText: null }
        }
    }, [
        streamTopic,
        isConnected,
        connection,
        createExecutionAIFlowMutation,
        defaultContext,
        flowType,
        itemId,
        modelName,
        organization?.id,
        user?.id,
    ])

    return [
        getAIFlowStreamResult,
        {
            loading,
            data,
            error,
            currentTaskId,
            isRealtimeReady: !!(streamTopic && isConnected && connection),
        },
    ]
}
