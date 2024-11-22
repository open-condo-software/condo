import { useCallback, useState } from 'react'

import { useTasks } from './TasksContextProvider'

import { ITask, BaseTaskRecord } from './index'

type UseTaskLauncherOutputType<TTaskRecordVariables extends Record<string, any>> = {
    loading: boolean
    handleRunTask: (params?: { taskAttrs?: TTaskRecordVariables }) => void
}

/**
 * Launches specified task by creating its record with `useCreate`
 * and adds its progress representation using ITasksContext interface
 */
export const useTaskLauncher = <TTaskRecordVariables extends Record<string, any>, TTaskRecord extends BaseTaskRecord = BaseTaskRecord> (taskUIInterface: ITask<TTaskRecord>, attrs: TTaskRecordVariables): UseTaskLauncherOutputType<TTaskRecordVariables>  => {
    const [loading, setLoading] = useState(false)

    // TODO(antonal): load in-progress tasks and set loading state. For user it will mean that
    const { addTask } = useTasks<TTaskRecord>()

    const launchTask = taskUIInterface.storage.useCreateTask({}, (record) => {
        setLoading(true)
        addTask({
            record,
            ...taskUIInterface,
            onComplete: (result) => {
                setLoading(false)
                taskUIInterface.onComplete(result)
            },
            onCancel: () => {
                setLoading(false)
            },
            onError: () => {
                setLoading(false)
            },
        })
    })

    const handleRunTask: UseTaskLauncherOutputType<TTaskRecordVariables>['handleRunTask'] = useCallback((params) => {
        // NOTE: The "taskAttrs" property is used here because
        // if "handleRunTask" is called in "onClick" (like "onClick={handleRunTask}"),
        // then a lot of unnecessary properties will be passed, which are passed by "onClick".
        // All these properties will be passed to the request - this should be avoided
        const taskAttrs = params?.taskAttrs
        launchTask({ ...attrs, ...taskAttrs })
    }, [launchTask, attrs])

    return { loading, handleRunTask }
}
