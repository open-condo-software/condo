import { useIntl } from '@open-condo/next/intl'
import { useRouter } from 'next/router'
import { ITask, TASK_REMOVE_STRATEGY } from '@condo/domains/common/components/tasks'
import { TASK_COMPLETED_STATUS } from '@condo/domains/common/constants/tasks'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { TaskLauncher } from '@condo/domains/common/components/tasks/TaskLauncher'
import { TicketExportTask as TicketExportTaskApi } from '@condo/domains/ticket/utils/clientSchema'
import { TasksCondoStorage } from '@condo/domains/common/components/tasks/storage/TasksCondoStorage'
import { TicketExportTask } from '@app/condo/schema'

export const useTicketExportTaskUIInterface = () => {
    const intl = useIntl()
    const TicketExportTaskProgressTitle = intl.formatMessage({ id: 'tasks.TicketExportTask.progress.title' })
    const TicketExportTaskProgressDescriptionPreparing = intl.formatMessage({ id: 'tasks.TicketExportTask.progress.description.preparing' })
    const TicketExportTaskProgressDescriptionProcessing = intl.formatMessage({ id: 'tasks.TicketExportTask.progress.description.processing' })
    const TicketExportTaskProgressDescriptionCompleted = intl.formatMessage({ id: 'tasks.TicketExportTask.progress.description.completed' })
    const router = useRouter()

    const tryToDownloadFile = (taskRecord: TicketExportTask) => {
        if (taskRecord.file) {
            console.log('Downloading exported file TicketExportTask', taskRecord)
            router.push(taskRecord.file.publicUrl)
        } else {
            console.error('File is not presented in TicketExportTask', taskRecord)
        }
    }

    /**
     * We need this separation of behavior from data to determine which behaviour
     * to use for initial loaded tasks by `__typename` field value
     */
    const TaskUIInterface: ITask = {
        storage: new TasksCondoStorage({ clientSchema: TicketExportTaskApi }),
        removeStrategy: [TASK_REMOVE_STRATEGY.PANEL],
        translations: {
            title: () => {
                return TicketExportTaskProgressTitle
            },
            description: (taskRecord) => {
                // @ts-ignore
                const { status, exportedRecordsCount, totalRecordsCount } = taskRecord // this record is of type TicketExportTask
                return status === TASK_COMPLETED_STATUS
                    ? TicketExportTaskProgressDescriptionCompleted
                    : !totalRecordsCount || !exportedRecordsCount
                        ? TicketExportTaskProgressDescriptionPreparing
                        : TicketExportTaskProgressDescriptionProcessing
                            .replace('{exported}', exportedRecordsCount || 0)
                            .replace('{total}', totalRecordsCount || 0)
            },
        },
        calculateProgress: (totalRecordsCount: TicketExportTask) => {
            return Math.floor(totalRecordsCount.exportedRecordsCount / totalRecordsCount.totalRecordsCount * 100)
        },
        onComplete: tryToDownloadFile,
        onCancel: tryToDownloadFile,
    }

    return {
        // Key of object should match `__typename` value of `TicketExportTask` record (name of Keystone schema)
        // This will be used to match this interface implementation with
        // initial loaded record on first page load
        TicketExportTask: TaskUIInterface,
    }
}

export const useTicketExportTask = ({ where, sortBy, format, locale, timeZone, user }) => {
    const intl = useIntl()
    const ExportAsExcelLabel = intl.formatMessage({ id: 'ExportAsExcel' })
    const { TicketExportTask: TaskUIInterface } = useTicketExportTaskUIInterface()

    return {
        TaskUIInterface,
        TaskLauncher: ({ disabled, hidden }) => (
            <TaskLauncher
                label={ExportAsExcelLabel}
                taskUIInterface={TaskUIInterface}
                attrs={{
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                    where,
                    format,
                    sortBy: sortBy,
                    locale,
                    timeZone,
                    user: { connect: { id: user.id } },
                }}
                hidden={hidden}
                disabled={disabled}
            />
        ),
    }
}