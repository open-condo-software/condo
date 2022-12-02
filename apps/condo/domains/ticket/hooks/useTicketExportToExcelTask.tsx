import React, { useCallback } from 'react'
import { FileExcelFilled } from '@ant-design/icons'

import { useIntl } from '@open-condo/next/intl'

import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { useTaskLauncher } from '@condo/domains/common/components/tasks/TaskLauncher'
import { Button } from '@condo/domains/common/components/Button'

import { useTicketExportTaskUIInterface } from './useTicketExportTaskUIInterface'

export const useTicketExportToExcelTask = ({ where, sortBy, format, locale, timeZone, user }) => {
    const intl = useIntl()
    const ExportAsExcelLabel = intl.formatMessage({ id: 'ExportAsExcel' })

    const { TicketExportTask: TaskUIInterface } = useTicketExportTaskUIInterface()

    const { loading, handleRunTask } = useTaskLauncher(TaskUIInterface, {
        dv: 1,
        sender: getClientSideSenderInfo(),
        where,
        format,
        sortBy,
        locale,
        timeZone,
        user: { connect: { id: user.id } },
    })

    const TicketsExportToXlsxButton = useCallback(() => (
        <Button
            type='sberBlack'
            secondary
            icon={<FileExcelFilled />}
            loading={loading}
            onClick={handleRunTask}
            eventName='TicketsExportClick'
            children={ExportAsExcelLabel}
        />
    ), [ExportAsExcelLabel, handleRunTask, loading])

    return {
        TaskUIInterface,
        TicketsExportToXlsxButton,
    }
}
