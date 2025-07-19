import styled from '@emotion/styled'
import dayjs from 'dayjs'
import get from 'lodash/get'
import { useCallback } from 'react'

import { Download } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Button, Tooltip, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { getDateRender } from '@condo/domains/common/components/Table/Renders'
import { useDownloadFileFromServer } from '@condo/domains/common/hooks/useDownloadFileFromServer'


// TODO(DOMA-8877): Move button to UI-kit
const StyledButton = styled(Button)`
  border: none;
  padding: 8px;
  min-width: auto;
  height: auto;
  
  &::before, &:focus {
    border: none;
  }
  
  & > span {
    color: ${colors.gray[7]};
  }
`

export const usePropertyDocumentsTableColumns = () => {
    const intl = useIntl()
    const NameTitle = intl.formatMessage({ id: 'documents.propertyDocuments.columns.name' })
    const CategoryTitle = intl.formatMessage({ id: 'documents.propertyDocuments.columns.category' })
    const DateTitle = intl.formatMessage({ id: 'documents.propertyDocuments.columns.date' })
    const DownloadMessage = intl.formatMessage({ id: 'Download' })

    const { downloadFile } = useDownloadFileFromServer()

    const handleDownload = useCallback(async (event, document) => {
        event.stopPropagation()

        const url = get(document, 'file.publicUrl')
        const name = get(document, 'file.originalFilename')

        await downloadFile({ url, name })
    }, [downloadFile])

    const renderDownloadIcon = useCallback((document) => {
        return (
            <Tooltip title={DownloadMessage}>
                <StyledButton
                    type='secondary'
                    icon={<Download size='medium' color='inherit' />}
                    onClick={(event) => handleDownload(event, document)}
                />
            </Tooltip>
        )
    }, [DownloadMessage, handleDownload])

    const renderDate = useCallback((createdAt) => (
        <Typography.Text type='secondary' size='medium'>
            {dayjs(createdAt).format('DD.MM.YYYY')}
        </Typography.Text>
    ), [])

    return [
        {
            title: NameTitle,
            ellipsis: true,
            dataIndex: 'name',
            key: 'name',
            sorter: true,
            width: '40%',
        },
        {
            title: CategoryTitle,
            ellipsis: true,
            dataIndex: ['category', 'name'],
            key: 'category',
            sorter: true,
            width: '30%',
        },
        {
            title: DateTitle,
            ellipsis: true,
            dataIndex: 'createdAt',
            key: 'createdAt',
            sorter: true,
            render: renderDate,
            width: '23%',
        },
        {
            key: 'downloadButton',
            render: renderDownloadIcon,
            width: '7%',
        },
    ]
}