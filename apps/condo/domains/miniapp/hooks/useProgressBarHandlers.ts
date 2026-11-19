import dayjs from 'dayjs'
import get from 'lodash/get'
import pickBy from 'lodash/pickBy'
import { useCallback, useEffect, useRef } from 'react'
import { z } from 'zod'

import type { ShowProgressBarParams, ShowProgressBarData, UpdateProgressBarParams, UpdateProgressBarData, GetActiveProgressBarsParams, GetActiveProgressBarsData } from '@open-condo/bridge'
import { generateUUIDv4 } from '@open-condo/miniapp-utils'
import { IFRAME_METADATA_SCHEMA } from '@open-condo/miniapp-utils/helpers/iframe'
import { usePostMessageContext, zodSchemaToValidator } from '@open-condo/miniapp-utils/helpers/messaging'
import { isSafeUrl } from '@open-condo/miniapp-utils/helpers/urls'
import { useAuth } from '@open-condo/next/auth'

import { useTasks } from '@condo/domains/common/components/tasks/TasksContextProvider'
import { TASK_PROCESSING_STATUS, TASK_COMPLETED_STATUS } from '@condo/domains/common/constants/tasks'
import { MiniAppTaskRecord, useMiniappTaskUIInterface } from '@condo/domains/common/hooks/useMiniappTaskUIInterface'

type ShowProgressBarParamsValidator = (
    params: unknown
) => { success: true, data: ShowProgressBarParams } | { success: false, error: string }

type MessageSource = Parameters<
Parameters<ReturnType<typeof usePostMessageContext>['addHandler']>[4]
>[0]['source']

type ProgressBarAction = NonNullable<ShowProgressBarParams['actions']>[number]
type ProgressBarActionData = NonNullable<GetActiveProgressBarsData['bars'][number]['actions']>[number]

const MAX_PROGRESS_BAR_ACTIONS = 1

const ProgressBarActionSchema = z.strictObject({
    label: z.string().min(1),
})

const ShowProgressBarParamsSchema = z.object({
    message: z.string(),
    description: z.string().optional(),
    externalTaskId: z.string().optional(),
    processingFrame: z.strictObject({
        url: z.url(),
    }).optional(),
    actions: z.array(ProgressBarActionSchema).max(MAX_PROGRESS_BAR_ACTIONS).optional(),
})
const UpdateProgressBarParamsSchema = z.object({
    barId: z.string(),
    data: z.strictObject({
        message: z.string(),
        description: z.string(),
        progress: z.number().min(0).max(100),
        status: z.enum(['completed', 'error']),
        actions: z.array(ProgressBarActionSchema).max(MAX_PROGRESS_BAR_ACTIONS),
    }).partial(),
})

function getSourceOrigin (source: MessageSource) {
    return new URL(source.type === 'frame' ? source.ref.src : window.location.href).origin
}

function getSourceMetadata (source: MessageSource) {
    if (source.type !== 'frame') return undefined

    const { success, data } = IFRAME_METADATA_SCHEMA.safeParse(source.metadata)
    return success ? data : undefined
}

function hasAllowedProgressBarUrlProtocol (url: string) {
    const { protocol } = new URL(url)
    return protocol === 'http:' || protocol === 'https:'
}

function validateProgressBarUrl (url: string, sourceOrigin: string) {
    if (!isSafeUrl(url) || !hasAllowedProgressBarUrlProtocol(url)) {
        throw new Error('Forbidden url. Your progress bar processing frame url is probably injected')
    }
    if (new URL(url).origin !== sourceOrigin) {
        throw new Error('Forbidden url. Progress bar processing frame url must have same origin as sender')
    }
}

function validateProgressBarProcessingFrame (
    processingFrame: ShowProgressBarParams['processingFrame'],
    source: MessageSource,
    sourceOrigin: string,
) {
    if (!processingFrame) return

    validateProgressBarUrl(processingFrame.url, sourceOrigin)
    if (source.type !== 'frame') {
        throw new Error('Forbidden source type. Progress bar processing frames are only available for iframes')
    }
}

function validateProgressBarShowParams (
    params: Pick<ShowProgressBarParams, 'actions' | 'processingFrame'>,
    source: MessageSource,
) {
    const sourceOrigin = getSourceOrigin(source)
    if (sourceOrigin === 'null' && (params.processingFrame || params.actions?.length)) {
        throw new Error('Forbidden origin. Progress bar processing frames require a non-opaque sender origin')
    }
    if (params.actions?.length && !params.processingFrame) {
        throw new Error('Progress bar processing frame is required when actions are set')
    }

    validateProgressBarProcessingFrame(params.processingFrame, source, sourceOrigin)
}

function createProgressBarActions (actions?: Array<ProgressBarAction>): Array<ProgressBarActionData> {
    return actions?.map((action) => ({ ...action, id: generateUUIDv4() })) || []
}

export function useProgressBarHandlers () {
    const { user } = useAuth()
    const { addTask, tasks, updateTask } = useTasks<MiniAppTaskRecord>()
    const { MiniAppTask: miniAppTaskUIInterface } = useMiniappTaskUIInterface()

    const userId = get(user, 'id', null)
    const { addHandler } = usePostMessageContext()

    const createTaskOp = miniAppTaskUIInterface.storage.useCreateTask({}, (record) => {
        addTask({
            ...miniAppTaskUIInterface,
            record,
        })
    })

    const showProgressBar = useCallback(({
        message,
        description,
        externalTaskId,
        processingFrame,
        actions,
    }: ShowProgressBarParams,
    source: MessageSource) => {
        validateProgressBarShowParams({ actions, processingFrame }, source)
        const id = generateUUIDv4()
        const resolvedActions = createProgressBarActions(actions)
        const origin = getSourceOrigin(source)
        const sourceMetadata = getSourceMetadata(source)
        const taskRecord: MiniAppTaskRecord = {
            id,
            taskId: externalTaskId,
            title: message,
            description,
            progress: 0,
            status: TASK_PROCESSING_STATUS,
            user: { id: userId },
            sender: origin,
            createdAt: dayjs().toISOString(),
            __typename: 'MiniAppTask',
            ...(sourceMetadata ? { sourceMetadata } : {}),
            ...(processingFrame ? { processingFrame } : {}),
            ...(resolvedActions.length ? { actions: resolvedActions } : {}),
        }

        createTaskOp(taskRecord)

        return { barId: id, actionIds: resolvedActions.map((action) => action.id) }
        // TODO(DOMA-5171): Adding miniAppTaskUIInterface in deps causing rerender hell!
    }, [userId, createTaskOp])

    const getActiveProgressBars = useCallback((origin: string) => {
        return {
            bars: tasks
                .map(task => task.record)
                .filter(task => task &&
                    task.sender === origin &&
                    task.user?.id === userId &&
                    task.status === TASK_PROCESSING_STATUS &&
                    typeof task.progress === 'number'
                )
                .map(task => ({
                    id: task.id,
                    message: task.title,
                    description: task.description,
                    progress: task.progress as number,
                    externalTaskId: task.taskId,
                    ...(task.actions?.length ? {
                        actions: task.actions,
                    } : {}),
                })),
        }
    }, [userId, tasks])

    const updateTaskOperation = miniAppTaskUIInterface.storage.useUpdateTask({}, (record) => {
        updateTask(record)
    })

    const updateProgressBar = useCallback(({ barId, data }: UpdateProgressBarParams, source: MessageSource) => {
        const origin = getSourceOrigin(source)
        const { record: existingTask } = miniAppTaskUIInterface.storage.useTask(barId)
        if (!existingTask || existingTask.sender !== origin || existingTask.user?.id !== userId) {
            throw new Error('Forbidden progress bar update')
        }
        if (data.actions?.length && !existingTask.processingFrame) {
            throw new Error('Progress bar processing frame is required when actions are set')
        }
        const resolvedActions = createProgressBarActions(data.actions)
        const status = data.status
            ? data.status
            : (typeof data.progress === 'number' && data.progress >= 100 ? TASK_COMPLETED_STATUS : undefined)
        const taskRecord: Partial<MiniAppTaskRecord> = {
            id: barId,
            title: data.message,
            description: data.description,
            progress: data.progress,
            status,
            user: { id: userId },
            sender: origin,
            __typename: 'MiniAppTask',
            ...(data.actions ? { actions: resolvedActions } : {}),
        }

        updateTaskOperation(pickBy(taskRecord, value => value !== undefined), { id: barId })

        return { updated: true, actionIds: resolvedActions.map((action) => action.id) }
        // TODO(DOMA-5171): Adding miniAppTaskUIInterface in deps causing rerender hell!
    }, [miniAppTaskUIInterface.storage, userId, updateTaskOperation])

    const showProgressBarRef = useRef(showProgressBar)
    const updateProgressBarRef = useRef(updateProgressBar)
    const getActiveProgressBarsRef = useRef(getActiveProgressBars)

    useEffect(() => {
        showProgressBarRef.current = showProgressBar
    }, [showProgressBar])

    useEffect(() => {
        updateProgressBarRef.current = updateProgressBar
    }, [updateProgressBar])

    useEffect(() => {
        getActiveProgressBarsRef.current = getActiveProgressBars
    }, [getActiveProgressBars])

    useEffect(() => {
        addHandler<ShowProgressBarParams, ShowProgressBarData>(
            'condo-bridge',
            'CondoWebAppShowProgressBar',
            '*',
            zodSchemaToValidator(ShowProgressBarParamsSchema) as ShowProgressBarParamsValidator,
            ({ params, source }) => {
                return showProgressBarRef.current(params, source)
            }
        )

        addHandler<UpdateProgressBarParams, UpdateProgressBarData>(
            'condo-bridge',
            'CondoWebAppUpdateProgressBar',
            '*',
            zodSchemaToValidator(UpdateProgressBarParamsSchema),
            ({ params, source }) => {
                return updateProgressBarRef.current(params, source)
            }
        )

        addHandler<GetActiveProgressBarsParams, GetActiveProgressBarsData>(
            'condo-bridge',
            'CondoWebAppGetActiveProgressBars',
            '*',
            zodSchemaToValidator(z.strictObject({})),
            ({ source }) => {
                const sourceOrigin = new URL(source.type === 'frame' ? source.ref.src : window.location.href).origin
                return getActiveProgressBarsRef.current(sourceOrigin)
            }
        )
    }, [addHandler])
}
