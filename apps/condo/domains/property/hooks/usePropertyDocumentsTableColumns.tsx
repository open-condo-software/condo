import { DocumentWhereInput } from '@app/condo/schema'
import get from 'lodash/get'
import { useCallback } from 'react'

import { Download } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Button } from '@open-condo/ui'

import { getDateRender } from '@condo/domains/common/components/Table/Renders'
import { useDownloadFileFromServer } from '@condo/domains/common/hooks/useDownloadFileFromServer'
import { FiltersMeta } from '@condo/domains/common/utils/filters.utils'


export const usePropertyDocumentsTableColumns = () => {
    const intl = useIntl()

    const { downloadFile } = useDownloadFileFromServer()
    
    const handleDownload = useCallback(async (event, document) => {
        event.stopPropagation()

        const url = get(document, 'file.publicUrl')
        const name = get(document, 'file.originalFilename')

        await downloadFile({ url, name })
    }, [downloadFile])

    const renderDownloadIcon = useCallback((document) => {
        return (
            <Button
                type='secondary'
                icon={<Download size='medium' />}
                onClick={(event) => handleDownload(event, document)}
            />
        )
    }, [handleDownload])

    return [
        {
            title: 'Имя файла',
            ellipsis: true,
            dataIndex: 'name',
            key: 'name',
            sorter: true,
            width: '40%',
        },
        {
            title: 'Категория',
            ellipsis: true,
            dataIndex: ['category', 'name'],
            key: 'category',
            sorter: true,
            width: '30%',
        },
        {
            title: 'Дата загрузки',
            ellipsis: true,
            dataIndex: 'createdAt',
            key: 'createdAt',
            sorter: true,
            render: getDateRender(intl),
            width: '20%',
        },
        {
            key: 'downloadButton',
            render: renderDownloadIcon,
            width: '10%',
        },
    ]
}