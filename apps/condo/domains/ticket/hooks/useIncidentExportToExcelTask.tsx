import {
    IncidentWhereInput,
    SortIncidentsBy,
    User as UserType,
    IncidentExportTaskCreateInput,
    IncidentExportTaskFormatType,
} from '@app/condo/schema'
import React, { useCallback, useMemo } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useIntl } from '@open-condo/next/intl'
import { Button } from '@open-condo/ui'

import { useTaskLauncher } from '@condo/domains/common/components/tasks/TaskLauncher'
import { useIncidentExportTaskUIInterface } from '@condo/domains/ticket/hooks/useIncidentExportTaskUIInterface'


export type UseIncidentExportToExcelInputType = {
    label?: string
    sortBy: SortIncidentsBy[]
    where: IncidentWhereInput
    user: UserType
}

type ExportButtonInputType = {
    disabled?: boolean
    id?: string
}

type UseIncidentExportToExcelReturnType = {
    ExportButton: React.FC<ExportButtonInputType>
}

export const useIncidentExportToExcelTask = (props: UseIncidentExportToExcelInputType): UseIncidentExportToExcelReturnType => {
    const intl = useIntl()
    const ExportAsExcelLabel = intl.formatMessage({ id: 'ExportAsExcel' })

    const { label, where, sortBy, user } = props

    const locale = intl.locale
    const timeZone = useMemo(() => intl.formatters.getDateTimeFormat().resolvedOptions().timeZone, [intl.formatters])

    const { IncidentExportTask: TaskUIInterface } = useIncidentExportTaskUIInterface()

    const { loading, handleRunTask } = useTaskLauncher<IncidentExportTaskCreateInput>(TaskUIInterface, {
        dv: 1,
        sender: getClientSideSenderInfo(),
        where,
        format: IncidentExportTaskFormatType.Excel,
        sortBy,
        locale,
        timeZone,
        user: { connect: { id: user?.id || null } },
    })

    const handleClick = useCallback(() => handleRunTask(), [handleRunTask])
    const ExportButton: React.FC<ExportButtonInputType> = useCallback(({ disabled = false, id = 'exportToExcel' }) => (
        <Button
            type='secondary'
            loading={loading}
            onClick={handleClick}
            disabled={loading || disabled}
            children={label || ExportAsExcelLabel}
            id={id}
        />
    ), [ExportAsExcelLabel, handleClick, label, loading])

    return {
        ExportButton,
    }
}
