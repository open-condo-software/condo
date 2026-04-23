import { useCreateNewsItemFileMutation, useGetNewsItemFilesLazyQuery } from '@app/condo/gql'
import { CreateNewsItemFileMutation } from '@app/condo/gql/operation.types'
import { Col, Form, Row } from 'antd'
import getConfig from 'next/config'
import { UploadRequestOption } from 'rc-upload/lib/interface'
import React, { useCallback, useMemo, useState } from 'react'

import { buildMeta, upload as uploadFiles } from '@open-condo/files'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Typography } from '@open-condo/ui'

import { Action, DBFile, FilesUploadList, UploadFileType } from '@condo/domains/news/components/FilesUploadList'


const { publicRuntimeConfig: { fileClientId } = {} } = getConfig()

const FILE_UPLOAD_MODEL = 'NewsItemFile'

type InputStepFilesSelectorProps = {
    onChange?: (files: Array<UploadFileType>) => void
    files?: Array<UploadFileType>
    modifyFiles: React.Dispatch<Action>
}

export const InputStepFilesSelector: React.FC<InputStepFilesSelectorProps> = ({
    onChange,
    files,
    modifyFiles,
}) => {
    const intl = useIntl()

    const SelectFilesLabel = intl.formatMessage({ id: 'news.fields.files.label' })
    const MediaFilesInfoMessage = intl.formatMessage({ id: 'news.fields.files.info.media' }, {
        imageTypes: ['JPG', 'PNG'].join(', '),
        imageSizeInMb: 50,
        videoTypes: ['MP4'].join(', '),
        videoSizeInMb: 500,
    })
    const DocumentsInfoMessage = intl.formatMessage({ id: 'news.fields.files.info.documents' }, {
        documentTypes: ['PDF', 'TXT', 'DOC', 'EXEL'].join(', '),
        documentSizeInMb: 10,
    })

    const { user } = useAuth()
    const { organization } = useOrganization()

    const [createNewsItemFile] = useCreateNewsItemFileMutation()

    const createFile = useCallback(async ({ file }: { file: UploadRequestOption['file'] }): Promise<DBFile> => {
        const sender = getClientSideSenderInfo()
        const dvAndSender = { dv: 1, sender }

        const fileToUpload = file as File

        let createInput

        if (fileClientId && user?.id) {
            const uploadResult = await uploadFiles({
                files: [fileToUpload],
                meta: buildMeta({
                    userId: user.id,
                    fileClientId,
                    modelNames: [FILE_UPLOAD_MODEL],
                    fingerprint: sender.fingerprint,
                    organizationId: organization?.id,
                }),
            })
            createInput = {
                signature: uploadResult.files?.[0]?.signature,
                originalFilename: fileToUpload.name,
                mimetype: fileToUpload.type,
            }
        } else {
            createInput = file
        }

        const dbFile = await createNewsItemFile({
            variables: {
                data: {
                    ...dvAndSender,
                    file: createInput,
                },
            },
        })

        return dbFile?.data?.newsItemFile
    }, [createNewsItemFile, organization?.id, user.id])

    return (
        <Col span={24}>
            <Row gutter={[0, 24]}>
                <Col span={24}>
                    <Typography.Title level={2}>{SelectFilesLabel}</Typography.Title>
                </Col>
                <Col span={24}>
                    <Row gutter={[0, 20]}>
                        <Col span={24}>
                            <FilesUploadList
                                type='upload'
                                onFilesChange={onChange}
                                fileList={files}
                                updateFileList={modifyFiles}
                                createAction={createFile}
                            />
                        </Col>
                        <Col span={24}>
                            <Row>
                                <Col span={24}>
                                    <Typography.Text size='small' type='secondary'>{MediaFilesInfoMessage},</Typography.Text>
                                </Col>
                                <Col span={24}>
                                    <Typography.Text size='small' type='secondary'>{DocumentsInfoMessage}</Typography.Text>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </Col>
    )
}
