import { IncidentExportTask } from '@app/condo/schema'

import { useExportTaskUIInterface } from '@condo/domains/common/hooks/useExportTaskUIInterface'
import { IncidentExportTask as IncidentExportTaskApi } from '@condo/domains/ticket/utils/clientSchema'


export const useIncidentExportTaskUIInterface = () => {
    const { TaskUIInterface } = useExportTaskUIInterface<IncidentExportTask>({
        clientSchema: IncidentExportTaskApi,
        schemaName: 'IncidentExportTask',
    })

    return { IncidentExportTask: TaskUIInterface }
}
