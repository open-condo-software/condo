import dayjs from 'dayjs'
import get from 'lodash/get'
import pickBy from 'lodash/pickBy'
import { useCallback, useEffect, useRef } from 'react'
import { z } from 'zod'

import type { ShowProgressBarParams, ShowProgressBarData, TrackableCondoTaskSchemaName, UpdateProgressBarParams, UpdateProgressBarData, GetActiveProgressBarsParams, GetActiveProgressBarsData } from '@open-condo/bridge'
import { generateUUIDv4 } from '@open-condo/miniapp-utils'
import { usePostMessageContext, zodSchemaToValidator } from '@open-condo/miniapp-utils/helpers/messaging'
import { useAuth } from '@open-condo/next/auth'

import { useTasks } from '@condo/domains/common/components/tasks/TasksContextProvider'
import { TASK_PROCESSING_STATUS, TASK_COMPLETED_STATUS } from '@condo/domains/common/constants/tasks'
import { useMiniappTaskUIInterface } from '@condo/domains/common/hooks/useMiniappTaskUIInterface'
import { useNewsItemRecipientsExportTaskUIInterface } from '@condo/domains/news/hooks/useNewsItemRecipientsExportTaskUIInterface'

const TRACKABLE_CONDO_TASK_SCHEMA_NAMES = new Set<TrackableCondoTaskSchemaName>(['NewsItemRecipientsExportTask'])

type ShowProgressBarParamsValidator = (
    params: unknown
) => { success: true, data: ShowProgressBarParams } | { success: false, error: string }

const ShowProgressBarParamsSchema = z.object({
    message: z.string(),
    description: z.string().optional(),
    externalTaskId: z.string().optional(),
    // string, not enum: unknown names must not fail the whole method (fall back to MiniAppTask)
    schemaName: z.string().optional(),
})
const UpdateProgressBarParamsSchema = z.object({
    barId: z.string(),
    data: z.strictObject({
        message: z.string(),
        description: z.string(),
        progress: z.number().min(0).max(100),
        status: z.enum(['completed', 'error']),
    }).partial(),
})

export function useProgressBarHandlers () {
    const { user } = useAuth()
    const { addTask, tasks, updateTask } = useTasks()
    const { MiniAppTask: miniAppTaskUIInterface } = useMiniappTaskUIInterface()
    const { NewsItemRecipientsExportTask: newsItemRecipientsExportTaskUIInterface } = useNewsItemRecipientsExportTaskUIInterface()

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
        schemaName,
    }: ShowProgressBarParams,
    origin: string) => {
        if (schemaName && externalTaskId && TRACKABLE_CONDO_TASK_SCHEMA_NAMES.has(schemaName)) {
            addTask({
                ...newsItemRecipientsExportTaskUIInterface,
                record: {
                    id: externalTaskId,
                    status: TASK_PROCESSING_STATUS as 'processing',
                    __typename: 'NewsItemRecipientsExportTask',
                },
            })

            return { barId: externalTaskId }
        }

        const id = generateUUIDv4()
        const taskRecord = {
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
        }

        createTaskOp(taskRecord)

        return { barId: id }
        // TODO(DOMA-5171): Adding miniAppTaskUIInterface in deps causing rerender hell!
    }, [userId, addTask, newsItemRecipientsExportTaskUIInterface, createTaskOp])

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
                })),
        }
    }, [userId, tasks])

    const updateTaskOperation = miniAppTaskUIInterface.storage.useUpdateTask({}, (record) => {
        updateTask(record)
    })

    const updateProgressBar = useCallback(({ barId, data }: UpdateProgressBarParams, origin: string) => {
        const taskRecord = {
            id: barId,
            title: data.message,
            description: data.description,
            progress: data.progress,
            status: data.status
                ? data.status
                : (data.progress !== undefined && data.progress >= 100 ? TASK_COMPLETED_STATUS : undefined),
            user: { id: userId },
            sender: origin,
            __typename: 'MiniAppTask',
        }

        updateTaskOperation(pickBy(taskRecord, value => value !== undefined), { id: barId })

        return { updated: true }
        // TODO(DOMA-5171): Adding miniAppTaskUIInterface in deps causing rerender hell!
    }, [userId, updateTaskOperation])

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
                const sourceOrigin = new URL(source.type === 'frame' ? source.ref.src : window.location.href).origin

                return showProgressBarRef.current(params, sourceOrigin)
            }
        )

        addHandler<UpdateProgressBarParams, UpdateProgressBarData>(
            'condo-bridge',
            'CondoWebAppUpdateProgressBar',
            '*',
            zodSchemaToValidator(UpdateProgressBarParamsSchema),
            ({ params, source }) => {
                const sourceOrigin = new URL(source.type === 'frame' ? source.ref.src : window.location.href).origin

                return updateProgressBarRef.current(params, sourceOrigin)
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