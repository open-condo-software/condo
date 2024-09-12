import {
    MeterReadingWhereInput, SortMeterReadingsBy, User as UserType,
} from '@app/condo/schema'
import { get } from 'lodash'
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

type ExportButtonInputType = {
    disabled?: boolean
    id?: string
}

type UseMeterReadingExportToExcelReturnType = {
    ExportButton: React.FC<ExportButtonInputType>
}

export const useMeterReadingExportToExcelTask = (props: UseMeterReadingExportToExcelInputType): UseMeterReadingExportToExcelReturnType => {
    const intl = useIntl()
    const ExportAsExcelLabel = intl.formatMessage({ id: 'ExportAsExcel' })

    const { label, where, sortBy, user } = props

    const locale = intl.locale
    const timeZone = useMemo(() => intl.formatters.getDateTimeFormat().resolvedOptions().timeZone, [intl.formatters])

    const { MeterReadingExportTask: TaskUIInterface } = useMeterReadingExportTaskUIInterface()

    const { loading, handleRunTask } = useTaskLauncher(TaskUIInterface, {
        dv: 1,
        sender: getClientSideSenderInfo(),
        where,
        format: EXCEL,
        sortBy,
        locale,
        timeZone,
        user: { connect: { id: get(user, 'id', null) } },
    })

    const ExportButton: React.FC<ExportButtonInputType> = useCallback(({ disabled = false, id = 'exportToExcel' }) => (
        <Button
            type='secondary'
            loading={loading}
            onClick={handleRunTask}
            disabled={loading || disabled}
            children={label || ExportAsExcelLabel}
            icon={<Sheet size='medium' />}
            id={id}
        />
    ), [ExportAsExcelLabel, handleRunTask, label, loading])

    return {
        ExportButton,
    }
}
