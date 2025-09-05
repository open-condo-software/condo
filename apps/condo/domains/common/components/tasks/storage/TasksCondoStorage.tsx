import { useQuery, type DocumentNode } from '@apollo/client'
import dayjs from 'dayjs'
import isFunction from 'lodash/isFunction'
import { useCallback } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useMutation } from '@open-condo/next/apollo'

import { TASK_POLL_INTERVAL } from '@condo/domains/common/constants/tasks'
import { nonNull } from '@condo/domains/common/utils/nonNull'

import { ITasksStorage, CondoTaskRecord } from '../index'


type TasksCondoStorageConstructorPropsType = {
    getTasksDocument?: DocumentNode
    createTaskDocument?: DocumentNode
    updateTaskDocument?: DocumentNode
}

type UseTasks<TTaskRecord extends CondoTaskRecord> = ITasksStorage<TTaskRecord>['useTasks']
type UseTask<TTaskRecord extends CondoTaskRecord> = ITasksStorage<TTaskRecord>['useTask']
type UseCreateTask<TTaskRecord extends CondoTaskRecord> = ITasksStorage<TTaskRecord>['useCreateTask']
type UseUpdateTask<TTaskRecord extends CondoTaskRecord> = ITasksStorage<TTaskRecord>['useUpdateTask']
type UseDeleteTask<TTaskRecord extends CondoTaskRecord> = ITasksStorage<TTaskRecord>['useDeleteTask']

/**
 * Used to store tasks known by Condo API
 * Uses clientSchema, available at compile time
 */
export class TasksCondoStorage<TTaskRecord extends CondoTaskRecord = CondoTaskRecord> implements ITasksStorage<TTaskRecord> {
    getTasksDocument?: TasksCondoStorageConstructorPropsType['getTasksDocument']
    createTaskDocument?: TasksCondoStorageConstructorPropsType['createTaskDocument']
    updateTaskDocument?: TasksCondoStorageConstructorPropsType['updateTaskDocument']

    constructor ({ getTasksDocument, createTaskDocument, updateTaskDocument }: TasksCondoStorageConstructorPropsType) {
        this.getTasksDocument = getTasksDocument
        this.createTaskDocument = createTaskDocument
        this.updateTaskDocument = updateTaskDocument
    }

    useTasks (
        { status, today }: Parameters<UseTasks<TTaskRecord>>[0],
        user: Parameters<UseTasks<TTaskRecord>>[1]
    ): ReturnType<UseTasks<TTaskRecord>> {
        const where = {
            status,
            user: { id: user?.id },
            ...(today ? { createdAt_gte: dayjs().startOf('day') } : undefined),
        }

        // eslint-disable-next-line react-hooks/rules-of-hooks
        const { data, error, loading } = useQuery(this.getTasksDocument, { variables: { where }, skip: !user?.id })
        const tasks = data?.tasks?.filter(nonNull) || []
        return { records: !error ? tasks : [], loading }
    }

    useTask (id: Parameters<UseTask<TTaskRecord>>[0]): ReturnType<UseTask<TTaskRecord>> {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const { data, stopPolling } = useQuery(this.getTasksDocument, { variables: { where: { id } },
            pollInterval: TASK_POLL_INTERVAL,
        })
        const tasks = data?.tasks?.filter(nonNull) || []
        const task = tasks?.[0] || null
        return { record: task, stopPolling }
    }

    useCreateTask (
        initialValues: Parameters<UseCreateTask<TTaskRecord>>[0],
        onComplete: Parameters<UseCreateTask<TTaskRecord>>[1]
    ): ReturnType<UseCreateTask<TTaskRecord>> {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [action] = useMutation(this.createTaskDocument, {
            onCompleted: (data) => {
                if (data && data.task) {
                    if (isFunction(onComplete)) {
                        onComplete(data.task)
                    }
                }
            },
        })

        // eslint-disable-next-line react-hooks/rules-of-hooks
        return useCallback(async (values) => {
            const sender = getClientSideSenderInfo()
            const variables = {
                data: {
                    dv: 1,
                    sender,
                    ...initialValues,
                    ...values,
                },
            }
            await action({ variables })
        }, [action, initialValues])
    }

    useUpdateTask (
        initialValues: Parameters<UseUpdateTask<TTaskRecord>>[0],
        onComplete: Parameters<UseUpdateTask<TTaskRecord>>[1]
    ): ReturnType<UseUpdateTask<TTaskRecord>> {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [action] = useMutation(this.updateTaskDocument, {
            onCompleted: (data) => {
                if (data && data.task) {
                    if (isFunction(onComplete)) {
                        onComplete(data.task)
                    }
                }
            },
        })

        // eslint-disable-next-line react-hooks/rules-of-hooks
        return useCallback(async (values, obj) => {
            const sender = getClientSideSenderInfo()
            const variables = {
                id: obj.id,
                data: {
                    dv: 1,
                    sender,
                    ...initialValues,
                    ...values,
                },
            }
            await action({ variables })
        }, [initialValues, action])
    }

    useDeleteTask (
        initialObj: Parameters<UseDeleteTask<TTaskRecord>>[0],
        onComplete: Parameters<UseDeleteTask<TTaskRecord>>[1]
    ): ReturnType<UseDeleteTask<TTaskRecord>> {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [action] = useMutation(this.updateTaskDocument, {
            onCompleted: (data) => {
                if (data && data.task && onComplete) {
                    onComplete(data.task)
                }
            },
        })

        // eslint-disable-next-line react-hooks/rules-of-hooks
        return useCallback(async (obj) => {
            const sender = getClientSideSenderInfo()
            const variables = {
                id: initialObj.id || obj.id,
                data: {
                    dv: 1,
                    sender,
                    deletedAt: (new Date()).toISOString(),
                },
            }

            await action({ variables })
        }, [action, initialObj])
    }
}
