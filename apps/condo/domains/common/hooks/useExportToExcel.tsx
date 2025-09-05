import { notification } from 'antd'
import { DocumentNode } from 'graphql'
import { get } from 'lodash'
import React, { useCallback } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useLazyQuery } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { Button } from '@open-condo/ui'



export type UseExportToExcelInputType = {
    sortBy: string | string[]
    searchObjectsQuery: string | Record<string, unknown>
    exportToExcelQuery: DocumentNode
    useTimeZone?: boolean
    label?: string
}

type ExportButtonInputType = {
    disabled?: boolean
    id?: string
}

type UseExportToExcelReturnType = {
    ExportButton: React.FC<ExportButtonInputType>
}

export const useExportToExcel = (props: UseExportToExcelInputType): UseExportToExcelReturnType => {
    const intl = useIntl()
    const ExportAsExcelLabel = intl.formatMessage({ id: 'ExportAsExcel' })

    const timeZone = intl.formatters.getDateTimeFormat().resolvedOptions().timeZone

    const {
        searchObjectsQuery,
        sortBy,
        exportToExcelQuery,
        label,
        useTimeZone = true,
    } = props

    const [
        exportToExcel,
        { loading: isXlsLoading },
    ] = useLazyQuery(
        exportToExcelQuery,
        {
            onError: error => {
                const message = get(error, ['graphQLErrors', 0, 'extensions', 'messageForUser']) as string || error.message
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

    const ExportButton: React.FC<ExportButtonInputType> = useCallback(({ disabled = false, id = 'exportToExcel' }) => (
        <Button
            type='secondary'
            loading={isXlsLoading}
            onClick={handleExportToExcel}
            disabled={isXlsLoading || disabled}
            children={label || ExportAsExcelLabel}
            id={id}
        />
    ), [ExportAsExcelLabel, handleExportToExcel, isXlsLoading, label])

    return {
        ExportButton,
    }
}
