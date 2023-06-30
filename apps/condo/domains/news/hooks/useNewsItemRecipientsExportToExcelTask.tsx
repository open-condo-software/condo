import { OrganizationWhereUniqueInput, UserWhereUniqueInput, PropertyWhereUniqueInput } from '@app/condo/schema'
import { Button } from 'antd'
import get from 'lodash/get'
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
    organization: OrganizationWhereUniqueInput,
    user: UserWhereUniqueInput,
    scopes: { property?: PropertyWhereUniqueInput, unitType?: string, unitName?: string }[],
}
export const useNewsItemRecipientsExportToExcelTask = ({ organization, user, scopes }: Props) => {
    const { NewsItemRecipientsExportTask: TaskUIInterface } = useNewsItemRecipientsExportTaskUIInterface()

    const { loading, handleRunTask } = useTaskLauncher(TaskUIInterface, {
        dv: 1,
        sender: getClientSideSenderInfo(),
        organization: { connect: { id: get(organization, 'id', null) } },
        user: { connect: { id: get(user, 'id', null) } },
        scopes,
    })

    const NewsItemRecipientsExportToXlsxButton = useCallback(() => (
        <Button
            size='small'
            onClick={handleRunTask}
            disabled={loading}
            children={<Download size='small'/>}
            style={downloaderButtonStyle}
        />
    ), [handleRunTask, loading])

    return {
        TaskUIInterface,
        NewsItemRecipientsExportToXlsxButton,
    }
}
