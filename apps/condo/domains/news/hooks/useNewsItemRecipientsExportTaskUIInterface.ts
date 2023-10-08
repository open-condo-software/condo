import { NewsItemRecipientsExportTask } from '@app/condo/schema'

import { useExportTaskUIInterface } from '@condo/domains/common/hooks/useExportTaskUIInterface'
import { NewsItemRecipientsExportTask as NewsItemRecipientsExportTaskApi } from '@condo/domains/news/utils/clientSchema'

export const useNewsItemRecipientsExportTaskUIInterface = () => {
    const { TaskUIInterface } = useExportTaskUIInterface<NewsItemRecipientsExportTask & {
        exportedRecordsCount: number,
        totalRecordsCount: number
    }>({
        schemaName: 'NewsItemRecipientsExportTask',
        clientSchema: NewsItemRecipientsExportTaskApi,
    })

    return {
        // Key of object should match `__typename` value of `NewsItemRecipientsExportTask` record (name of Keystone schema)
        // This will be used to match this interface implementation with
        // initial loaded record on first page load
        NewsItemRecipientsExportTask: TaskUIInterface,
    }
}
