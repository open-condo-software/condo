import { TicketFile as TicketFileType } from '@app/condo/schema'
import { css } from '@emotion/react'
import { UploadFile, UploadFileStatus } from 'antd/lib/upload/interface'
import UploadList from 'antd/lib/upload/UploadList'
import React, { useCallback, useMemo } from 'react'

import { colors, fontSizes } from '@app/condo/domains/common/constants/style'
import { useDownloadFileFromServer } from '@condo/domains/common/hooks/useDownloadFileFromServer'


interface ITicketFileListProps {
    files?: TicketFileType[]
}

const UploadListWrapperStyles = css`
  .ant-upload-list-text-container:first-child .ant-upload-list-item {
    margin-top: 0;
  }

  .ant-upload-list-item:hover .ant-upload-list-item-info {
    background-color: inherit;
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
    const { downloadFile } = useDownloadFileFromServer()

    const uploadFiles = useMemo(() => files.map(({ file }) => ({
        uid: file.id,
        name: file.originalFilename,
        status: 'done' as UploadFileStatus,
        url: file.publicUrl,
    })), [files])

    const handleFileDownload = useCallback(async (file: UploadFile) => {
        await downloadFile({ name: file.name, url: file.url })
    }, [downloadFile])

    return (
        <div className='upload-control-wrapper' css={UploadListWrapperStyles}>
            <UploadList locale={{}} showRemoveIcon={false} items={uploadFiles} onPreview={handleFileDownload} />
        </div>
    )
}
