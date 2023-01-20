import { DatabaseFilled } from '@ant-design/icons'
import { Form, notification } from 'antd'
import { DocumentNode } from 'graphql'
import { get } from 'lodash'
import React, { useCallback } from 'react'

import { useLazyQuery } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'

import ActionBar from '@condo/domains/common/components/ActionBar'
import { Button } from '@condo/domains/common/components/Button'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'

interface IExportToExcelActionBarProps {
    hidden?: boolean
    sortBy: string | string[]
    searchObjectsQuery: string | Record<string, unknown>
    exportToExcelQuery: DocumentNode
    useTimeZone?: boolean
    disabled?: boolean
}

export const ExportToExcelActionBar: React.FC<IExportToExcelActionBarProps> = (props) => {
    const {
        searchObjectsQuery,
        sortBy,
        exportToExcelQuery,
        hidden = false,
        useTimeZone = true,
        disabled = false,
    } = props

    const intl = useIntl()
    const ExportAsExcelLabel = intl.formatMessage({ id: 'ExportAsExcel' })
    const timeZone = intl.formatters.getDateTimeFormat().resolvedOptions().timeZone

    const [
        exportToExcel,
        { loading: isXlsLoading },
    ] = useLazyQuery(
        exportToExcelQuery,
        {
            onError: error => {
                const message = get(error, ['graphQLErrors', 0, 'extensions', 'messageForUser']) || error.message
                notification.error({ message })
            },
            onCompleted: data => {
                if (window) {
                    window.location.href = data.result.linkToFile
                }
            },
        },
    )

    const variablesData = {
        dv: 1,
        sender: getClientSideSenderInfo(),
        where: searchObjectsQuery,
        sortBy: sortBy,
        timeZone: undefined,
    }
    const deps = [exportToExcel, searchObjectsQuery, sortBy, variablesData]

    if (useTimeZone) {
        variablesData.timeZone = timeZone
        deps.push(timeZone)
    }

    const handleExportToExcel = useCallback(() => {
        exportToExcel({ variables: { data: variablesData } })
    }, deps)

    return (
        <Form.Item noStyle>
            <ActionBar hidden={hidden}>
                {props.children}
                <Button
                    type='sberBlack'
                    secondary
                    icon={<DatabaseFilled/>}
                    loading={isXlsLoading}
                    onClick={handleExportToExcel}
                    disabled={disabled}
                >
                    {ExportAsExcelLabel}
                </Button>
            </ActionBar>
        </Form.Item>
    )
}
