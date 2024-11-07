import { MeterReadingExportTask } from '@app/condo/schema'

import { useExportTaskUIInterface } from '@condo/domains/common/hooks/useExportTaskUIInterface'
import { MeterReadingExportTask as MeterReadingExportTaskApi } from '@condo/domains/meter/utils/clientSchema'


export const useMeterReadingExportTaskUIInterface = () => {
    const { TaskUIInterface } = useExportTaskUIInterface<MeterReadingExportTask>({
        clientSchema: MeterReadingExportTaskApi,
        schemaName: 'MeterReadingExportTask',
    })

    return { MeterReadingExportTask: TaskUIInterface }
}
