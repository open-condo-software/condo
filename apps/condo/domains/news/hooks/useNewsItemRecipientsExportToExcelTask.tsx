import {
    OrganizationWhereUniqueInput,
    UserWhereUniqueInput,
    PropertyWhereUniqueInput,
    NewsItemRecipientsExportTaskCreateInput,
} from '@app/condo/schema'
import React, { useCallback } from 'react'

import { Download } from '@open-condo/icons'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils'
import { Button } from '@open-condo/ui'

import { useTaskLauncher } from '@condo/domains/common/components/tasks/TaskLauncher'

import { useNewsItemRecipientsExportTaskUIInterface } from './useNewsItemRecipientsExportTaskUIInterface'

type Props = {
    organization: OrganizationWhereUniqueInput
    user: UserWhereUniqueInput
    scopes: Array<{ property?: PropertyWhereUniqueInput, unitType?: string, unitName?: string }>
    icon?: JSX.Element
}


export const useNewsItemRecipientsExportToExcelTask = ({ organization, user, scopes, icon = <Download size='small'/> }: Props) => {
    const { NewsItemRecipientsExportTask: TaskUIInterface } = useNewsItemRecipientsExportTaskUIInterface()

    const { loading, handleRunTask } = useTaskLauncher<NewsItemRecipientsExportTaskCreateInput>(TaskUIInterface, {
        dv: 1,
        sender: getClientSideSenderInfo(),
        organization: { connect: { id: organization?.id || null } },
        user: { connect: { id: user?.id || null } },
        scopes,
    })

    const handleClick = useCallback(() => handleRunTask(), [handleRunTask])
    const NewsItemRecipientsExportToXlsxButton = useCallback(() => (
        <Button
            type='primary'
            size='medium'
            onClick={handleClick}
            disabled={loading}
            minimal
            compact
            icon={icon}
        />
    ), [handleClick, loading, icon])

    return {
        TaskUIInterface,
        NewsItemRecipientsExportToXlsxButton,
    }
}
