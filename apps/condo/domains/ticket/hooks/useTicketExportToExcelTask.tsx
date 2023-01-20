import { FileExcelFilled } from '@ant-design/icons'
import get from 'lodash/get'
import React, { useCallback } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { Button } from '@condo/domains/common/components/Button'
import { useTaskLauncher } from '@condo/domains/common/components/tasks/TaskLauncher'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'

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
        user: { connect: { id: get(user, 'id', null) } },
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
