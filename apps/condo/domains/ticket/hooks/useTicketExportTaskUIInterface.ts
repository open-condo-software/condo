import { TicketExportTask } from '@app/condo/schema'

import { useExportTaskUIInterface } from '@condo/domains/common/hooks/useExportTaskUIInterface'
import { TicketExportTask as TicketExportTaskApi } from '@condo/domains/ticket/utils/clientSchema'


export const useTicketExportTaskUIInterface = () => {
    const { TaskUIInterface } = useExportTaskUIInterface<TicketExportTask>({
        schemaName: 'TicketExportTask',
        clientSchema: TicketExportTaskApi,
    })

    return {
        // Key of object should match `__typename` value of `TicketExportTask` record (name of Keystone schema)
        // This will be used to match this interface implementation with
        // initial loaded record on first page load
        TicketExportTask: TaskUIInterface,
    }
}
