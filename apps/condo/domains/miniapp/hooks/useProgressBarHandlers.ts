import dayjs from 'dayjs'
import get from 'lodash/get'
import pickBy from 'lodash/pickBy'
import { useCallback, useEffect } from 'react'
import { z } from 'zod'

import type { ShowProgressBarParams, ShowProgressBarData, UpdateProgressBarParams, UpdateProgressBarData, GetActiveProgressBarsParams, GetActiveProgressBarsData } from '@open-condo/bridge'
import { generateUUIDv4 } from '@open-condo/miniapp-utils'
import { usePostMessageContext, zodSchemaToValidator } from '@open-condo/miniapp-utils/helpers/messaging'
import { useAuth } from '@open-condo/next/auth'

import { useTasks } from '@condo/domains/common/components/tasks/TasksContextProvider'
import { TASK_PROCESSING_STATUS, TASK_COMPLETED_STATUS } from '@condo/domains/common/constants/tasks'
import { useMiniappTaskUIInterface } from '@condo/domains/common/hooks/useMiniappTaskUIInterface'

const ShowProgressBarParamsSchema = z.object({
    message: z.string(),
    description: z.string().optional(),
    externalTaskId: z.string().optional(),
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
    }: ShowProgressBarParams,
    origin: string) => {
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
    }, [userId])

    const getActiveProgressBars = useCallback((origin: string) => {
        return {
            bars: tasks
                .map(task => task.record)
                .filter(task => task.sender === origin &&
                    task.user && task.user && task.user.id === userId &&
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
    }, [userId])

    useEffect(() => {
        addHandler<ShowProgressBarParams, ShowProgressBarData>(
            'condo-bridge',
            'CondoWebAppShowProgressBar',
            '*',
            zodSchemaToValidator(ShowProgressBarParamsSchema),
            ({ params, source }) => {
                const sourceOrigin = new URL(source.type === 'frame' ? source.ref.src : window.location.href).origin

                return showProgressBar(params, sourceOrigin)
            }
        )

        addHandler<UpdateProgressBarParams, UpdateProgressBarData>(
            'condo-bridge',
            'CondoWebAppUpdateProgressBar',
            '*',
            zodSchemaToValidator(UpdateProgressBarParamsSchema),
            ({ params, source }) => {
                const sourceOrigin = new URL(source.type === 'frame' ? source.ref.src : window.location.href).origin

                return updateProgressBar(params, sourceOrigin)
            }
        )

        addHandler<GetActiveProgressBarsParams, GetActiveProgressBarsData>(
            'condo-bridge',
            'CondoWebAppGetActiveProgressBars',
            '*',
            zodSchemaToValidator(z.strictObject({})),
            ({ source }) => {
                const sourceOrigin = new URL(source.type === 'frame' ? source.ref.src : window.location.href).origin
                return getActiveProgressBars(sourceOrigin)
            }
        )
    }, [addHandler, getActiveProgressBars, showProgressBar, updateProgressBar])
}