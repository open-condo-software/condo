import { TasksLocalStorage } from '@condo/domains/common/components/tasks/storage/TasksLocalStorage'
import { ITask, TaskRecord } from '@condo/domains/common/components/tasks'

export const useMiniappTaskUIInterface = () => {
    const TaskUIInterface: ITask = {
        storage: new TasksLocalStorage(),
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
    }

    return {
        MiniAppTask: TaskUIInterface,
    }
}
