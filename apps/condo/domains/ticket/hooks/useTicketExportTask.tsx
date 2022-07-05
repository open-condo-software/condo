import { useIntl } from '@core/next/intl'
import { TASK_PROGRESS_UNKNOWN } from '@condo/domains/common/components/tasks'
import { WORKER_TASK_COMPLETED } from '@condo/domains/common/constants/worker'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { TaskLauncher } from '@condo/domains/common/components/tasks/TaskLauncher'
import { TicketExportTask } from '@condo/domains/ticket/utils/clientSchema'

export const useTicketExportTask = ({ where, sortBy, format, timeZone, user }) => {
    const intl = useIntl()
    const TicketExportTaskProgressTitle = intl.formatMessage({ id: 'tasks.TicketExportTask.progress.title' })
    const TicketExportTaskProgressDescriptionProcessing = intl.formatMessage({ id: 'tasks.TicketExportTask.progress.description.processing' })
    const TicketExportTaskProgressDescriptionCompleted = intl.formatMessage({ id: 'tasks.TicketExportTask.progress.description.completed' })
    const ExportAsExcelLabel = intl.formatMessage({ id: 'ExportAsExcel' })

    return {
        TaskLauncher: () => (
            <TaskLauncher
                label={ExportAsExcelLabel}
                taskClientSchema={TicketExportTask}
                attrs={{
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                    where,
                    format,
                    sortBy: sortBy,
                    timeZone,
                    user: { connect: { id: user.id } },
                }}
                translations={{
                    title: TicketExportTaskProgressTitle,
                    description: (taskRecord) => {
                        // Extra field `exportedTicketsCount` over `TaskRecord` type
                        // @ts-ignore
                        const { status, exportedTicketsCount } = taskRecord
                        return status === WORKER_TASK_COMPLETED
                            ? TicketExportTaskProgressDescriptionCompleted
                            : TicketExportTaskProgressDescriptionProcessing.replace('{n}', exportedTicketsCount || 0)
                    },
                }}
                calculateProgress={() => {
                    // There is no technical way to tell exact progress of the exporting tickets task
                    // because `GqlWithKnexLoadList` that is used on server-side of in `exportTicketsTask` module
                    // can't execute `count` SQL-requests
                    return TASK_PROGRESS_UNKNOWN
                }}
                onComplete={({ file }) => {
                    if (window) {
                        console.log('Downloading exported file')
                        window.location.href = file.publicUrl
                    }
                }}
            />
        ),
    }
}