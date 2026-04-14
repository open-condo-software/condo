import { useApolloClient } from '@apollo/client'
import { useCallback, useRef, useState } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'

import {
    GET_DEBT_CLAIM_GENERATION_TASKS_QUERY,
    CREATE_DEBT_CLAIM_GENERATION_TASK_MUTATION,
} from '@condo/domains/billing/gql'

const POLL_INTERVAL_MS = 2000
const TASK_COMPLETED_STATUS = 'completed'
const TASK_ERROR_STATUS = 'error'

export type DebtClaimTaskMeta = {
    successCount?: number
    failedCount?: number
    totalAmount?: number
    error?: string
}

export type DebtClaimTaskStatus = 'idle' | 'processing' | 'completed' | 'error'

type UseDebtClaimGenerationArgs = {
    organizationId: string
    userId: string
}

type UseDebtClaimGenerationResult = {
    status: DebtClaimTaskStatus
    progress: number
    meta: DebtClaimTaskMeta | null
    resultFileUrl: string | null
    resultFileName: string | null
    errorFileUrl: string | null
    errorFileName: string | null
    generateClaims: (file: File) => Promise<void>
    reset: () => void
}

export function useDebtClaimGeneration ({ organizationId, userId }: UseDebtClaimGenerationArgs): UseDebtClaimGenerationResult {
    const client = useApolloClient()

    const [status, setStatus] = useState<DebtClaimTaskStatus>('idle')
    const [progress, setProgress] = useState(0)
    const [meta, setMeta] = useState<DebtClaimTaskMeta | null>(null)
    const [resultFileUrl, setResultFileUrl] = useState<string | null>(null)
    const [resultFileName, setResultFileName] = useState<string | null>(null)
    const [errorFileUrl, setErrorFileUrl] = useState<string | null>(null)
    const [errorFileName, setErrorFileName] = useState<string | null>(null)

    const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const taskIdRef = useRef<string | null>(null)

    const stopPolling = useCallback(() => {
        if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current)
            pollTimerRef.current = null
        }
    }, [])

    const pollTask = useCallback(async () => {
        const taskId = taskIdRef.current
        if (!taskId) return

        try {
            const { data } = await client.query({
                query: GET_DEBT_CLAIM_GENERATION_TASKS_QUERY,
                variables: { where: { id: taskId }, first: 1 },
                fetchPolicy: 'network-only',
            })

            const task = data?.tasks?.[0]
            if (!task) return

            setProgress(task.progress || 0)

            if (task.status === TASK_COMPLETED_STATUS) {
                stopPolling()
                setMeta(task.meta || null)
                setResultFileUrl(task.resultFile?.publicUrl || null)
                setResultFileName(task.resultFile?.originalFilename || null)
                setErrorFileUrl(task.errorFile?.publicUrl || null)
                setErrorFileName(task.errorFile?.originalFilename || null)
                setStatus(task.meta?.failedCount > 0 ? 'completed' : 'completed')
            } else if (task.status === TASK_ERROR_STATUS) {
                stopPolling()
                setMeta(task.meta || null)
                setStatus('error')
            }
        } catch (err) {
            stopPolling()
            setStatus('error')
        }
    }, [client, stopPolling])

    const generateClaims = useCallback(async (file: File) => {
        setStatus('processing')
        setProgress(0)
        setMeta(null)
        setResultFileUrl(null)
        setResultFileName(null)
        setErrorFileUrl(null)
        setErrorFileName(null)
        taskIdRef.current = null
        stopPolling()

        try {
            const { data } = await client.mutate({
                mutation: CREATE_DEBT_CLAIM_GENERATION_TASK_MUTATION,
                variables: {
                    data: {
                        dv: 1,
                        sender: getClientSideSenderInfo(),
                        organization: { connect: { id: organizationId } },
                        user: { connect: { id: userId } },
                        debtorsFile: file,
                    },
                },
            })

            const taskId = data?.task?.id
            if (!taskId) throw new Error('No task id returned')

            taskIdRef.current = taskId
            pollTimerRef.current = setInterval(pollTask, POLL_INTERVAL_MS)
        } catch (err) {
            setStatus('error')
            setMeta({ error: err?.message || 'Unknown error' })
        }
    }, [client, organizationId, userId, pollTask, stopPolling])

    const reset = useCallback(() => {
        stopPolling()
        taskIdRef.current = null
        setStatus('idle')
        setProgress(0)
        setMeta(null)
        setResultFileUrl(null)
        setResultFileName(null)
        setErrorFileUrl(null)
        setErrorFileName(null)
    }, [stopPolling])

    return {
        status,
        progress,
        meta,
        resultFileUrl,
        resultFileName,
        errorFileUrl,
        errorFileName,
        generateClaims,
        reset,
    }
}
