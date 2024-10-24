import {
    GetContactExportTasksDocument,
    CreateContactExportTaskDocument,
    UpdateContactExportTaskDocument, type GetContactExportTasksQuery,
} from '@app/condo/gql'

import { ITask } from '@condo/domains/common/components/tasks'
import { useExportTaskUIInterface } from '@condo/domains/common/hooks/useExportTaskUIInterface'


type TaskRecordType = GetContactExportTasksQuery['tasks'][number]
type UseContactExportTaskUIInterfaceType = () => ({ ContactExportTask: ITask<TaskRecordType> })

export const useContactExportTaskUIInterface: UseContactExportTaskUIInterfaceType = () => {
    const { TaskUIInterface } = useExportTaskUIInterface({
        schemaName: 'ContactExportTask',
        getTasksDocument: GetContactExportTasksDocument,
        createTaskDocument: CreateContactExportTaskDocument,
        updateTaskDocument: UpdateContactExportTaskDocument,
    })

    return { ContactExportTask: TaskUIInterface }
}
