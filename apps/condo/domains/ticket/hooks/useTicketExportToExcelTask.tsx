import { TicketExportTaskCreateInput }  from '@app/condo/schema'
import React, { useCallback } from 'react'

import { Sheet } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Button } from '@open-condo/ui'

import { useTaskLauncher } from '@condo/domains/common/components/tasks/TaskLauncher'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'

import { useTicketExportTaskUIInterface } from './useTicketExportTaskUIInterface'


export const useTicketExportToExcelTask = ({ where, sortBy, format, locale, timeZone, user }) => {
    const intl = useIntl()
    const ExportAsExcelLabel = intl.formatMessage({ id: 'ExportAsExcel' })

    const { TicketExportTask: TaskUIInterface } = useTicketExportTaskUIInterface()

    const { loading, handleRunTask } = useTaskLauncher<TicketExportTaskCreateInput>(TaskUIInterface, {
        dv: 1,
        sender: getClientSideSenderInfo(),
        where,
        format,
        sortBy,
        locale,
        timeZone,
        user: { connect: { id: user?.id || null } },
    })

    const handleClick = useCallback(() => handleRunTask(), [handleRunTask])
    const TicketsExportToXlsxButton = useCallback(() => (
        <Button
            type='secondary'
            icon={<Sheet size='medium' />}
            loading={loading}
            onClick={handleClick}
            id='TicketsExportClick'
            children={ExportAsExcelLabel}
        />
    ), [ExportAsExcelLabel, handleClick, loading])

    return {
        TaskUIInterface,
        TicketsExportToXlsxButton,
    }
}
