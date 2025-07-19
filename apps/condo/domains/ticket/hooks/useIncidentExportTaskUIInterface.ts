import {
    GetIncidentExportTasksDocument,
    CreateIncidentExportTaskDocument,
    UpdateIncidentExportTaskDocument,
    type GetIncidentExportTasksQuery,
} from '@app/condo/gql'

import { ITask } from '@condo/domains/common/components/tasks'
import { useExportTaskUIInterface } from '@condo/domains/common/hooks/useExportTaskUIInterface'


type TaskRecordType = GetIncidentExportTasksQuery['tasks'][number]
type UseIncidentExportTaskUIInterfaceType = () => ({ IncidentExportTask: ITask<TaskRecordType> })

export const useIncidentExportTaskUIInterface: UseIncidentExportTaskUIInterfaceType = () => {
    const { TaskUIInterface } = useExportTaskUIInterface({
        schemaName: 'IncidentExportTask',
        getTasksDocument: GetIncidentExportTasksDocument,
        createTaskDocument: CreateIncidentExportTaskDocument,
        updateTaskDocument: UpdateIncidentExportTaskDocument,
    })

    return { IncidentExportTask: TaskUIInterface }
}
