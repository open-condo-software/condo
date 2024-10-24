import {
    GetTicketExportTasksDocument,
    CreateTicketExportTaskDocument,
    UpdateTicketExportTaskDocument, type GetTicketExportTasksQuery,
} from '@app/condo/gql'

import { ITask } from '@condo/domains/common/components/tasks'
import { useExportTaskUIInterface } from '@condo/domains/common/hooks/useExportTaskUIInterface'


type TaskRecordType = GetTicketExportTasksQuery['tasks'][number]
type UseTicketExportTaskUIInterfaceType = () => ({ TicketExportTask: ITask<TaskRecordType> })

export const useTicketExportTaskUIInterface: UseTicketExportTaskUIInterfaceType = () => {
    const { TaskUIInterface } = useExportTaskUIInterface({
        schemaName: 'TicketExportTask',
        getTasksDocument: GetTicketExportTasksDocument,
        createTaskDocument: CreateTicketExportTaskDocument,
        updateTaskDocument: UpdateTicketExportTaskDocument,
    })

    return { TicketExportTask: TaskUIInterface }
}
