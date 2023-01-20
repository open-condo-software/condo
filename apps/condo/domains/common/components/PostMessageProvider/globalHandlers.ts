import { useCallback, useContext } from 'react'
import { notification } from 'antd'
import { v4 as uuidV4 } from 'uuid'
import get from 'lodash/get'
import pickBy from 'lodash/pickBy'
import dayjs from 'dayjs'
import { useIntl } from '@open-condo/next/intl'
import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'
import { STAFF } from '@condo/domains/user/constants/common'
import { useMiniappTaskUIInterface } from '@condo/domains/common/hooks/useMiniappTaskUIInterface'
import { TASK_STATUS, TasksContext } from '@condo/domains/common/components/tasks'
import type { RequestHandler } from './types'

export const handleNotification: RequestHandler<'CondoWebAppShowNotification'> = (params) => {
    const { type, ...restParams } = params
    notification[type](restParams)
    return { success: true }
}

export const useLaunchParamsHandler: () => RequestHandler<'CondoWebAppGetLaunchParams'> = () => {
    const { locale } = useIntl()
    const { user } = useAuth()
    const { organization } = useOrganization()
    const userId = get(user, 'id', null)
    const organizationId = get(organization, 'id', null)
    return useCallback(() => {
        return {
            condoUserId: userId,
            condoUserType: STAFF,
            condoLocale: locale,
            condoContextEntity: 'Organization',
            condoContextEntityId: organizationId,

        }
    }, [userId, organizationId, locale])
}

export const useShowProgressBarHandler: () => RequestHandler<'CondoWebAppShowProgressBar'> = () => {
    const { user } = useAuth()
    const { addTask } = useContext(TasksContext)
    const { MiniAppTask: miniAppTaskUIInterface } = useMiniappTaskUIInterface()
    const userId = get(user, 'id', null)

    const createTaskOp = miniAppTaskUIInterface.storage.useCreateTask({}, (record) => {
        addTask({
            ...miniAppTaskUIInterface,
            // TODO(DOMA-5171): Fix types
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            record,
        })
    })

    return useCallback(({
        message,
        description,
        externalTaskId },
    origin) => {
        const id = uuidV4()
        const taskRecord = {
            id,
            taskId: externalTaskId,
            title: message,
            description,
            progress: 0,
            status: TASK_STATUS.PROCESSING,
            user: { id: userId },
            sender: origin,
            createdAt: dayjs().toISOString(),
            __typename: 'MiniAppTask',
        }

        createTaskOp(taskRecord)

        return { barId: id }
        // TODO(DOMA-5171): Adding miniAppTaskUIInterface in deps causing rerender hell!
    }, [userId])
}

export const useGetActiveProgressBarsHandler: () => RequestHandler<'CondoWebAppGetActiveProgressBars'> = () => {
    const { user } = useAuth()
    const { tasks } = useContext(TasksContext)
    const userId = get(user, 'id', null)

    return useCallback((params, origin) => {
        return {
            bars: tasks
                .map(task => task.record)
                .filter(task => task.sender === origin &&
                    task.user && task.user && task.user.id === userId &&
                    task.status === TASK_STATUS.PROCESSING &&
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
}

export const useUpdateProgressBarHandler: () => RequestHandler<'CondoWebAppUpdateProgressBar'> = () => {
    const { user } = useAuth()
    const { updateTask } = useContext(TasksContext)
    const { MiniAppTask: miniAppTaskUIInterface } = useMiniappTaskUIInterface()
    const userId = get(user, 'id', null)

    const updateTaskOperation = miniAppTaskUIInterface.storage.useUpdateTask({}, (record) => {
        // TODO(DOMA-5171): Fix types
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        updateTask(record)
    })

    return useCallback(({ barId, data }, origin) => {
        const taskRecord = {
            id: barId,
            title: data.message,
            description: data.description,
            progress: data.progress,
            status: data.status
                ? data.status
                : (data.progress !== undefined && data.progress >= 100 ? TASK_STATUS.COMPLETED : undefined),
            user: { id: userId },
            sender: origin,
            __typename: 'MiniAppTask',
        }

        updateTaskOperation(pickBy(taskRecord, value => value !== undefined), { id: barId })

        return { updated: true }
        // TODO(DOMA-5171): Adding miniAppTaskUIInterface in deps causing rerender hell!
    }, [userId])
}