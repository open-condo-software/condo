import { useCreateNewsItemFileMutation } from '@app/condo/gql'
import { B2BAppNewsSharingConfig } from '@app/condo/schema'
import { Col, Row } from 'antd'
import getConfig from 'next/config'
import { UploadRequestOption } from 'rc-upload/lib/interface'
import React, { useCallback } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { buildMeta, upload as uploadFiles } from '@open-condo/files'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Typography } from '@open-condo/ui'

import { Loader } from '@condo/domains/common/components/Loader'
import { NEWS_ITEM_FILES } from '@condo/domains/common/constants/featureflags'
import { Action, DBFile, FilesUploadList, UploadFileType } from '@condo/domains/news/components/FilesUploadList'
import { SIZE_LIMIT_BY_FILE_TYPE } from '@condo/domains/news/constants/uploads'


const { publicRuntimeConfig: { fileClientId } = {} } = getConfig()

const FILE_UPLOAD_MODEL = 'NewsItemFile'

type InputStepFilesSelectorProps = {
    onChange?: (files: Array<UploadFileType>) => void
    files?: Array<UploadFileType>
    modifyFiles: React.Dispatch<Action>
    newsSharingConfig: B2BAppNewsSharingConfig
    isSharingStep: boolean
    isLoaded?: boolean
}

export const InputStepFilesSelector: React.FC<InputStepFilesSelectorProps> = ({
    onChange,
    files,
    modifyFiles,
    newsSharingConfig,
    isSharingStep,
    isLoaded,
}) => {
    const intl = useIntl()

    const SelectFilesLabel = intl.formatMessage({ id: 'news.fields.files.label' })
    const MediaFilesInfoMessage = intl.formatMessage({ id: 'news.fields.files.info.media' }, {
        imageTypes: SIZE_LIMIT_BY_FILE_TYPE.image.extensions.join(', '),
        imageSizeInMb: SIZE_LIMIT_BY_FILE_TYPE.image.limitSizeInMb,
        videoTypes: SIZE_LIMIT_BY_FILE_TYPE.video.extensions.join(', '),
        videoSizeInMb: SIZE_LIMIT_BY_FILE_TYPE.video.limitSizeInMb,
    })
    const DocumentsInfoMessage = intl.formatMessage({ id: 'news.fields.files.info.documents' }, {
        documentTypes: SIZE_LIMIT_BY_FILE_TYPE.documents.extensions.join(', '),
        documentSizeInMb: SIZE_LIMIT_BY_FILE_TYPE.documents.limitSizeInMb,
    })

    const { useFlag } = useFeatureFlags()
    const isNewsItemFilesEnabled = useFlag(NEWS_ITEM_FILES)

    const { user } = useAuth()
    const { organization } = useOrganization()

    const isCustomForm = !!newsSharingConfig?.customFormUrl && isSharingStep

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
    }, [createNewsItemFile, organization?.id, user?.id])

    if (!isNewsItemFilesEnabled) return null

    if (isCustomForm) return null

    if (!isLoaded) return <Loader />

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
                                type={isSharingStep ? 'view' : 'upload'}
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
