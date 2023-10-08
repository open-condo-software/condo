import { ITask, TaskRecord } from '@condo/domains/common/components/tasks'
import { TASK_REMOVE_STRATEGY }  from '@condo/domains/common/components/tasks'
import { TasksLocalStorage } from '@condo/domains/common/components/tasks/storage/TasksLocalStorage'

export const useMiniappTaskUIInterface = () => {
    const TaskUIInterface: ITask = {
        storage: new TasksLocalStorage(),
        removeStrategy: [TASK_REMOVE_STRATEGY.PANEL, TASK_REMOVE_STRATEGY.STORAGE],
        translations: {
            title: (taskRecord) => taskRecord.title,
            description: (taskRecord) => taskRecord.description,
        },
        calculateProgress: (taskRecord: TaskRecord) => {
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
