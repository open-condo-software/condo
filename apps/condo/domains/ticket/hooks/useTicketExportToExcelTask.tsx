import get from 'lodash/get'
import React, { useCallback } from 'react'

import { Sheet } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Button } from '@open-condo/ui'

import { useTaskLauncher } from '@condo/domains/common/components/tasks/TaskLauncher'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'

import { useTicketExportTaskUIInterface } from './useTicketExportTaskUIInterface'


export const useTicketExportToExcelTask = ({ where, sortBy, format, locale, timeZone, user }) => {
    const intl = useIntl()
    const ExportAsExcelLabel = intl.formatMessage({ id: 'exportAsExcel' })

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
            type='secondary'
            icon={<Sheet size='medium' />}
            loading={loading}
            onClick={handleRunTask}
            id='TicketsExportClick'
            children={ExportAsExcelLabel}
        />
    ), [ExportAsExcelLabel, handleRunTask, loading])

    return {
        TaskUIInterface,
        TicketsExportToXlsxButton,
    }
}
