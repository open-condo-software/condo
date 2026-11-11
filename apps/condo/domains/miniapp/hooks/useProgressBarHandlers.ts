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

const ProgressBarActionSchema = z.discriminatedUnion('type', [
    z.strictObject({
        type: z.literal('link'),
        label: z.string().min(1),
        url: z.url(),
    }),
    z.strictObject({
        type: z.literal('modal'),
        label: z.string().min(1),
        modal: z.strictObject({
            title: z.string().min(1),
            url: z.url(),
            size: z.enum(['big', 'small']).optional(),
            initialHeight: z.number().optional(),
        }),
    }),
])

const ShowProgressBarParamsSchema = z.object({
    message: z.string(),
    description: z.string().optional(),
    externalTaskId: z.string().optional(),
    disableCancel: z.boolean().optional(),
    background: z.strictObject({
        url: z.url(),
    }).optional(),
    action: ProgressBarActionSchema.optional(),
})
const UpdateProgressBarParamsSchema = z.object({
    barId: z.string(),
    data: z.strictObject({
        message: z.string(),
        description: z.string(),
        progress: z.number().min(0).max(100),
        disableCancel: z.boolean(),
        status: z.enum(['completed', 'error']),
        action: ProgressBarActionSchema,
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

function validateProgressBarUrls (
    params: Pick<ShowProgressBarParams, 'action' | 'background'>,
    source: MessageSource,
) {
    const sourceOrigin = getSourceOrigin(source)

    if (params.background) {
        if (!isSafeUrl(params.background.url)) {
            throw new Error('Forbidden url. Your progress bar background url is probably injected')
        }
        if (source.type !== 'frame') {
            throw new Error('Forbidden source type. Progress bar backgrounds are only available for iframes')
        }
        if (new URL(params.background.url).origin !== sourceOrigin) {
            throw new Error('Forbidden url. Progress bar background url must have same origin as sender')
        }
    }

    if (params.action) {
        const actionUrl = params.action.type === 'modal' ? params.action.modal.url : params.action.url
        if (!isSafeUrl(actionUrl)) {
            throw new Error('Forbidden url. Your progress bar action url is probably injected')
        }
        if (source.type === 'worker') {
            throw new Error('Forbidden source type. Progress bar actions are not available for service workers')
        }
        if (new URL(actionUrl).origin !== sourceOrigin) {
            throw new Error('Forbidden url. Progress bar action url must have same origin as sender')
        }
    }
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
        disableCancel,
        background,
        action,
    }: ShowProgressBarParams,
    source: MessageSource) => {
        validateProgressBarUrls({ action, background }, source)
        const id = generateUUIDv4()
        const origin = getSourceOrigin(source)
        const sourceMetadata = getSourceMetadata(source)
        const taskRecord: MiniAppTaskRecord = {
            id,
            taskId: externalTaskId,
            title: message,
            description,
            progress: 0,
            ...(disableCancel ? { disableCancel } : {}),
            status: TASK_PROCESSING_STATUS,
            user: { id: userId },
            sender: origin,
            createdAt: dayjs().toISOString(),
            __typename: 'MiniAppTask',
            ...(sourceMetadata ? { sourceMetadata } : {}),
            ...(background ? { background } : {}),
            ...(action ? { action } : {}),
        }

        createTaskOp(taskRecord)

        return { barId: id }
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
                    ...(task.action ? {
                        action: task.action,
                    } : {}),
                    ...(task.disableCancel ? {
                        disableCancel: true,
                    } : {}),
                })),
        }
    }, [userId, tasks])

    const updateTaskOperation = miniAppTaskUIInterface.storage.useUpdateTask({}, (record) => {
        updateTask(record)
    })

    const updateProgressBar = useCallback(({ barId, data }: UpdateProgressBarParams, source: MessageSource) => {
        validateProgressBarUrls({ action: data.action }, source)
        const origin = getSourceOrigin(source)
        const { record: existingTask } = miniAppTaskUIInterface.storage.useTask(barId)
        if (!existingTask || existingTask.sender !== origin || existingTask.user?.id !== userId) {
            throw new Error('Forbidden progress bar update')
        }
        const status = data.status
            ? data.status
            : (typeof data.progress === 'number' && data.progress >= 100 ? TASK_COMPLETED_STATUS : undefined)
        const taskRecord: Partial<MiniAppTaskRecord> = {
            id: barId,
            title: data.message,
            description: data.description,
            progress: data.progress,
            disableCancel: data.disableCancel,
            status,
            user: { id: userId },
            sender: origin,
            __typename: 'MiniAppTask',
            ...(data.action ? { action: data.action } : {}),
        }

        updateTaskOperation(pickBy(taskRecord, value => value !== undefined), { id: barId })

        return { updated: true }
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
