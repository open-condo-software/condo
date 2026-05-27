import {
    GetBillingSendBillingReceiptFilesTasksDocument,
    CreateBillingSendBillingReceiptFilesTaskDocument,
    UpdateBillingSendBillingReceiptFilesTaskDocument,
    type GetBillingSendBillingReceiptFilesTasksQuery,
} from '@app/condo/gql'

import { ITask } from '@condo/domains/common/components/tasks'
import { useExportTaskUIInterface } from '@condo/domains/common/hooks/useExportTaskUIInterface'

type TaskRecordType = GetBillingSendBillingReceiptFilesTasksQuery['tasks'][number]
type UseBillingSendBillingReceiptFilesTaskUIInterfaceType = () => ({ BillingSendBillingReceiptFilesTask: ITask<TaskRecordType> })

export const useBillingSendBillingReceiptFilesTaskUIInterface: UseBillingSendBillingReceiptFilesTaskUIInterfaceType = () => {
    const { TaskUIInterface } = useExportTaskUIInterface({
        schemaName: 'BillingSendBillingReceiptFilesTask',
        getTasksDocument: GetBillingSendBillingReceiptFilesTasksDocument,
        createTaskDocument: CreateBillingSendBillingReceiptFilesTaskDocument,
        updateTaskDocument: UpdateBillingSendBillingReceiptFilesTaskDocument,
    })

    return { BillingSendBillingReceiptFilesTask: TaskUIInterface }
}
