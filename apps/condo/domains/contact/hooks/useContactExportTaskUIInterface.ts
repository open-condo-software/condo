import { ITask } from '@condo/domains/common/components/tasks'
import { useExportTaskUIInterface } from '@condo/domains/common/hooks/useExportTaskUIInterface'
import { ContactExportTask } from '@condo/domains/contact/utils/clientSchema'

import type { ContactExportTask as ContactExportTaskType } from '@app/condo/schema'

interface IUseContactExportTaskUIInterface { (): ({ ContactExportTask: ITask }) }

export const useContactExportTaskUIInterface: IUseContactExportTaskUIInterface = () => {
    const { TaskUIInterface } = useExportTaskUIInterface<ContactExportTaskType>({
        clientSchema: ContactExportTask,
        schemaName: 'ContactExportTask',
    })

    return { ContactExportTask: TaskUIInterface }
}
