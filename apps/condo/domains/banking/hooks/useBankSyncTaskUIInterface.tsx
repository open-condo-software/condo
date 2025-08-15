import {
    GetBankSyncTasksDocument,
    CreateBankSyncTaskDocument,
    UpdateBankSyncTaskDocument,
    type GetBankSyncTasksQuery,
} from '@app/condo/gql'
import { notification } from 'antd'
import { useRouter } from 'next/router'
import { useCallback } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Button } from '@open-condo/ui'

import { SBBOL } from '@condo/domains/banking/constants'
import { ITask, TASK_REMOVE_STRATEGY } from '@condo/domains/common/components/tasks'
import { TasksCondoStorage } from '@condo/domains/common/components/tasks/storage/TasksCondoStorage'
import { TASK_COMPLETED_STATUS, TASK_ERROR_STATUS } from '@condo/domains/common/constants/tasks'


type TaskRecordType = GetBankSyncTasksQuery['tasks'][number]
type UseBankSyncTaskUIInterfaceType = () => ({ BankSyncTask: ITask<TaskRecordType> })

const BANK_ACCOUNT_REPORT_PAGE_PATHNAME = '/property/[id]/report'

export const useBankSyncTaskUIInterface: UseBankSyncTaskUIInterfaceType = () => {
    const intl = useIntl()
    const BankSyncTaskProgressTitle = intl.formatMessage({ id: 'tasks.BankSyncTask.file.progress.title' })
    const BankSyncTaskExternalSystemProgressTitle = intl.formatMessage({ id: 'tasks.BankSyncTask.externalSystem.progress.title' })
    const BankSyncTaskProgressDescriptionPreparing = intl.formatMessage({ id: 'tasks.BankSyncTask.progress.description.preparing' })
    const BankSyncTaskProgressDescriptionProcessing = intl.formatMessage({ id: 'tasks.BankSyncTask.progress.description.processing' })
    const BankSyncTaskProgressDescriptionCompleted = intl.formatMessage({ id: 'tasks.BankSyncTask.file.progress.description.completed' })
    const BankSyncTaskProgressDescriptionError = intl.formatMessage({ id: 'tasks.BankSyncTask.progress.description.error' })
    const BankSyncTaskExternalSystemProgressDescriptionCompleted = intl.formatMessage({ id: 'tasks.BankSyncTask.externalSystem.progress.description.completed' })
    const UpdateTitle = intl.formatMessage({ id: 'Update' })

    const { reload, push, pathname, query: { id } } = useRouter()

    const getCompleteButtonClickHandler = useCallback((taskRecord: TaskRecordType) => () => {
        const propertyId = taskRecord?.property?.id

        if (propertyId && BANK_ACCOUNT_REPORT_PAGE_PATHNAME === pathname) {
            reload()
        } else {
            push(`/property/${propertyId}/report`)
        }
    }, [reload, push, pathname])

    const TaskUIInterface: ITask<TaskRecordType> = {
        storage: new TasksCondoStorage({
            getTasksDocument: GetBankSyncTasksDocument,
            createTaskDocument: CreateBankSyncTaskDocument,
            updateTaskDocument: UpdateBankSyncTaskDocument,
        }),
        removeStrategy: [TASK_REMOVE_STRATEGY.PANEL],
        translations: {
            title: (taskRecord) => {
                return taskRecord?.options?.type === SBBOL
                    ? BankSyncTaskExternalSystemProgressTitle
                    : BankSyncTaskProgressTitle
            },
            description: (taskRecord) => {
                if (taskRecord.status === TASK_ERROR_STATUS) {
                    return taskRecord?.meta?.errorMessage || BankSyncTaskProgressDescriptionError
                }

                const completedMessage = taskRecord?.options?.type === SBBOL
                    ? BankSyncTaskExternalSystemProgressDescriptionCompleted
                    : BankSyncTaskProgressDescriptionCompleted

                const { status, processedCount, totalCount } = taskRecord // this record is of type BankSyncTask
                return status === TASK_COMPLETED_STATUS
                    ? completedMessage
                    : !totalCount || !processedCount
                        ? BankSyncTaskProgressDescriptionPreparing
                        : BankSyncTaskProgressDescriptionProcessing
                            .replace('{imported}', String(processedCount || 0))
                            .replace('{total}', String(totalCount || 0))
            },
        },
        calculateProgress: (task) => {
            return Math.floor(task.processedCount / task.totalCount) * 100
        },
        onComplete: (taskRecord) => {
            const propertyId = taskRecord?.property?.id || null

            if (taskRecord?.status === TASK_COMPLETED_STATUS) {
                if (pathname === BANK_ACCOUNT_REPORT_PAGE_PATHNAME && propertyId === id) {
                    reload()
                } else if (propertyId) {
                    const message = taskRecord?.options?.type === SBBOL
                        ? BankSyncTaskExternalSystemProgressDescriptionCompleted
                        : BankSyncTaskProgressDescriptionCompleted
                    // TODO(antonal): move it to translations, since now it is possible to return ReactNode as a value of `translations.description`
                    notification.success({
                        message,
                        btn: <Button onClick={getCompleteButtonClickHandler(taskRecord)} type='primary'>{UpdateTitle}</Button>,
                        duration: 0,
                    })
                }
            }
        },
        onCancel: () => null,
    }

    return {
        BankSyncTask: TaskUIInterface,
    }
}
