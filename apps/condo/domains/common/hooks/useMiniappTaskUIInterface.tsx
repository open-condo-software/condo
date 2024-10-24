import { ITask, LocalTaskRecord } from '@condo/domains/common/components/tasks'
import { TASK_REMOVE_STRATEGY }  from '@condo/domains/common/components/tasks'
import { TasksLocalStorage } from '@condo/domains/common/components/tasks/storage/TasksLocalStorage'

type UseMiniappTaskUIInterfaceType = () => ({ MiniAppTask: ITask<LocalTaskRecord> })
export const useMiniappTaskUIInterface: UseMiniappTaskUIInterfaceType = () => {
    const TaskUIInterface: ITask<LocalTaskRecord> = {
        storage: new TasksLocalStorage(),
        removeStrategy: [TASK_REMOVE_STRATEGY.PANEL, TASK_REMOVE_STRATEGY.STORAGE],
        translations: {
            title: (taskRecord) => taskRecord.title,
            description: (taskRecord) => taskRecord.description,
        },
        calculateProgress: (taskRecord) => {
            return taskRecord.progress
        },
        onComplete: (taskRecord) => {
            console.debug('Completed third-party taskRecord', taskRecord)
        },
        onCancel: (taskRecord) => {
            console.debug('Cancelled third-party taskRecord', taskRecord)
        },
    }

    return {
        MiniAppTask: TaskUIInterface,
    }
}
