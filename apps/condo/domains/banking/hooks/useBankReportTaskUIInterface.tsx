import { useIntl } from '@open-condo/next/intl'

import { BankAccountReportTask } from '@condo/domains/banking/utils/clientSchema'
import { ITask, TASK_REMOVE_STRATEGY, TASK_STATUS } from '@condo/domains/common/components/tasks'
import { TasksCondoStorage } from '@condo/domains/common/components/tasks/storage/TasksCondoStorage'

import type { BankAccountReportTask as BankAccountReportTaskType } from '@app/condo/schema'

export const useBankReportTaskUIInterface = () => {
    const intl = useIntl()
    const TaskProgressTitle = intl.formatMessage({ id: 'tasks.BankReportTask.progress.title' })
    const TaskProgressDescriptionProcessing = intl.formatMessage({ id: 'tasks.BankReportTask.progress.description.processing' })
    const TaskProgressDescriptionCompleted = intl.formatMessage({ id: 'tasks.BankReportTask.progress.description.completed' })

    const TaskUIInterface: ITask = {
        storage: new TasksCondoStorage({
            clientSchema: BankAccountReportTask,
        }),
        removeStrategy: [TASK_REMOVE_STRATEGY.PANEL],
        translations: {
            title: () => TaskProgressTitle,
            description: (taskRecord) => {
                return taskRecord.status === TASK_STATUS.COMPLETED
                    ? TaskProgressDescriptionCompleted
                    : TaskProgressDescriptionProcessing
            },
        },
        calculateProgress: (task: BankAccountReportTaskType) => {
            return task.progress
        },
        onComplete: () => null,
        onCancel: () => null,
    }

    return {
        BankReportTask: TaskUIInterface,
    }
}
