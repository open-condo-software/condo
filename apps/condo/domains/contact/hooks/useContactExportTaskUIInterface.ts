import get from 'lodash/get'

import { useIntl } from '@open-condo/next/intl'

import { ITask, TASK_REMOVE_STRATEGY } from '@condo/domains/common/components/tasks'
import { TasksCondoStorage } from '@condo/domains/common/components/tasks/storage/TasksCondoStorage'
import { TASK_COMPLETED_STATUS } from '@condo/domains/common/constants/tasks'
import { useDownloadFileFromServer } from '@condo/domains/common/hooks/useDownloadFileFromServer'
import { ContactExportTask } from '@condo/domains/contact/utils/clientSchema'

import type { ContactExportTask as ContactExportTaskType } from '@app/condo/schema'

interface IUseContactExportTaskUIInterface { (): ({ ContactExportTask: ITask }) }

export const useContactExportTaskUIInterface: IUseContactExportTaskUIInterface = () => {
    const intl = useIntl()
    const ContactExportTaskProgressTitle = intl.formatMessage({ id: 'tasks.ContactExportTask.progress.title' })
    const ContactExportTaskProgressDescriptionPreparing = intl.formatMessage({ id: 'tasks.ContactExportTask.progress.description.preparing' })
    const ContactExportTaskProgressDescriptionProcessing = intl.formatMessage({ id: 'tasks.ContactExportTask.progress.description.processing' })
    const ContactExportTaskProgressDescriptionCompleted = intl.formatMessage({ id: 'tasks.ContactExportTask.progress.description.completed' })

    const { downloadFile } = useDownloadFileFromServer()

    const safeDownloadFile = async (taskRecord: ContactExportTaskType) => {
        const publicUrl = get(taskRecord, 'file.publicUrl')
        const filename = get(taskRecord, 'file.originalFilename')

        if (publicUrl && filename) {
            await downloadFile({ url: publicUrl, name: filename })
        } else {
            console.error(`File is not presented in ContactExportTask ${taskRecord}`)
        }
    }

    const TaskUIInterface: ITask = {
        storage: new TasksCondoStorage({ clientSchema: ContactExportTask }),
        removeStrategy: [TASK_REMOVE_STRATEGY.PANEL],
        translations: {
            title: () => ContactExportTaskProgressTitle,
            description: (taskRecord) => {
                const taskStatus = get(taskRecord, 'status')
                const totalRecordsCount = get(taskRecord, 'totalRecordsCount')
                const exportedRecordsCount = get(taskRecord, 'exportedRecordsCount')

                return taskStatus === TASK_COMPLETED_STATUS
                    ? ContactExportTaskProgressDescriptionCompleted
                    : !totalRecordsCount || !exportedRecordsCount
                        ? ContactExportTaskProgressDescriptionPreparing
                        : ContactExportTaskProgressDescriptionProcessing
                            .replace('{exported}', exportedRecordsCount || 0)
                            .replace('{total}', totalRecordsCount || 0)
            },
        },
        calculateProgress: (task: ContactExportTaskType) => {
            return Math.floor(task.exportedRecordsCount / task.totalRecordsCount * 100)
        },
        onComplete: safeDownloadFile,
        onCancel: safeDownloadFile,
    }

    return { ContactExportTask: TaskUIInterface }
}
