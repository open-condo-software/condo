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

import { Action, DBFile, FilesUploadList } from '../../FilesUploadList'


const { publicRuntimeConfig: { fileClientId } = {} } = getConfig()

const FILE_UPLOAD_MODEL = 'NewsItemFile'

type InputStepFilesSelectorProps = {
    onChange
    files
    modifyFiles: React.Dispatch<Action>
}

export const useReuploadNewsItemFiles = () => {
    const { user } = useAuth()
    const { organization } = useOrganization()

    const [createNewsItemFile] = useCreateNewsItemFileMutation()
    const [getNewsItemFiles] = useGetNewsItemFilesLazyQuery()

    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [reuploadedNewsItemFiles, setReuploadedNewsItemFiles] = useState<Array<CreateNewsItemFileMutation['newsItemFile']>>(null)

    const reuploadNewsItemFile = useCallback(async (url: string, fileName: string, mimetype: string): Promise<NonNullable<CreateNewsItemFileMutation['newsItemFile']>> => {
        if (!fileClientId || !user?.id || !organization?.id) return

        const response = await fetch(url)

        if (!response.ok) {
            throw new Error('Cannot download file!')
        }

        const blob = await response.blob()

        const fileToUpload = new File(
            [blob],
            fileName,
            { type: mimetype }
        )

        const sender = getClientSideSenderInfo()
        const dvAndSender = { dv: 1, sender }

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
        const createInput = {
            signature: uploadResult.files?.[0]?.signature,
            originalFilename: fileName,
            mimetype: mimetype,
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

    const reuploadFiles = useCallback(async (newsItemId: string) => {
        if (!newsItemId) return
        if (isLoading) return

        setIsLoading(true)
        const newsItemFiles = await getNewsItemFiles({
            variables: {
                where: {
                    newsItem: { id: newsItemId },
                },
            },
        })

        const files = newsItemFiles?.data?.newsItemFiles?.filter(Boolean)?.map((newsItemFile) => newsItemFile?.file).filter(Boolean)

        const reuploadedNewsItemFiles = await Promise.all(
            files.map((file) => reuploadNewsItemFile(file.publicUrl, file.originalFilename, file.mimetype))
        )

        const result = reuploadedNewsItemFiles.filter(Boolean)

        setReuploadedNewsItemFiles(result)
        setIsLoading(false)

        return result
    }, [getNewsItemFiles, isLoading, reuploadNewsItemFile])

    return useMemo(() => ({
        isLoading,
        reuploadedNewsItemFiles,
        reuploadFiles,
    }), [isLoading, reuploadFiles, reuploadedNewsItemFiles])
}

export const InputStepFilesSelector: React.FC<InputStepFilesSelectorProps> = ({
    onChange,
    files,
    modifyFiles,
}) => {
    const intl = useIntl()

    const SelectFilesLabel = intl.formatMessage({ id: 'news.fields.files.label' })

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
                            <Form.Item
                                name='files'
                            >
                                <FilesUploadList
                                    type='upload'
                                    onFilesChange={onChange}
                                    fileList={files}
                                    updateFileList={modifyFiles}
                                    createAction={createFile}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Row>
                                <Col span={24}>
                                    <Typography.Text size='small' type='secondary'>Изображение JPG, PNG до 10 МБ, видео MP4 до ? МБ,</Typography.Text>
                                </Col>
                                <Col span={24}>
                                    <Typography.Text size='small' type='secondary'>документ PDF, TXT, DOC, EXEL до 10 МБ</Typography.Text>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </Col>
    )
}
