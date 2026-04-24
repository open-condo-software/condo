import get from 'lodash/get'
import React, { useCallback } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useIntl } from '@open-condo/next/intl'
import { Button } from '@open-condo/ui'

import { useTaskLauncher } from '@condo/domains/common/components/tasks/TaskLauncher'

import { useContactExportTaskUIInterface } from './useContactExportTaskUIInterface'

import type { GetContactExportTasksQuery } from '@app/condo/gql'
import type {
    ContactWhereInput,
    SortContactsBy,
    User,
    ContactExportTask as ContactExportTaskType,
    ContactExportTaskCreateInput,
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

type TaskRecordType = GetContactExportTasksQuery['tasks'][number]
interface IUseContactExportToExcelTask {
    ({ where, sortBy, format, locale, timeZone, user }: UseContactExportToExcelTaskProps): ({
        ExportButton: React.FC
        TaskUIInterface: ITask<TaskRecordType>
    })
}

export const useContactExportToExcelTask: IUseContactExportToExcelTask = (props) => {
    const intl = useIntl()
    const ExportAsExcelTitle = intl.formatMessage({ id: 'ExportAsExcel' })

    const { ContactExportTask: TaskUIInterface } = useContactExportTaskUIInterface()

    const { where, sortBy, format, locale, timeZone, user } = props

    const { loading, handleRunTask } = useTaskLauncher<ContactExportTaskCreateInput>(TaskUIInterface, {
        dv: 1,
        sender: getClientSideSenderInfo(),
        where,
        format,
        sortBy,
        locale,
        timeZone,
        user: { connect: { id: get(user, 'id') } },
    })

    const handleClick = useCallback(() => handleRunTask(), [handleRunTask])
    const ExportButton = useCallback(() => (
        <Button
            type='secondary'
            children={ExportAsExcelTitle}
            onClick={handleClick}
            loading={loading}
        />
    ), [loading, ExportAsExcelTitle, handleClick])

    return {
        ExportButton,
        TaskUIInterface,
    }
}
