/** @jsx jsx */
import { css, jsx } from '@emotion/react'
import { notification } from 'antd'
import { UploadFile, UploadFileStatus } from 'antd/lib/upload/interface'
import UploadList from 'antd/lib/upload/UploadList'
import React, { useCallback, useMemo } from 'react'

import { TicketFile as TicketFileType } from '@app/condo/schema'
import { useIntl } from '@condo/next/intl'

import { colors, fontSizes } from '@app/condo/domains/common/constants/style'

const DIRECT_DOWNLOAD_FILE_TYPES_REGEX = /.*\.(svg|html|htm|xml|txt)$/i

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

const ERROR_DOWNLOAD_FILE = 'Failed to download file'

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
        /*
        * NOTE
        * Problem:
        *   In the case of a redirect according to the scheme: A --request--> B --redirect--> C,
        *   it is impossible to read the response of the request.
        *
        * Solution:
        *   When adding the "shallow-redirect" header,
        *   the redirect link to the file comes in json format and a second request is made to get the file.
        *   Thus, the scheme now looks like this: A --request(1)--> B + A --request(2)--> C
        * */
        const redirectResponse = await fetch(file.url, {
            credentials: 'include',
            headers: {
                'shallow-redirect': 'true',
            },
        })
        if (!redirectResponse.ok) throw new Error(ERROR_DOWNLOAD_FILE)
        const json = await redirectResponse.json()
        const redirectUrl = json.redirectUrl
        const fileResponse = await fetch(redirectUrl)
        if (!fileResponse.ok) throw new Error(ERROR_DOWNLOAD_FILE)

        const blob = await fileResponse.blob()
        const blobUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = blobUrl
        a.download = file.name
        a.click()
    }, [])
    
    const handleFileDownload = useCallback(async (file: UploadFile) => {
        if (DIRECT_DOWNLOAD_FILE_TYPES_REGEX.test(file.name)) {
            try {
                await downloadFile(file)
            } catch (e) {
                notification.error({ message: DownloadFileErrorMessage })
            }
        } else {
            window.open(file.url, '_blank')
        }
    }, [DownloadFileErrorMessage, downloadFile])

    return (
        <div className='upload-control-wrapper' css={UploadListWrapperStyles}>
            <UploadList locale={{}} showRemoveIcon={false} items={uploadFiles} onPreview={handleFileDownload} />
        </div>
    )
}
