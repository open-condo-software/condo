import { useCreateNewsItemFileMutation } from '@app/condo/gql'
import { Col, Form, FormInstance, notification, Row } from 'antd'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { FilesUploadList } from '../../FilesUploadList'


export const InputStepFilesSelector: React.FC<any> = ({
    onChange,
    files,
    modifyFiles,
}) => {
    const intl = useIntl()

    const SelectFilesLabel = intl.formatMessage({ id: 'news.fields.files.label' })

    const [createNewsItemFile] = useCreateNewsItemFileMutation()

    return (
        <Col span={14}>
            <Row>
                <Col span={24}>
                    <Typography.Title level={2}>{SelectFilesLabel}</Typography.Title>
                </Col>
                <Col span={24}>
                    <Form.Item
                        name='files'
                    >
                        <FilesUploadList
                            type='upload'
                            onFilesChange={onChange}
                            fileList={files}
                            updateFileList={modifyFiles}
                        />
                    </Form.Item>
                </Col>
            </Row>
        </Col>
    )
}
