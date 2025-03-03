import {
    GetNewsItemRecipientsExportTasksDocument,
    CreateNewsItemRecipientsExportTaskDocument,
    UpdateNewsItemRecipientsExportTaskDocument,
    type GetNewsItemRecipientsExportTasksQuery,
} from '@app/condo/gql'

import { ITask } from '@condo/domains/common/components/tasks'
import { useExportTaskUIInterface } from '@condo/domains/common/hooks/useExportTaskUIInterface'


type TaskRecordType = GetNewsItemRecipientsExportTasksQuery['tasks'][number]
type UseNewsItemRecipientsExportTaskUIInterfaceType = () => ({ NewsItemRecipientsExportTask: ITask<TaskRecordType> })

export const useNewsItemRecipientsExportTaskUIInterface: UseNewsItemRecipientsExportTaskUIInterfaceType = () => {
    const { TaskUIInterface } = useExportTaskUIInterface({
        schemaName: 'NewsItemRecipientsExportTask',
        getTasksDocument: GetNewsItemRecipientsExportTasksDocument,
        createTaskDocument: CreateNewsItemRecipientsExportTaskDocument,
        updateTaskDocument: UpdateNewsItemRecipientsExportTaskDocument,
    })

    return { NewsItemRecipientsExportTask: TaskUIInterface }
}
