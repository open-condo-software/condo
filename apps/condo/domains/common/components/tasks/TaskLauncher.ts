import { useCallback, useContext, useState } from 'react'

import { TasksContext } from './TasksContextProvider'

import { ITask, TaskRecord } from './index'

type UseTaskLauncherOutputType = {
    loading: boolean
    handleRunTask: () => void
}
type UseTaskLauncherType = (taskUIInterface: ITask, attrs: Record<string, any>) => UseTaskLauncherOutputType

/**
 * Launches specified task by creating its record with `useCreate`
 * and adds its progress representation using ITasksContext interface
 */
export const useTaskLauncher: UseTaskLauncherType = (taskUIInterface, attrs) => {
    const [loading, setLoading] = useState(false)

    // TODO(antonal): load in-progress tasks and set loading state. For user it will mean that
    const { addTask } = useContext(TasksContext)

    const launchTask = taskUIInterface.storage.useCreateTask({}, (record: TaskRecord) => {
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

    const handleRunTask = useCallback(() => {
        launchTask(attrs)
    }, [launchTask, attrs])

    return { loading, handleRunTask }
}
