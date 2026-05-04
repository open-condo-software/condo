import { Row, Col } from 'antd'
import React from 'react'

import { Paperclip } from '@open-condo/icons'
import { Typography } from '@open-condo/ui'

import styles from './DocumentsPreview.module.css'

import { UploadFileType } from '../FilesUploadList'


type DocumentsPreviewProps = { files: Array<UploadFileType & { id?: string }> }

export const DocumentsPreview: React.FC<DocumentsPreviewProps> = ({ files }) => {
    return (
        <Row gutter={[0, 8]} className={styles.documentsPreviewFullWidth}>
            {
                files?.map((file, ind) => (
                    <Col key={file?.id || file?.uid || ind} span={24}  className={styles.documentsPreviewFullWidth}>
                        <div className={styles.documentsPreviewItem}>
                            <Paperclip size='small' />
                            <Typography.Text size='medium'>{file?.response?.originalName}</Typography.Text>
                        </div>
                    </Col>
                ))
            }
        </Row>
    )
}