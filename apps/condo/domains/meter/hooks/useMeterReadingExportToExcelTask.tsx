import {
    MeterReadingWhereInput,
    SortMeterReadingsBy,
    User as UserType,
    MeterReadingExportTaskCreateInput,
    MeterReadingExportTaskLocaleType,
    MeterReadingExportTaskFormatType,
} from '@app/condo/schema'
import get from 'lodash/get'
import React, { useCallback, useMemo } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useIntl } from '@open-condo/next/intl'
import { Button } from '@open-condo/ui'

import { useTaskLauncher } from '@condo/domains/common/components/tasks/TaskLauncher'

import { useMeterReadingExportTaskUIInterface } from './useMeterReadingExportTaskUIInterface'


export type UseMeterReadingExportToExcelInputType = {
    label?: string
    sortBy: SortMeterReadingsBy[]
    where: MeterReadingWhereInput
    user: UserType
}

type MeterReadingExportButtonInputType = {
    disabled?: boolean
    id?: string
}

type UseMeterReadingExportToExcelReturnType = {
    ExportButton: React.FC<MeterReadingExportButtonInputType>
}

export const useMeterReadingExportToExcelTask = (props: UseMeterReadingExportToExcelInputType): UseMeterReadingExportToExcelReturnType => {
    const intl = useIntl()
    const ExportAsExcelLabel = intl.formatMessage({ id: 'ExportAsExcel' })

    const { label, where, sortBy, user } = props

    const locale = intl.locale as MeterReadingExportTaskLocaleType

    const timeZone = useMemo(() =>
        intl.formatters.getDateTimeFormat().resolvedOptions().timeZone,
    [intl.formatters])

    const { MeterReadingExportTask: ExportMeterReadingTaskUIInterface } = useMeterReadingExportTaskUIInterface()

    const { loading, handleRunTask } = useTaskLauncher<MeterReadingExportTaskCreateInput>(ExportMeterReadingTaskUIInterface, {
        dv: 1,
        sender: getClientSideSenderInfo(),
        where,
        format: MeterReadingExportTaskFormatType.Excel,
        sortBy,
        locale,
        timeZone,
        user: { connect: { id: get(user, 'id', null) } },
    })

    const handleClick = useCallback(() => handleRunTask(), [handleRunTask])
    const ExportButton: React.FC<MeterReadingExportButtonInputType> = useCallback(({ disabled = false, id = 'exportToExcel' }) => (
        <Button
            id={id}
            type='secondary'
            disabled={loading || disabled}
            children={label || ExportAsExcelLabel}
            loading={loading}
            onClick={handleClick}
        />
    ), [ExportAsExcelLabel, handleClick, label, loading])

    return {
        ExportButton,
    }
}
