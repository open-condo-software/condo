import {
    OrganizationWhereUniqueInput,
    UserWhereUniqueInput,
    PropertyWhereUniqueInput,
    NewsItemRecipientsExportTaskCreateInput,
} from '@app/condo/schema'
import { Button } from 'antd'
import React, { CSSProperties, useCallback } from 'react'

import { Download } from '@open-condo/icons'

import { useTaskLauncher } from '@condo/domains/common/components/tasks/TaskLauncher'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'

import { useNewsItemRecipientsExportTaskUIInterface } from './useNewsItemRecipientsExportTaskUIInterface'

const downloaderButtonStyle: CSSProperties = {
    background: 'transparent',
    border: 0,
    padding: '4px',
    display: 'inline-block',
}

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
            size='small'
            onClick={handleClick}
            disabled={loading}
            children={icon}
            style={downloaderButtonStyle}
        />
    ), [handleClick, loading])

    return {
        TaskUIInterface,
        NewsItemRecipientsExportToXlsxButton,
    }
}
