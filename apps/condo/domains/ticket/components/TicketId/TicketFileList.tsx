/** @jsx jsx */
import { css, jsx } from '@emotion/react'
import { notification } from 'antd'
import { UploadFile, UploadFileStatus } from 'antd/lib/upload/interface'
import UploadList from 'antd/lib/upload/UploadList'
import React, { useCallback, useMemo } from 'react'

import { TicketFile as TicketFileType } from '@app/condo/schema'
import { useIntl } from '@core/next/intl'

import { colors, fontSizes } from '@app/condo/domains/common/constants/style'

const REGEX_FORBIDDEN_TYPE_FILES = /.*\.(svg|html|txt)$/i

interface ITicketFileListProps {
    files?: TicketFileType[]
}

const UploadListWrapperStyles = css`
  .ant-upload-list-text-container:first-child .ant-upload-list-item {
    margin-top: 0;
  }
  
  & .ant-upload-span a.ant-upload-list-item-name {
    color: ${colors.black};
    text-decoration: underline;
    text-decoration-color: ${colors.lightGrey[5]};
  }
  
  .ant-upload-span .ant-upload-text-icon {
    font-size: ${fontSizes.content};
    
    & .anticon-paper-clip.anticon {
      font-size: ${fontSizes.content};
      color: ${colors.green[5]};
    }
  }
`

export const TicketFileList: React.FC<ITicketFileListProps> = ({ files }) => {
    const intl = useIntl()
    const DownloadFileErrorMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketFileList.downloadFileError' })

    const uploadFiles = useMemo(() => files.map(({ file }) => ({
        uid: file.id,
        name: file.originalFilename,
        status: 'done' as UploadFileStatus,
        url: file.publicUrl,
    })), [files])

    const downloadFile = useCallback(async (file: UploadFile) => {
        const response = await fetch(file.url)
        const blob = await response.blob()
        const blobUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = blobUrl
        a.download = file.name
        a.click()
    }, [])


    // TODO a problem with CORS on prod
    const handleFileDownload = useCallback(async (file: UploadFile) => {
        if (REGEX_FORBIDDEN_TYPE_FILES.test(file.name)) {
            try {
                await downloadFile(file)
            } catch (e) {
                notification.error({ message: DownloadFileErrorMessage })
            }
        } else {
            window.open(file.url, '_blank')
        }
    }, [])

    return (
        <div className={'upload-control-wrapper'} css={UploadListWrapperStyles}>
            <UploadList locale={{}} showRemoveIcon={false} items={uploadFiles} />
        </div>
    )
}
