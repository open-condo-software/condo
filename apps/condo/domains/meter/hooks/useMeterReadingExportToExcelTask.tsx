import {
    MeterReadingWhereInput, SortMeterReadingsBy, User as UserType,
} from '@app/condo/schema'
import get from 'lodash/get'
import React, { useCallback, useMemo } from 'react'

import { Sheet } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Button } from '@open-condo/ui'

import { useTaskLauncher } from '@condo/domains/common/components/tasks/TaskLauncher'
import { EXCEL } from '@condo/domains/common/constants/export'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'

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

    const locale = intl.locale
    const timeZone = useMemo(() =>
        intl.formatters.getDateTimeFormat().resolvedOptions().timeZone,
    [intl.formatters])

    const { MeterReadingExportTask: ExportMeterReadingTaskUIInterface } = useMeterReadingExportTaskUIInterface()

    const { loading, handleRunTask } = useTaskLauncher(ExportMeterReadingTaskUIInterface, {
        dv: 1,
        sender: getClientSideSenderInfo(),
        where,
        format: EXCEL,
        sortBy,
        locale,
        timeZone,
        user: { connect: { id: get(user, 'id', null) } },
    })

    const ExportButton: React.FC<MeterReadingExportButtonInputType> = useCallback(({ disabled = false, id = 'exportToExcel' }) => (
        <Button
            id={id}
            type='secondary'
            icon={<Sheet size='medium' />}
            disabled={loading || disabled}
            children={label || ExportAsExcelLabel}
            loading={loading}
            onClick={handleRunTask}
        />
    ), [ExportAsExcelLabel, handleRunTask, label, loading])

    return {
        ExportButton,
    }
}
