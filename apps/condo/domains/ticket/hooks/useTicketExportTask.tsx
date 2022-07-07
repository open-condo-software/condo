import { useIntl } from '@core/next/intl'
import { ITask, TASK_PROGRESS_UNKNOWN, TASK_REMOVE_STRATEGY } from '@condo/domains/common/components/tasks'
import { TASK_COMPLETED_STATUS } from '@condo/domains/common/constants/tasks'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { TaskLauncher } from '@condo/domains/common/components/tasks/TaskLauncher'
import { TicketExportTask } from '@condo/domains/ticket/utils/clientSchema'
import { TasksCondoStorage } from '@condo/domains/common/components/tasks/storage/TasksCondoStorage'

export const useTicketExportTaskUIInterface = () => {
    const intl = useIntl()
    const TicketExportTaskProgressTitle = intl.formatMessage({ id: 'tasks.TicketExportTask.progress.title' })
    const TicketExportTaskProgressDescriptionProcessing = intl.formatMessage({ id: 'tasks.TicketExportTask.progress.description.processing' })
    const TicketExportTaskProgressDescriptionCompleted = intl.formatMessage({ id: 'tasks.TicketExportTask.progress.description.completed' })

    /**
     * We need this separation of behavior from data to determine which behaviour
     * to use for initial loaded tasks by `__typename` field value
     */
    const TaskUIInterface: ITask = {
        storage: new TasksCondoStorage({ clientSchema: TicketExportTask }),
        removeStrategy: [TASK_REMOVE_STRATEGY.PANEL],
        translations: {
            title: () => {
                return TicketExportTaskProgressTitle
            },
            description: (taskRecord) => {
                // Extra field `exportedTicketsCount` over `TaskRecord` type
                // @ts-ignore
                const { status, exportedTicketsCount } = taskRecord
                return status === TASK_COMPLETED_STATUS
                    ? TicketExportTaskProgressDescriptionCompleted
                    : TicketExportTaskProgressDescriptionProcessing.replace('{n}', exportedTicketsCount || 0)
            },
        },
        calculateProgress: () => {
            // There is no technical way to tell exact progress of the exporting tickets task
            // because `GqlWithKnexLoadList` that is used on server-side of in `exportTicketsTask` module
            // can't execute `count` SQL-requests
            return TASK_PROGRESS_UNKNOWN
        },
        onComplete: ({ file }) => {
            if (window) {
                console.log('Downloading exported file')
                window.location.href = file.publicUrl
            }
        },
    }

    return {
        // Key of object should match `__typename` value of `TicketExportTask` record (name of Keystone schema)
        // This will be used to match this interface implementation with
        // initial loaded record on first page load
        TicketExportTask: TaskUIInterface,
    }
}

export const useTicketExportTask = ({ where, sortBy, format, timeZone, user }) => {
    const intl = useIntl()
    const ExportAsExcelLabel = intl.formatMessage({ id: 'ExportAsExcel' })
    const { TicketExportTask: TaskUIInterface } = useTicketExportTaskUIInterface()

    return {
        TaskUIInterface,
        TaskLauncher: () => (
            <TaskLauncher
                label={ExportAsExcelLabel}
                taskUIInterface={TaskUIInterface}
                attrs={{
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                    where,
                    format,
                    sortBy: sortBy,
                    timeZone,
                    user: { connect: { id: user.id } },
                }}
            />
        ),
    }
}