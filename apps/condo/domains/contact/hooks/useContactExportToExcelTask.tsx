import get from 'lodash/get'
import React, { useCallback } from 'react'

import { Sheet } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Button } from '@open-condo/ui'

import { useTaskLauncher } from '@condo/domains/common/components/tasks/TaskLauncher'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'

import { useContactExportTaskUIInterface } from './useContactExportTaskUIInterface'

import type {
    ContactWhereInput,
    SortContactsBy,
    User,
    ContactExportTask as ContactExportTaskType,
} from '@app/condo/schema'
import type { ITask } from '@condo/domains/common/components/tasks'

type UseContactExportToExcelTaskProps = {
    where: ContactWhereInput
    sortBy: SortContactsBy[]
    format: ContactExportTaskType['format']
    locale: ContactExportTaskType['locale']
    timeZone: ContactExportTaskType['timeZone']
    user: User
}

interface IUseContactExportToExcelTask {
    ({ where, sortBy, format, locale, timeZone, user }: UseContactExportToExcelTaskProps): ({
        ExportButton: React.FC
        TaskUIInterface: ITask
    })
}

export const useContactExportToExcelTask: IUseContactExportToExcelTask = (props) => {
    const intl = useIntl()
    const ExportAsExcelTitle = intl.formatMessage({ id: 'ExportAsExcel' })

    const { ContactExportTask: TaskUIInterface } = useContactExportTaskUIInterface()

    const { where, sortBy, format, locale, timeZone, user } = props

    const { loading, handleRunTask } = useTaskLauncher(TaskUIInterface, {
        dv: 1,
        sender: getClientSideSenderInfo(),
        where,
        format,
        sortBy,
        locale,
        timeZone,
        user: { connect: { id: get(user, 'id') } },
    })

    const ExportButton = useCallback(() => (
        <Button
            type='secondary'
            children={ExportAsExcelTitle}
            onClick={handleRunTask}
            loading={loading}
            icon={<Sheet size='medium' />}
        />
    ), [loading, ExportAsExcelTitle, handleRunTask])

    return {
        ExportButton,
        TaskUIInterface,
    }
}
