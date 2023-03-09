import { BankSyncTask } from '@app/condo/schema'

import { useIntl } from '@open-condo/next/intl'

import { BankSyncTask as BankSyncTaskApi } from '@condo/domains/banking/utils/clientSchema'
import { ITask, TASK_REMOVE_STRATEGY } from '@condo/domains/common/components/tasks'
import { TasksCondoStorage } from '@condo/domains/common/components/tasks/storage/TasksCondoStorage'
import { TASK_COMPLETED_STATUS } from '@condo/domains/common/constants/tasks'

export const useBankSyncTaskUIInterface = () => {
    const intl = useIntl()
    const BankSyncTaskProgressTitle = intl.formatMessage({ id: 'tasks.BankSyncTask.progress.title' })
    const BankSyncTaskProgressDescriptionPreparing = intl.formatMessage({ id: 'tasks.BankSyncTask.progress.description.preparing' })
    const BankSyncTaskProgressDescriptionProcessing = intl.formatMessage({ id: 'tasks.BankSyncTask.progress.description.processing' })
    const BankSyncTaskProgressDescriptionCompleted = intl.formatMessage({ id: 'tasks.BankSyncTask.progress.description.completed' })

    const TaskUIInterface: ITask = {
        storage: new TasksCondoStorage({ clientSchema: BankSyncTaskApi }),
        removeStrategy: [TASK_REMOVE_STRATEGY.PANEL],
        translations: {
            title: () => {
                return BankSyncTaskProgressTitle
            },
            description: (taskRecord) => {
                // @ts-ignore
                const { status, processedCount, totalCount } = taskRecord // this record is of type BankSyncTask
                return status === TASK_COMPLETED_STATUS
                    ? BankSyncTaskProgressDescriptionCompleted
                    : !totalCount || !processedCount
                        ? BankSyncTaskProgressDescriptionPreparing
                        : BankSyncTaskProgressDescriptionProcessing
                            .replace('{imported}', processedCount || 0)
                            .replace('{total}', totalCount || 0)
            },
        },
        calculateProgress: (task: BankSyncTask) => {
            return Math.floor(task.processedCount / task.totalCount) * 100
        },
        onComplete: () => { alert('Completed') },
        onCancel: () => { alert('Cancelled') },
    }

    return {
        BankSyncTask: TaskUIInterface,
    }
}